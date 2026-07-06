import { Injectable, HttpStatus, Inject } from '@nestjs/common';
import { RpcException, ClientProxy } from '@nestjs/microservices';
import { AuditLogService } from '@wr/database';
import { PrismaService } from '../../common/database/prisma.service';
import {
  AuditAction,
  AuditEntityType,
  InterviewStatus,
  PlanStatus,
  RecruitmentRequestStatus,
  TaskType,
  NotificationType,
  UserRole,
} from '@wr/contracts';

// Statuses that confirm the request has cleared initial approval and is active.
const SCHEDULABLE_STATUSES: string[] = [
  RecruitmentRequestStatus.APPROVED,
  RecruitmentRequestStatus.PLANNING,
  RecruitmentRequestStatus.PLAN_APPROVED,
  RecruitmentRequestStatus.ACTIVE,
  RecruitmentRequestStatus.SCREENING,
  RecruitmentRequestStatus.INTERVIEWING,
];

const CANDIDATE_CONFIRMED_STATUS = 'CONFIRMED';
const ACTIVE_INTERVIEW_STATUSES: string[] = [
  InterviewStatus.SCHEDULED,
  InterviewStatus.RESCHEDULED,
  CANDIDATE_CONFIRMED_STATUS,
];

// Max interview duration used to bound the conflict-detection window.
const MAX_DURATION_MS = 480 * 60_000;

interface ConflictEntry {
  type: 'CANDIDATE' | 'INTERVIEWER';
  scheduleId: string;
  scheduledAt: Date;
  conflictingWith: string;
}

