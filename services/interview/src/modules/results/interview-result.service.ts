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
  async listCompleted() {
    const schedules = await this.prisma.interviewSchedule.findMany({
      where: {
        status: { not: InterviewStatus.CANCELLED },
        OR: [
          { status: InterviewStatus.COMPLETED },
          { scheduledAt: { lte: new Date() } }
        ]
      },
      include: {
        candidate: true,
        request: {
          include: {
            department: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'desc'
      }
    });

    return schedules.map(s => {
      const status = (s.finalRecommendation || s.status === InterviewStatus.COMPLETED)
        ? 'Recorded'
        : 'Pending Recording';

      const formattedTime = s.scheduledAt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }) + ', ' + s.scheduledAt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      return {
        id: s.id,
        candidate: s.candidate.fullName,
        role: s.request.position,
        department: s.request.department.name,
        time: formattedTime,
        status,
      };
    });
  }

  /**
   * Get completed interview details including panel members and their feedbacks.
   */
  async getDetails(id: string) {
    const schedule = await this.prisma.interviewSchedule.findUnique({
      where: { id },
      include: {
        candidate: true,
        request: {
          include: {
            department: true
          }
        },
        results: {
          include: {
            evaluator: true
          }
        }
      }
    });

    if (!schedule) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Interview schedule ${id} not found`,
      });
    }

    // Fetch details of all users listed in schedule.interviewers
    const interviewers = await this.prisma.user.findMany({
      where: {
        id: { in: schedule.interviewers }
      }
    });

    // Map each interviewer in schedule.interviewers to their feedback (recorded or default empty)
    const feedbacks = schedule.interviewers.map(interviewerId => {
      const interviewer = interviewers.find(u => u.id === interviewerId);
      const result = schedule.results.find(r => r.evaluatorId === interviewerId);

      const initials = interviewer
        ? interviewer.displayName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
        : 'U';

      return {
        id: interviewerId,
        member: interviewer?.displayName || 'Unknown User',
        role: interviewer?.role || 'Interviewer',
        initials,
        decision: result ? (result.result as 'PASS' | 'FAIL') : 'PASS',
        technical: result?.technical !== undefined && result?.technical !== null ? result.technical : 0,
        communication: result?.communication !== undefined && result?.communication !== null ? result.communication : 0,
        culture: result?.culture !== undefined && result?.culture !== null ? result.culture : 0,
        notes: result?.notes || '',
        isRecorded: !!result
      };
    });

    const formattedTime = schedule.scheduledAt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }) + ', ' + schedule.scheduledAt.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    return {
      id: schedule.id,
      candidate: schedule.candidate.fullName,
      role: schedule.request.position,
      department: schedule.request.department.name,
      time: formattedTime,
      status: (schedule.finalRecommendation || schedule.status === InterviewStatus.COMPLETED) ? 'Recorded' : 'Pending Recording',
      interviewers: interviewers.map(u => ({
        id: u.id,
        name: u.displayName,
        role: u.role,
        initials: u.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
      })),
      feedbacks,
      finalRecommendation: schedule.finalRecommendation || '',
      summaryNotes: schedule.summaryNotes || ''
    };
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
  }) {
    const { interviewId, feedbacks, finalRecommendation, summaryNotes, evaluatorId } = payload;

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

    let nextAppStatus: RecruitmentRequestStatus | null = null;
    if (finalRecommendation === 'Recommend Hire') {
      nextAppStatus = RecruitmentRequestStatus.INTERVIEW_COMPLETED;
    } else if (finalRecommendation === 'Recommend Reject') {
      nextAppStatus = RecruitmentRequestStatus.REJECTED;
    }

    // Find existing interview results to see what needs to be created vs updated
    const existingResults = await this.prisma.interviewResult.findMany({
      where: { interviewId }
    });

    const transactions: any[] = [];

    // 1. Create or Update InterviewResult records for each panel member feedback
    for (const fb of feedbacks) {
      const existing = existingResults.find(r => r.evaluatorId === fb.evaluatorId);
      if (existing) {
        transactions.push(
          this.prisma.interviewResult.update({
            where: { id: existing.id },
            data: {
              result: fb.decision,
              notes: fb.notes?.trim() || null,
              technical: fb.technical,
              communication: fb.communication,
              culture: fb.culture
            }
          })
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
              culture: fb.culture
            }
          })
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
          summaryNotes: summaryNotes?.trim() || null
        },
      })
    );

    // 3. Update Application Status if recommendation specifies a transition
    if (nextAppStatus) {
      transactions.push(
        this.prisma.application.update({
          where: { id: application.id },
          data: { status: nextAppStatus },
        })
      );
    }

    // 4. Create RequestLog for candidate evaluation outcome
    transactions.push(
      this.prisma.requestLog.create({
        data: {
          requestId: schedule.requestId,
          action: finalRecommendation === 'Recommend Hire'
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
      })
    );

    // 5. If all schedules are finished, transition RecruitmentRequest to INTERVIEW_COMPLETED
    if (isLastInterview && nextAppStatus === RecruitmentRequestStatus.INTERVIEW_COMPLETED) {
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
      where: { interviewId }
    });

    for (const res of updatedResults) {
      this.auditLog.log({
        entityType: AuditEntityType.INTERVIEW_RESULT,
        entityId: res.id,
        action: AuditAction.INTERVIEW_RESULT_RECORDED,
        toStatus: res.result,
        performedById: evaluatorId || 'SYSTEM',
        reason: res.notes,
        metadata: { interviewId, candidateId: schedule.candidateId, evaluatorId: res.evaluatorId },
      }).catch((err) => console.error('Failed to write audit log for INTERVIEW_RESULT_RECORDED:', err));
    }

    // --- Next-step communications & workflows ---
    
    // 1. If candidate was rejected, trigger rejection email and notification
    if (finalRecommendation === 'Recommend Reject') {
      const emailSubject = `Application Update: ${schedule.request.position}`;
      const emailBody = [
        `Dear ${schedule.candidate.fullName},`,
        '',
        `Thank you for taking the time to interview with us for the position of ${schedule.request.position}.`,
        '',
        `We appreciate your interest in our company, but we regret to inform you that we have decided to move forward with other candidates at this stage.`,
        '',
        'We wish you all the best in your job search and future endeavors.',
        '',
        'Best regards,',
        'HR Team — Recruitment Management System',
      ].join('\n');

      const notifTitle = 'Application Update';
      const notifBody = `Your application for ${schedule.request.position} was not selected.`;

      // Enqueue email
      this.notificationClient
        .send('notification.send_email', {
          userId: schedule.candidate.userId,
          toEmail: schedule.candidate.email,
          subject: emailSubject,
          body: emailBody,
        })
        .subscribe({
          error: (err) => console.error('Failed to send rejection email:', err),
        });

      // Send in-app notification
      this.notificationClient
        .send('notification.create_notification', {
          userId: schedule.candidate.userId,
          type: NotificationType.REJECTION,
          title: notifTitle,
          body: notifBody,
          relatedEntityId: schedule.requestId,
          relatedEntityType: 'RecruitmentRequest',
        })
        .subscribe({
          error: (err) => console.error('Failed to send rejection notification:', err),
        });
    }

    // 2. If all interviews are completed and candidate is recommended for hire, notify Admins to review and make final decision (FR-15)
    if (isLastInterview && finalRecommendation === 'Recommend Hire') {
      this.notificationClient.send('notification.send_to_role', {
        role: UserRole.ADMIN,
        title: 'Review Required: Interview Stage Completed',
        body: `All scheduled interviews for "${schedule.request.position}" are completed. Please review results and make the final decision.`,
        type: NotificationType.PLAN_UPDATE,
        relatedEntityId: schedule.requestId,
        relatedEntityType: 'RecruitmentRequest',
      }).subscribe({
        error: (err) => console.error('Failed to send Admin review notifications:', err),
      });

      this.notificationClient
        .send('notification.create_notification', {
          userId: schedule.request.createdById,
          type: NotificationType.REQUEST_UPDATE,
          title: 'Request status update: Interview Completed',
          body: `All interviews for recruitment request "${schedule.request.position}" have been completed.`,
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
