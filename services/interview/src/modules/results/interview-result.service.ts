import { Injectable, HttpStatus, Inject } from '@nestjs/common';
import { RpcException, ClientProxy } from '@nestjs/microservices';
import { AuditLogService } from '@wr/database';
import { PrismaService } from '../../common/database/prisma.service';
import {
  AuditAction,
  AuditEntityType,
  InterviewStatus,
  RecruitmentRequestStatus,
  NotificationType,
  UserRole,
} from '@wr/contracts';

@Injectable()
export class InterviewResultService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
  ) {}

  /**
   * List all completed or past interviews.
   */
  async listCompleted(payload: { userId?: string; role?: string } = {}) {
    const where: any = {
      status: { not: InterviewStatus.CANCELLED },
      OR: [{ status: InterviewStatus.COMPLETED }, { scheduledAt: { lte: new Date() } }],
    };

    if (payload.role === UserRole.DEPARTMENT_HEAD && payload.userId) {
      where.AND = [
        {
          OR: [
            { interviewers: { has: payload.userId } },
            { request: { createdById: payload.userId } },
            { request: { department: { headUserId: payload.userId } } },
          ],
        },
      ];
    }
    if (payload.role === UserRole.HR_RECRUITER && payload.userId) {
      where.AND = [{ interviewers: { has: payload.userId } }];
    }

    const schedules = await this.prisma.interviewSchedule.findMany({
      where,
      include: {
        candidate: true,
        request: {
          include: {
            department: true,
          },
        },
        results: {
          include: {
            evaluator: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    const requestIds = [...new Set(schedules.map((schedule) => schedule.requestId))];
    const infoRequestLogs =
      requestIds.length > 0
        ? await this.prisma.requestLog.findMany({
            where: {
              requestId: { in: requestIds },
              action: 'FINAL_DECISION_INFO_REQUESTED',
            },
            orderBy: { createdAt: 'desc' },
          })
        : [];

    return schedules.map((s) => {
      const status =
        s.finalRecommendation || s.status === InterviewStatus.COMPLETED
          ? 'Recorded'
          : 'Pending Recording';
      const latestInfoRequest = infoRequestLogs.find((log) => {
        if (log.requestId !== s.requestId || !log.metadata || typeof log.metadata !== 'object') {
          return false;
        }
        const metadata = log.metadata as Record<string, unknown>;
        return metadata.candidateId === s.candidateId;
      });
      const decisionStatus =
        s.request.status === RecruitmentRequestStatus.OFFER_EXTENDED ||
        s.request.status === RecruitmentRequestStatus.OFFER_ACCEPTED
          ? 'Approved'
          : s.request.status === RecruitmentRequestStatus.REJECTED
            ? 'Rejected'
            : latestInfoRequest
              ? 'Request Info'
              : 'Awaiting Decision';
      const evaluatorIds = [
        ...new Set([
          ...s.interviewers,
          ...s.results.map((result) => result.evaluatorId).filter((id): id is string => !!id),
        ]),
      ];
      const resultsByEvaluator = new Map(s.results.map((result) => [result.evaluatorId, result]));
      const feedbacks = evaluatorIds.map((interviewerId) => {
        const result = resultsByEvaluator.get(interviewerId);
        return {
          name: result?.evaluator?.displayName || 'Panel member',
          role: result?.evaluator?.role || 'Interviewer',
          status: result ? result.result : 'PENDING',
          ratings: result
            ? {
                tech: result.technical || 0,
                comm: result.communication || 0,
                fit: result.culture || 0,
              }
            : undefined,
          comment: result?.notes || 'Feedback has not been recorded.',
        };
      });
      const recordedResults = s.results.filter(
        (result) =>
          result.technical !== null && result.communication !== null && result.culture !== null,
      );
      const average = (field: 'technical' | 'communication' | 'culture') =>
        recordedResults.length > 0
          ? Number(
              (
                recordedResults.reduce((sum, result) => sum + (result[field] || 0), 0) /
                recordedResults.length
              ).toFixed(1),
            )
          : 0;

      const formattedTime =
        s.scheduledAt.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }) +
        ', ' +
        s.scheduledAt.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

      return {
        id: s.id,
        candidate: s.candidate.fullName,
        role: s.request.position,
        department: s.request.department.name,
        time: formattedTime,
        status,
        location: s.location,
        candidateId: s.candidateId,
        requestId: s.requestId,
        interviewDate: s.scheduledAt,
        decisionStatus,
        feedbacks,
        passCount: s.results.filter((result) => result.result === 'PASS').length,
        failCount: s.results.filter((result) => result.result === 'FAIL').length,
        pendingCount: Math.max(0, evaluatorIds.length - s.results.length),
        scores: {
          tech: average('technical'),
          comm: average('communication'),
          fit: average('culture'),
        },
        finalRecommendation: s.finalRecommendation || '',
        summaryNotes: s.summaryNotes || '',
      };
    });
  }

  /**
   * Get completed interview details including panel members and their feedbacks.
   */
  async getDetails(id: string, actor: { userId?: string; role?: string } = {}) {
    const schedule = await this.prisma.interviewSchedule.findUnique({
      where: { id },
      include: {
        candidate: true,
        request: {
          include: {
            department: true,
          },
        },
        results: {
          include: {
            evaluator: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Interview schedule ${id} not found`,
      });
    }

    if (
      actor.role === UserRole.DEPARTMENT_HEAD &&
      actor.userId &&
      !this.canDepartmentHeadAccessSchedule(schedule, actor.userId)
    ) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'You do not have access to this interview result',
      });
    }
    if (
      actor.role === UserRole.HR_RECRUITER &&
      actor.userId &&
      !schedule.interviewers.includes(actor.userId)
    ) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'Only HR recruiters invited to this interview can view its result',
      });
    }

    const evaluatorIds = [
      ...new Set([
        ...schedule.interviewers,
        ...schedule.results
          .map((result) => result.evaluatorId)
          .filter((userId): userId is string => !!userId),
      ]),
    ];

    // Fetch details of all panel members and evaluators with recorded feedback.
    const interviewers = await this.prisma.user.findMany({
      where: {
        id: { in: evaluatorIds },
      },
    });

    // Map each evaluator to their feedback (recorded or default empty for scheduled panel).
    const feedbacks = evaluatorIds.map((interviewerId) => {
      const interviewer = interviewers.find((u) => u.id === interviewerId);
      const result = schedule.results.find((r) => r.evaluatorId === interviewerId);

      const initials = interviewer
        ? interviewer.displayName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
        : 'U';

      return {
        id: interviewerId,
        member: interviewer?.displayName || 'Unknown User',
        role: interviewer?.role || 'Interviewer',
        initials,
        decision: result ? (result.result as 'PASS' | 'FAIL') : 'PASS',
        technical:
          result?.technical !== undefined && result?.technical !== null ? result.technical : 0,
        communication:
          result?.communication !== undefined && result?.communication !== null
            ? result.communication
            : 0,
        culture: result?.culture !== undefined && result?.culture !== null ? result.culture : 0,
        notes: result?.notes || '',
        isRecorded: !!result,
      };
    });

    const formattedTime =
      schedule.scheduledAt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }) +
      ', ' +
      schedule.scheduledAt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

    const myFeedback =
      actor.userId && feedbacks.find((feedback) => feedback.id === actor.userId)
        ? feedbacks.find((feedback) => feedback.id === actor.userId)
        : null;

    return {
      id: schedule.id,
      candidate: schedule.candidate.fullName,
      role: schedule.request.position,
      department: schedule.request.department.name,
      time: formattedTime,
      status:
        schedule.finalRecommendation || schedule.status === InterviewStatus.COMPLETED
          ? 'Recorded'
          : 'Pending Recording',
      location: schedule.location,
      interviewers: interviewers.map((u) => ({
        id: u.id,
        name: u.displayName,
        role: u.role,
        initials: u.displayName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase(),
      })),
      feedbacks,
      myFeedback,
      canSubmitMyFeedback:
        !!actor.userId &&
        (((actor.role === UserRole.HR_LEADER || actor.role === UserRole.HR_RECRUITER) &&
          schedule.interviewers.includes(actor.userId)) ||
          (actor.role === UserRole.DEPARTMENT_HEAD &&
            this.canDepartmentHeadAccessSchedule(schedule, actor.userId))),
      finalRecommendation: schedule.finalRecommendation || '',
      summaryNotes: schedule.summaryNotes || '',
    };
  }

  async recordMyFeedback(payload: {
    interviewId: string;
    evaluatorId: string;
    actorRole: string;
    decision: 'PASS' | 'FAIL';
    technical: number;
    communication: number;
    culture: number;
    notes?: string;
  }) {
    const {
      interviewId,
      evaluatorId,
      actorRole,
      decision,
      technical,
      communication,
      culture,
      notes,
    } = payload;

    const schedule = await this.prisma.interviewSchedule.findUnique({
      where: { id: interviewId },
      include: {
        candidate: true,
        request: {
          include: {
            department: true,
          },
        },
        results: true,
      },
    });

    if (!schedule) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Interview schedule ${interviewId} not found`,
      });
    }

    if (schedule.status === InterviewStatus.CANCELLED) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: 'Cannot record feedback for a cancelled interview',
      });
    }

    if (schedule.status !== InterviewStatus.COMPLETED && schedule.scheduledAt > new Date()) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: 'Feedback can only be recorded after the interview time',
      });
    }

    const canRecord =
      ((actorRole === UserRole.HR_LEADER || actorRole === UserRole.HR_RECRUITER) &&
        schedule.interviewers.includes(evaluatorId)) ||
      (actorRole === UserRole.DEPARTMENT_HEAD &&
        this.canDepartmentHeadAccessSchedule(schedule, evaluatorId));

    if (!canRecord) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'You do not have permission to record feedback for this interview',
      });
    }

    if (!['PASS', 'FAIL'].includes(decision)) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'decision must be PASS or FAIL',
      });
    }

    for (const [label, value] of [
      ['technical', technical],
      ['communication', communication],
      ['culture', culture],
    ] as const) {
      if (!Number.isInteger(value) || value < 0 || value > 10) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `${label} must be an integer from 0 to 10`,
        });
      }
    }

    const evaluator = await this.prisma.user.findUnique({
      where: { id: evaluatorId },
    });
    if (!evaluator) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Evaluator user ${evaluatorId} not found`,
      });
    }

    const existing = await this.prisma.interviewResult.findFirst({
      where: { interviewId, evaluatorId },
    });

    const saved = existing
      ? await this.prisma.interviewResult.update({
          where: { id: existing.id },
          data: {
            result: decision,
            notes: notes?.trim() || null,
            technical,
            communication,
            culture,
          },
        })
      : await this.prisma.interviewResult.create({
          data: {
            interviewId,
            evaluatorId,
            result: decision,
            notes: notes?.trim() || null,
            technical,
            communication,
            culture,
          },
        });

    this.auditLog
      .log({
        entityType: AuditEntityType.INTERVIEW_RESULT,
        entityId: saved.id,
        action: AuditAction.INTERVIEW_RESULT_RECORDED,
        toStatus: saved.result,
        performedById: evaluatorId,
        reason: saved.notes,
        metadata: {
          interviewId,
          candidateId: schedule.candidateId,
          evaluatorId,
          source: 'personal-feedback',
        },
      })
      .catch((err) =>
        console.error('Failed to write audit log for personal interview feedback:', err),
      );

    return {
      success: true,
      feedback: {
        id: evaluatorId,
        member: evaluator.displayName,
        role: evaluator.role,
        initials: this.getInitials(evaluator.displayName),
        decision: saved.result as 'PASS' | 'FAIL',
        technical: saved.technical ?? 0,
        communication: saved.communication ?? 0,
        culture: saved.culture ?? 0,
        notes: saved.notes ?? '',
        isRecorded: true,
      },
    };
  }

  private canDepartmentHeadAccessSchedule(
    schedule: {
      interviewers: string[];
      request?: {
        createdById?: string | null;
        department?: { headUserId?: string | null } | null;
      } | null;
    },
    userId: string,
  ) {
    return (
      schedule.interviewers.includes(userId) ||
      schedule.request?.createdById === userId ||
      schedule.request?.department?.headUserId === userId
    );
  }

  private getInitials(name: string) {
    return (
      name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 3)
        .toUpperCase() || 'U'
    );
  }

  /**
   * T-053: Record interview results with detailed panel feedback, scoring,
   * and final recommendations. Updates candidate pipeline status (FR-15).
   */
  async recordResult(payload: {
    interviewId: string;
    feedbacks: Array<{
      evaluatorId: string;
      decision: 'PASS' | 'FAIL';
      technical: number;
      communication: number;
      culture: number;
      notes: string;
    }>;
    finalRecommendation: string;
    summaryNotes?: string;
    evaluatorId?: string;
    actorRole?: string;
  }) {
    const { interviewId, feedbacks, finalRecommendation, summaryNotes, evaluatorId, actorRole } =
      payload;

    const schedule = await this.prisma.interviewSchedule.findUnique({
      where: { id: interviewId },
      include: {
        candidate: true,
        request: true,
      },
    });

    if (!schedule) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Interview schedule ${interviewId} not found`,
      });
    }

    if (schedule.status === InterviewStatus.CANCELLED) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: 'Cannot record a result for a cancelled interview',
      });
    }

    if (actorRole && actorRole !== UserRole.HR_LEADER) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'Only HR Leader can submit the final recommendation to Admin',
      });
    }

    const validRecommendations = ['Recommend Hire', 'Recommend Reject', 'Hold for Further'];
    if (!validRecommendations.includes(finalRecommendation)) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `finalRecommendation must be one of: ${validRecommendations.join(', ')}`,
      });
    }

    // Verify evaluator exists if provided
    if (evaluatorId) {
      const evaluator = await this.prisma.user.findUnique({
        where: { id: evaluatorId },
      });
      if (!evaluator) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Evaluator user ${evaluatorId} not found`,
        });
      }
    }

    // Find the candidate application
    const application = await this.prisma.application.findUnique({
      where: {
        requestId_candidateId: {
          requestId: schedule.requestId,
          candidateId: schedule.candidateId,
        },
      },
    });

    if (!application) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Application for candidate ${schedule.candidateId} in request ${schedule.requestId} not found`,
      });
    }

    // Check for other active schedules for the request
    const activeSchedulesCount = await this.prisma.interviewSchedule.count({
      where: {
        requestId: schedule.requestId,
        status: { in: [InterviewStatus.SCHEDULED, InterviewStatus.RESCHEDULED] },
        id: { not: interviewId },
      },
    });

    const isLastInterview = activeSchedulesCount === 0;

    const nextAppStatus = RecruitmentRequestStatus.INTERVIEW_COMPLETED;

    // Find existing interview results to see what needs to be created vs updated
    const existingResults = await this.prisma.interviewResult.findMany({
      where: { interviewId },
    });

    const transactions: any[] = [];

    // 1. Create or Update InterviewResult records for each panel member feedback
    for (const fb of feedbacks) {
      const existing = existingResults.find((r) => r.evaluatorId === fb.evaluatorId);
      if (existing) {
        transactions.push(
          this.prisma.interviewResult.update({
            where: { id: existing.id },
            data: {
              result: fb.decision,
              notes: fb.notes?.trim() || null,
              technical: fb.technical,
              communication: fb.communication,
              culture: fb.culture,
            },
          }),
        );
      } else {
        transactions.push(
          this.prisma.interviewResult.create({
            data: {
              interviewId,
              evaluatorId: fb.evaluatorId,
              result: fb.decision,
              notes: fb.notes?.trim() || null,
              technical: fb.technical,
              communication: fb.communication,
              culture: fb.culture,
            },
          }),
        );
      }
    }

    // 2. Mark Schedule as COMPLETED, and record recommendation
    transactions.push(
      this.prisma.interviewSchedule.update({
        where: { id: interviewId },
        data: {
          status: InterviewStatus.COMPLETED,
          finalRecommendation,
          summaryNotes: summaryNotes?.trim() || null,
        },
      }),
    );

    // 3. Mark the candidate application ready for Admin final decision.
    transactions.push(
      this.prisma.application.update({
        where: { id: application.id },
        data: { status: nextAppStatus },
      }),
    );

    // 4. Create RequestLog for candidate evaluation outcome
    transactions.push(
      this.prisma.requestLog.create({
        data: {
          requestId: schedule.requestId,
          action:
            finalRecommendation === 'Recommend Hire'
              ? 'CANDIDATE_PASSED_INTERVIEW'
              : finalRecommendation === 'Recommend Reject'
                ? 'CANDIDATE_FAILED_INTERVIEW'
                : 'CANDIDATE_HOLD_INTERVIEW',
          performedById: evaluatorId || 'SYSTEM',
          metadata: {
            interviewId,
            candidateId: schedule.candidateId,
            finalRecommendation,
            summaryNotes: summaryNotes?.trim() || null,
          },
        },
      }),
    );

    // 5. If all schedules are finished, transition RecruitmentRequest to Admin review.
    if (isLastInterview) {
      transactions.push(
        this.prisma.recruitmentRequest.update({
          where: { id: schedule.requestId },
          data: { status: RecruitmentRequestStatus.INTERVIEW_COMPLETED },
        }),
        this.prisma.requestLog.create({
          data: {
            requestId: schedule.requestId,
            action: 'INTERVIEW_STAGE_COMPLETED',
            fromStatus: schedule.request.status,
            toStatus: RecruitmentRequestStatus.INTERVIEW_COMPLETED,
            performedById: evaluatorId || 'SYSTEM',
            metadata: {
              completedAt: new Date().toISOString(),
            },
          },
        }),
      );
    }

    await this.prisma.$transaction(transactions);

    // Fetch updated results to log them in AuditLogs
    const updatedResults = await this.prisma.interviewResult.findMany({
      where: { interviewId },
    });

    for (const res of updatedResults) {
      this.auditLog
        .log({
          entityType: AuditEntityType.INTERVIEW_RESULT,
          entityId: res.id,
          action: AuditAction.INTERVIEW_RESULT_RECORDED,
          toStatus: res.result,
          performedById: evaluatorId || 'SYSTEM',
          reason: res.notes,
          metadata: {
            interviewId,
            candidateId: schedule.candidateId,
            evaluatorId: res.evaluatorId,
          },
        })
        .catch((err) =>
          console.error('Failed to write audit log for INTERVIEW_RESULT_RECORDED:', err),
        );
    }

    // --- Next-step communications & workflows ---

    // Candidate rejection emails are sent only after Admin's final Not Hire decision.
    if (false) {
      /*
      const emailSubject = `Application Update: ${schedule!.request.position}`;
      const emailBody = [
        `Dear ${schedule!.candidate.fullName},`,
        '',
        `Thank you for taking the time to interview with us for the position of ${schedule!.request.position}.`,
        '',
        `We appreciate your interest in our company, but we regret to inform you that we have decided to move forward with other candidates at this stage.`,
        '',
        'We wish you all the best in your job search and future endeavors.',
        '',
        'Best regards,',
        'HR Team — Recruitment Management System',
      ].join('\n');

      const notifTitle = 'Application Update';
      const notifBody = `Your application for ${schedule!.request.position} was not selected.`;

      // Enqueue email
      this.notificationClient
        .send('notification.send_email', {
          userId: schedule!.candidate.userId,
          toEmail: schedule!.candidate.email,
          subject: emailSubject,
          body: emailBody,
        })
        .subscribe({
          error: (err) => console.error('Failed to send rejection email:', err),
        });

      // Send in-app notification
      this.notificationClient
        .send('notification.create_notification', {
          userId: schedule!.candidate.userId,
          type: NotificationType.REJECTION,
          title: notifTitle,
          body: notifBody,
          relatedEntityId: schedule!.requestId,
          relatedEntityType: 'RecruitmentRequest',
        })
        .subscribe({
          error: (err) => console.error('Failed to send rejection notification:', err),
        });
      */
    }

    // Notify Admins to review HR's recommendation and make the final decision (FR-15).
    if (isLastInterview) {
      this.notificationClient
        .send('notification.send_to_role', {
          role: UserRole.ADMIN,
          title: 'Review Required: Interview Stage Completed',
          body:
            `HR submitted "${finalRecommendation}" for ${schedule.candidate.fullName} ` +
            `on "${schedule.request.position}". Please review and make the final Hire/Not Hire decision.`,
          type: NotificationType.PLAN_UPDATE,
          relatedEntityId: schedule.requestId,
          relatedEntityType: 'RecruitmentRequest',
        })
        .subscribe({
          error: (err) => console.error('Failed to send Admin review notifications:', err),
        });

      this.notificationClient
        .send('notification.create_notification', {
          userId: schedule.request.createdById,
          type: NotificationType.REQUEST_UPDATE,
          title: 'Request status update: Interview Completed',
          body:
            `HR submitted "${finalRecommendation}" for "${schedule.request.position}". ` +
            'The request is now waiting for Admin final decision.',
          relatedEntityId: schedule.requestId,
          relatedEntityType: 'RecruitmentRequest',
        })
        .subscribe({
          error: (err) => console.error('Failed to send Dept Head review notifications:', err),
        });
    }

    return { success: true };
  }
}