@Injectable()
export class SchedulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
  ) {}

  private sendNotification(payload: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    relatedEntityId?: string;
    relatedEntityType?: string;
  }) {
    this.notificationClient.send('notification.create_notification', payload).subscribe({
      error: (err) => console.error('Failed to send interview notification:', err),
    });
  }

  private async getCandidateOwnedSchedule(id: string, userId: string) {
    const schedule = await this.prisma.interviewSchedule.findUnique({
      where: { id },
      include: {
        candidate: {
          select: {
            id: true,
            userId: true,
            fullName: true,
            email: true,
          },
        },
        request: {
          select: {
            id: true,
            position: true,
            createdById: true,
            reviewedById: true,
            approvedById: true,
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

    if (schedule.candidate.userId !== userId) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'You can only manage your own interview schedule',
      });
    }

    return schedule;
  }

  // â”€â”€â”€ Plan-lock guard (FR-07) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Enforces FR-07 preconditions before any interview activity:
   *   1. RecruitmentRequest is in an approved/active status.
   *   2. OverallPlan exists and is APPROVED.
   *   3. A TaskPlan with taskType=INTERVIEW_COORDINATION exists for the plan.
   */
  private async assertPlanLocked(requestId: string) {
    const request = await this.prisma.recruitmentRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Recruitment request ${requestId} not found`,
      });
    }

    if (!SCHEDULABLE_STATUSES.includes(request.status)) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: `Plan-lock violated: request status is "${request.status}". Must be approved before scheduling interviews.`,
      });
    }

    const plan = await this.prisma.overallPlan.findUnique({
      where: { requestId },
      include: {
        tasks: { where: { taskType: TaskType.INTERVIEW_COORDINATION } },
      },
    });

    if (!plan) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'Plan-lock violated: no OverallPlan found for this request.',
      });
    }

    if (plan.status !== PlanStatus.APPROVED) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: `Plan-lock violated: OverallPlan status is "${plan.status}" â€” must be APPROVED.`,
      });
    }

    if (plan.tasks.length === 0) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message:
          'Plan-lock violated: no INTERVIEW_COORDINATION TaskPlan assigned for this campaign.',
      });
    }

    return { request, plan };
  }

  private async assertValidInterviewers(interviewerIds: string[]) {
    const uniqueIds = [...new Set(interviewerIds ?? [])];
    if (uniqueIds.length < 2) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'At least 2 interviewers are required to schedule an interview',
      });
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, role: true, isActive: true, displayName: true, email: true },
    });
    if (users.length !== uniqueIds.length) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'One or more interviewers do not exist',
      });
    }

    const allowedRoles: UserRole[] = [UserRole.HR_LEADER, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN];
    if (users.some((user) => !user.isActive || !allowedRoles.includes(user.role as UserRole))) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Interviewers must be active internal users',
      });
    }

    return { uniqueIds, users };
  }

  // â”€â”€â”€ Conflict detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * Detects overlapping SCHEDULED/RESCHEDULED interviews for the candidate
   * and any of the listed interviewers.
   *
   * Fetches only schedules within a time window to keep the query cheap, then
   * checks the overlap condition (existing.start < newEnd && existing.end > newStart)
   * in memory and tests array intersection for interviewers.
   */
  private async detectConflicts(
    candidateId: string,
    interviewers: string[],
    newStart: Date,
    durationMinutes: number,
    excludeId?: string,
  ): Promise<ConflictEntry[]> {
    const newEnd = new Date(newStart.getTime() + durationMinutes * 60_000);

    // Window: any existing schedule that starts up to MAX_DURATION before newEnd
    // is the only range where overlap is still possible.
    const windowStart = new Date(newStart.getTime() - MAX_DURATION_MS);

    const nearby = await this.prisma.interviewSchedule.findMany({
      where: {
        status: { in: ACTIVE_INTERVIEW_STATUSES },
        scheduledAt: { gte: windowStart, lt: newEnd },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });

    const conflicts: ConflictEntry[] = [];

    for (const s of nearby) {
      const sEnd = new Date(s.scheduledAt.getTime() + s.duration * 60_000);

      // Overlap: existing starts before new ends AND existing ends after new starts
      if (!(s.scheduledAt < newEnd && sEnd > newStart)) continue;

      if (s.candidateId === candidateId) {
        conflicts.push({
          type: 'CANDIDATE',
          scheduleId: s.id,
          scheduledAt: s.scheduledAt,
          conflictingWith: candidateId,
        });
      }

      const sharedInterviewer = interviewers.find((iv) => s.interviewers.includes(iv));
      if (sharedInterviewer) {
        conflicts.push({
          type: 'INTERVIEWER',
          scheduleId: s.id,
          scheduledAt: s.scheduledAt,
          conflictingWith: sharedInterviewer,
        });
      }
    }

    return conflicts;
  }

  // â”€â”€â”€ Public API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * FR-12 + FR-07: Create a new interview schedule.
   * Validates input, enforces plan-lock, detects conflicts, then persists.
   */
  async create(payload: {
    requestId: string;
    candidateId: string;
    scheduledAt: string;
    duration: number;
    location: string;
    interviewers: string[];
    scheduledById?: string;
  }) {
    const scheduledAt = new Date(payload.scheduledAt);

    if (isNaN(scheduledAt.getTime())) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'scheduledAt is not a valid ISO-8601 date string',
      });
    }

    if (scheduledAt <= new Date()) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'scheduledAt must be in the future',
      });
    }

    if (payload.duration < 15 || payload.duration > 480) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'duration must be between 15 and 480 minutes',
      });
    }

    // FR-07: all three plan-lock preconditions
    await this.assertPlanLocked(payload.requestId);
    const { uniqueIds: interviewerIds, users: panel } = await this.assertValidInterviewers(
      payload.interviewers,
    );
    const performedById = payload.scheduledById ?? interviewerIds[0]!;

    // Conflict check
    const conflicts = await this.detectConflicts(
      payload.candidateId,
      interviewerIds,
      scheduledAt,
      payload.duration,
    );

    if (conflicts.length > 0) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: 'Scheduling conflict detected',
        conflicts,
      });
    }

    // Check if application exists
    const application = await this.prisma.application.findUnique({
      where: {
        requestId_candidateId: {
          requestId: payload.requestId,
          candidateId: payload.candidateId,
        },
      },
    });

    if (!application) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Application for candidate ${payload.candidateId} not found for this recruitment request`,
      });
    }

    const [schedule] = await this.prisma.$transaction([
      this.prisma.interviewSchedule.create({
        data: {
          requestId: payload.requestId,
          candidateId: payload.candidateId,
          scheduledAt,
          duration: payload.duration,
          location: payload.location,
          interviewers: interviewerIds,
          status: InterviewStatus.SCHEDULED,
        },
        include: {
          results: true,
          request: { select: { id: true, position: true } },
          candidate: { select: { id: true, fullName: true, email: true, userId: true } },
        },
      }),
      this.prisma.application.update({
        where: {
          requestId_candidateId: {
            requestId: payload.requestId,
            candidateId: payload.candidateId,
          },
        },
        data: { status: RecruitmentRequestStatus.INTERVIEWING },
      }),
      this.prisma.recruitmentRequest.update({
        where: { id: payload.requestId },
        data: { status: RecruitmentRequestStatus.INTERVIEWING },
      }),
      this.prisma.requestLog.create({
        data: {
          requestId: payload.requestId,
          action: 'INTERVIEW_SCHEDULED',
          performedById,
          metadata: {
            candidateId: payload.candidateId,
            scheduledAt: scheduledAt.toISOString(),
          },
        },
      }),
    ]);

    this.auditLog
      .log({
        entityType: AuditEntityType.INTERVIEW_SCHEDULE,
        entityId: schedule.id,
        action: AuditAction.INTERVIEW_SCHEDULED,
        toStatus: InterviewStatus.SCHEDULED,
        performedById,
        metadata: { candidateId: payload.candidateId, scheduledAt: scheduledAt.toISOString() },
      })
      .catch((err) => console.error('Failed to write audit log for INTERVIEW_SCHEDULED:', err));

    // Send in-app status update notification to Department Head
    this.prisma.recruitmentRequest
      .findUnique({
        where: { id: payload.requestId },
        select: { createdById: true, position: true },
      })
      .then((reqObj) => {
        if (reqObj) {
          this.notificationClient
            .send('notification.create_notification', {
              userId: reqObj.createdById,
              type: NotificationType.REQUEST_UPDATE,
              title: 'Request status update: Interviewing',
              body: `Recruitment request for ${reqObj.position} has transitioned to Interviewing.`,
              relatedEntityId: payload.requestId,
              relatedEntityType: 'RecruitmentRequest',
            })
            .subscribe({
              error: (err) =>
                console.error(
                  'Failed to send status change notification on interview schedule:',
                  err,
                ),
            });
        }
      })
      .catch((err) =>
        console.error('Failed to query request for interview scheduled notification:', err),
      );

    // Resolve candidate and interviewers details for email notifications (FR-13/16)
    Promise.all([
      this.prisma.candidateProfile.findUnique({
        where: { id: payload.candidateId },
        select: { userId: true, fullName: true, email: true },
      }),
      this.prisma.user.findMany({
        where: { id: { in: interviewerIds } },
        select: { id: true, email: true, displayName: true },
      }),
      this.prisma.recruitmentRequest.findUnique({
        where: { id: payload.requestId },
        select: { position: true },
      }),
    ])
      .then(([candidateProfile, interviewerUsers, reqObj]) => {
        const scheduledDateStr = scheduledAt.toLocaleString('en-GB', {
          timeZone: 'Asia/Ho_Chi_Minh',
          dateStyle: 'full',
          timeStyle: 'short',
        });

        if (candidateProfile) {
          this.sendNotification({
            userId: candidateProfile.userId,
            type: NotificationType.INTERVIEW_INVITE,
            title: 'Interview Invitation',
            body: `You have been invited to interview for ${reqObj?.position || 'this position'} on ${scheduledDateStr} (ICT). Location: ${payload.location}`,
            relatedEntityId: schedule.id,
            relatedEntityType: 'InterviewSchedule',
          });

          this.notificationClient
            .send('notification.send_templated_email', {
              userId: candidateProfile.userId,
              toEmail: candidateProfile.email,
              templateType: 'INTERVIEW_INVITATION',
              templateData: {
                recipientName: candidateProfile.fullName,
                position: reqObj?.position || 'Position',
                scheduledAt: scheduledDateStr,
                location: payload.location,
                preparationInstructions:
                  'Please prepare by reviewing the job description, having a copy of your resume ready, and ensuring a stable internet connection if the interview is online.',
              },
            })
            .subscribe({
              error: (err) =>
                console.error('Failed to send candidate interview invitation email:', err),
            });
        }

        for (const u of interviewerUsers) {
          this.notificationClient
            .send('notification.send_templated_email', {
              userId: u.id,
              toEmail: u.email,
              templateType: 'INTERVIEW_INVITATION',
              templateData: {
                recipientName: u.displayName,
                position: reqObj?.position || 'Position',
                scheduledAt: scheduledDateStr,
                location: payload.location,
                preparationInstructions:
                  'Please review the candidate profile and CV prior to the interview.',
              },
            })
            .subscribe({
              error: (err) =>
                console.error(
                  `Failed to send interviewer ${u.email} interview invitation email:`,
                  err,
                ),
            });
        }
      })
      .catch((err) =>
        console.error('Failed to query details for interview invitation emails:', err),
      );

    return {
      ...schedule,
      panel: panel.map(({ id, displayName, email, role }) => ({ id, displayName, email, role })),
    };
  }

  async getSchedule(payload: { id: string; userId?: string; role?: string }) {
    const schedule = await this.prisma.interviewSchedule.findUnique({
      where: { id: payload.id },
      include: {
        results: true,
        candidate: { select: { id: true, userId: true, fullName: true, email: true } },
        request: {
          select: { id: true, position: true, department: { select: { name: true } } },
        },
      },
    });

    if (!schedule) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Interview schedule ${payload.id} not found`,
      });
    }

    if (
      payload.role === UserRole.CANDIDATE &&
      payload.userId &&
      schedule.candidate.userId !== payload.userId
    ) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'You can only view your own interview schedule',
      });
    }

    const panel = await this.prisma.user.findMany({
      where: { id: { in: schedule.interviewers } },
      select: { id: true, displayName: true, email: true, role: true },
    });
    return { ...schedule, panel };
  }

  async listSchedules(requestId: string) {
    const schedules = await this.prisma.interviewSchedule.findMany({
      where: { requestId },
      include: {
        results: true,
        candidate: { select: { id: true, fullName: true, email: true } },
        request: { select: { id: true, position: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
    const interviewerIds = [...new Set(schedules.flatMap((schedule) => schedule.interviewers))];
    const users = interviewerIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: interviewerIds } },
          select: { id: true, displayName: true, email: true, role: true },
        })
      : [];
    const userById = new Map(users.map((user) => [user.id, user]));
    return schedules.map((schedule) => ({
      ...schedule,
      panel: schedule.interviewers.flatMap((id) => {
        const user = userById.get(id);
        return user ? [user] : [];
      }),
    }));
  }

  /**
   * T-052: Cancel an interview with a mandatory reason.
   * - Guards: not already CANCELLED or COMPLETED.
   * - Single $transaction:
   *     1. Sets schedule status â†’ CANCELLED.
   *     2. Creates PENDING EmailLog for candidate + every interviewer.
   *     3. Creates in-app Notification for candidate + every interviewer.
   *     4. Appends a RequestLog entry on the parent RecruitmentRequest so its
   *        timeline reflects this event ("Update request timeline", FR-14).
   */
  async cancel(payload: { id: string; cancelledBy: string; reason: string }) {
    const schedule = await this.prisma.interviewSchedule.findUnique({
      where: { id: payload.id },
    });

    if (!schedule) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Interview schedule ${payload.id} not found`,
      });
    }

    if (schedule.status === InterviewStatus.COMPLETED) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: 'Cannot cancel a completed interview',
      });
    }

    if (schedule.status === InterviewStatus.CANCELLED) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: 'Interview is already cancelled',
      });
    }

    if (!payload.reason?.trim()) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'reason is required when cancelling an interview',
      });
    }

    // Resolve contact details for all notified parties before the transaction.
    const [candidateProfile, interviewerUsers] = await Promise.all([
      this.prisma.candidateProfile.findUnique({
        where: { id: schedule.candidateId },
        select: { userId: true, fullName: true, email: true },
      }),
      this.prisma.user.findMany({
        where: { id: { in: schedule.interviewers } },
        select: { id: true, email: true, displayName: true },
      }),
    ]);

    const scheduledDateStr = schedule.scheduledAt.toLocaleString('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const emailSubject = `Interview Cancelled â€” ${scheduledDateStr} (ICT)`;

    const buildEmailBody = (name: string, role: string) =>
      [
        `Dear ${name},`,
        '',
        `We regret to inform you that your interview scheduled as ${role} has been cancelled.`,
        '',
        `Original time : ${scheduledDateStr} (ICT)`,
        `Location      : ${schedule.location}`,
        '',
        `Reason for cancellation: ${payload.reason.trim()}`,
        '',
        'We apologise for any inconvenience caused.',
        '',
        'Best regards,',
        'HR Team â€” Recruitment Management System',
      ].join('\n');

    const notificationTitle = 'Interview Cancelled';
    const buildNotificationBody = (role: string) =>
      `Your interview (${role}) on ${scheduledDateStr} (ICT) has been cancelled. Reason: ${payload.reason.trim()}`;

    // Atomic transaction: cancel + notify + log timeline event.
    const [updatedSchedule] = await this.prisma.$transaction([
      // 1. Mark schedule CANCELLED
      this.prisma.interviewSchedule.update({
        where: { id: payload.id },
        data: { status: InterviewStatus.CANCELLED },
      }),

      // 2. RequestLog â€” update parent request timeline
      this.prisma.requestLog.create({
        data: {
          requestId: schedule.requestId,
          action: 'INTERVIEW_CANCELLED',
          performedById: payload.cancelledBy,
          metadata: {
            interviewId: payload.id,
            reason: payload.reason.trim(),
            scheduledAt: schedule.scheduledAt.toISOString(),
          },
        },
      }),
    ]);

    this.auditLog
      .log({
        entityType: AuditEntityType.INTERVIEW_SCHEDULE,
        entityId: payload.id,
        action: AuditAction.INTERVIEW_CANCELLED,
        fromStatus: schedule.status,
        toStatus: InterviewStatus.CANCELLED,
        performedById: payload.cancelledBy,
        reason: payload.reason.trim(),
      })
      .catch((err) => console.error('Failed to write audit log for INTERVIEW_CANCELLED:', err));

    // Send emails and notifications asynchronously via microservice
    if (candidateProfile) {
      this.notificationClient
        .send('notification.send_email', {
          userId: candidateProfile.userId,
          toEmail: candidateProfile.email,
          subject: emailSubject,
          body: buildEmailBody(candidateProfile.fullName, 'Candidate'),
        })
        .subscribe({
          error: (err) => console.error('Failed to send candidate cancellation email:', err),
        });

      this.notificationClient
        .send('notification.create_notification', {
          userId: candidateProfile.userId,
          type: NotificationType.SYSTEM,
          title: notificationTitle,
          body: buildNotificationBody('Candidate'),
          relatedEntityId: payload.id,
          relatedEntityType: 'InterviewSchedule',
        })
        .subscribe({
          error: (err) => console.error('Failed to send candidate cancellation notification:', err),
        });
    }

    for (const u of interviewerUsers) {
      this.notificationClient
        .send('notification.send_email', {
          userId: u.id,
          toEmail: u.email,
          subject: emailSubject,
          body: buildEmailBody(u.displayName, 'Interviewer'),
        })
        .subscribe({
          error: (err) =>
            console.error(`Failed to send interviewer ${u.email} cancellation email:`, err),
        });

      this.notificationClient
        .send('notification.create_notification', {
          userId: u.id,
          type: NotificationType.SYSTEM,
          title: notificationTitle,
          body: buildNotificationBody('Interviewer'),
          relatedEntityId: payload.id,
          relatedEntityType: 'InterviewSchedule',
        })
        .subscribe({
          error: (err) =>
            console.error(`Failed to send interviewer ${u.email} cancellation notification:`, err),
        });
    }

    return {
      schedule: updatedSchedule,
      notified: {
        candidate: candidateProfile?.email ?? null,
        interviewers: interviewerUsers.map((u) => u.email),
      },
    };
  }

  // â”€â”€â”€ Reschedule â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /**
   * T-051: Reschedule an existing interview.
   * - Validates the new slot (future, duration bounds, non-empty reason).
   * - Re-runs conflict detection, excluding the current schedule from the check.
   * - Atomically: updates the schedule to RESCHEDULED + creates PENDING EmailLog and
   *   in-app Notification for the candidate and every listed interviewer.
   */
  async reschedule(payload: {
    id: string;
    scheduledAt: string;
    duration: number;
    location: string;
    interviewers: string[];
    reason: string;
  }) {
    const existing = await this.prisma.interviewSchedule.findUnique({
      where: { id: payload.id },
    });

    if (!existing) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Interview schedule ${payload.id} not found`,
      });
    }

    if (existing.status === InterviewStatus.CANCELLED) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: 'Cannot reschedule a cancelled interview',
      });
    }

    if (existing.status === InterviewStatus.COMPLETED) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: 'Cannot reschedule a completed interview',
      });
    }

    if (!payload.reason?.trim()) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'reason is required when rescheduling an interview',
      });
    }

    const newStart = new Date(payload.scheduledAt);

    if (isNaN(newStart.getTime())) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'scheduledAt is not a valid ISO-8601 date string',
      });
    }

    if (newStart <= new Date()) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'scheduledAt must be in the future',
      });
    }

    if (payload.duration < 15 || payload.duration > 480) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'duration must be between 15 and 480 minutes',
      });
    }

    const { uniqueIds: interviewerIds } = await this.assertValidInterviewers(payload.interviewers);

    // Conflict check â€” exclude the schedule being rescheduled so it does not
    // conflict against its own old slot.
    const conflicts = await this.detectConflicts(
      existing.candidateId,
      interviewerIds,
      newStart,
      payload.duration,
      payload.id,
    );

    if (conflicts.length > 0) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: 'Scheduling conflict detected for the new time slot',
        conflicts,
      });
    }

    // Resolve email addresses for all notified parties before opening the transaction.
    const [candidateProfile, interviewerUsers] = await Promise.all([
      this.prisma.candidateProfile.findUnique({
        where: { id: existing.candidateId },
        select: { userId: true, fullName: true, email: true },
      }),
      this.prisma.user.findMany({
        where: { id: { in: interviewerIds } },
        select: { id: true, email: true, displayName: true },
      }),
    ]);

    const newDateStr = newStart.toLocaleString('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const oldDateStr = existing.scheduledAt.toLocaleString('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const emailSubject = `Interview Rescheduled â€” New time: ${newDateStr} (ICT)`;

    const buildEmailBody = (name: string, role: string) =>
      [
        `Dear ${name},`,
        '',
        `Your interview scheduled as ${role} has been rescheduled.`,
        '',
        `Previous time : ${oldDateStr} (ICT)`,
        `New time      : ${newDateStr} (ICT)`,
        `Duration      : ${payload.duration} minutes`,
        `Location      : ${payload.location}`,
        '',
        `Reason for rescheduling: ${payload.reason.trim()}`,
        '',
        'Please update your calendar accordingly.',
        '',
        'Best regards,',
        'HR Team â€” Recruitment Management System',
      ].join('\n');

    const notificationTitle = 'Interview Rescheduled';
    const buildNotificationBody = (role: string) =>
      `Your interview (${role}) has been moved to ${newDateStr} (ICT). Reason: ${payload.reason.trim()}`;

    // Single transaction: update schedule + create all notifications atomically.
    const [updatedSchedule] = await this.prisma.$transaction([
      this.prisma.interviewSchedule.update({
        where: { id: payload.id },
        data: {
          scheduledAt: newStart,
          duration: payload.duration,
          location: payload.location,
          interviewers: interviewerIds,
          status: InterviewStatus.RESCHEDULED,
        },
      }),
      this.prisma.requestLog.create({
        data: {
          requestId: existing.requestId,
          action: 'INTERVIEW_RESCHEDULED',
          performedById: interviewerIds[0]!,
          metadata: {
            interviewId: payload.id,
            reason: payload.reason.trim(),
            oldScheduledAt: existing.scheduledAt.toISOString(),
            newScheduledAt: newStart.toISOString(),
          },
        },
      }),
    ]);

    this.auditLog
      .log({
        entityType: AuditEntityType.INTERVIEW_SCHEDULE,
        entityId: payload.id,
        action: AuditAction.INTERVIEW_RESCHEDULED,
        fromStatus: existing.status,
        toStatus: InterviewStatus.RESCHEDULED,
        performedById: interviewerIds[0]!,
        reason: payload.reason.trim(),
        metadata: {
          oldScheduledAt: existing.scheduledAt.toISOString(),
          newScheduledAt: newStart.toISOString(),
        },
      })
      .catch((err) => console.error('Failed to write audit log for INTERVIEW_RESCHEDULED:', err));

    // Send emails and notifications asynchronously via microservice
    if (candidateProfile) {
      this.notificationClient
        .send('notification.send_email', {
          userId: candidateProfile.userId,
          toEmail: candidateProfile.email,
          subject: emailSubject,
          body: buildEmailBody(candidateProfile.fullName, 'Candidate'),
        })
        .subscribe({
          error: (err) => console.error('Failed to send candidate reschedule email:', err),
        });

      this.notificationClient
        .send('notification.create_notification', {
          userId: candidateProfile.userId,
          type: NotificationType.INTERVIEW_INVITE,
          title: notificationTitle,
          body: buildNotificationBody('Candidate'),
          relatedEntityId: payload.id,
          relatedEntityType: 'InterviewSchedule',
        })
        .subscribe({
          error: (err) => console.error('Failed to send candidate reschedule notification:', err),
        });
    }

    for (const u of interviewerUsers) {
      this.notificationClient
        .send('notification.send_email', {
          userId: u.id,
          toEmail: u.email,
          subject: emailSubject,
          body: buildEmailBody(u.displayName, 'Interviewer'),
        })
        .subscribe({
          error: (err) =>
            console.error(`Failed to send interviewer ${u.email} reschedule email:`, err),
        });

      this.notificationClient
        .send('notification.create_notification', {
          userId: u.id,
          type: NotificationType.INTERVIEW_INVITE,
          title: notificationTitle,
          body: buildNotificationBody('Interviewer'),
          relatedEntityId: payload.id,
          relatedEntityType: 'InterviewSchedule',
        })
        .subscribe({
          error: (err) =>
            console.error(`Failed to send interviewer ${u.email} reschedule notification:`, err),
        });
    }

    return {
      schedule: updatedSchedule,
      notified: {
        candidate: candidateProfile?.email ?? null,
        interviewers: interviewerUsers.map((u) => u.email),
      },
    };
  }

  async confirmByCandidate(payload: { id: string; userId: string }) {
    const schedule = await this.getCandidateOwnedSchedule(payload.id, payload.userId);

    if (schedule.status === InterviewStatus.CANCELLED) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: 'Cannot confirm a cancelled interview',
      });
    }

    if (schedule.status === InterviewStatus.COMPLETED) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: 'Cannot confirm a completed interview',
      });
    }

    const [updatedSchedule, interviewerUsers] = await Promise.all([
      this.prisma.interviewSchedule.update({
        where: { id: payload.id },
        data: { status: CANDIDATE_CONFIRMED_STATUS },
      }),
      this.prisma.user.findMany({
        where: { id: { in: schedule.interviewers } },
        select: { id: true },
      }),
      this.prisma.requestLog.create({
        data: {
          requestId: schedule.requestId,
          action: 'INTERVIEW_CONFIRMED_BY_CANDIDATE',
          performedById: payload.userId,
          metadata: {
            interviewId: payload.id,
            candidateId: schedule.candidateId,
            scheduledAt: schedule.scheduledAt.toISOString(),
          },
        },
      }),
    ]);

    for (const user of interviewerUsers) {
      this.sendNotification({
        userId: user.id,
        type: NotificationType.INTERVIEW_INVITE,
        title: 'Candidate confirmed interview',
        body: `${schedule.candidate.fullName} confirmed the interview for ${schedule.request.position}.`,
        relatedEntityId: payload.id,
        relatedEntityType: 'InterviewSchedule',
      });
    }

    return { schedule: updatedSchedule };
  }

  async rescheduleByCandidate(payload: {
    id: string;
    userId: string;
    scheduledAt: string;
    reason: string;
  }) {
    const schedule = await this.getCandidateOwnedSchedule(payload.id, payload.userId);

    const response = await this.reschedule({
      id: payload.id,
      scheduledAt: payload.scheduledAt,
      duration: schedule.duration,
      location: schedule.location,
      interviewers: schedule.interviewers,
      reason: `Candidate requested: ${payload.reason?.trim() || 'No reason provided'}`,
    });

    await this.prisma.requestLog.create({
      data: {
        requestId: schedule.requestId,
        action: 'INTERVIEW_RESCHEDULED_BY_CANDIDATE',
        performedById: payload.userId,
        metadata: {
          interviewId: payload.id,
          candidateId: schedule.candidateId,
          oldScheduledAt: schedule.scheduledAt.toISOString(),
          newScheduledAt: new Date(payload.scheduledAt).toISOString(),
          reason: payload.reason?.trim() || null,
        },
      },
    });

    return response;
  }

  async cancelByCandidate(payload: { id: string; userId: string; reason: string }) {
    await this.getCandidateOwnedSchedule(payload.id, payload.userId);

    return this.cancel({
      id: payload.id,
      cancelledBy: payload.userId,
      reason: `Candidate cancelled: ${payload.reason?.trim() || 'No reason provided'}`,
    });
  }
}
