import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import {
  InterviewStatus,
  InterviewResult,
  PlanStatus,
  RecruitmentRequestStatus,
  TaskType,
  NotificationType,
  EmailStatus,
} from '@wr/contracts';

// Statuses that confirm the request has cleared initial approval and is active.
const SCHEDULABLE_STATUSES: string[] = [
  RecruitmentRequestStatus.APPROVED,
  RecruitmentRequestStatus.PLANNING,
  RecruitmentRequestStatus.PLAN_APPROVED,
  RecruitmentRequestStatus.SCREENING,
  RecruitmentRequestStatus.INTERVIEWING,
];

const ACTIVE_INTERVIEW_STATUSES = [InterviewStatus.SCHEDULED, InterviewStatus.RESCHEDULED];

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
  constructor(private readonly prisma: PrismaService) {}

  // ─── Plan-lock guard (FR-07) ─────────────────────────────────────────

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
        message: `Plan-lock violated: OverallPlan status is "${plan.status}" — must be APPROVED.`,
      });
    }

    if (plan.tasks.length === 0) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'Plan-lock violated: no INTERVIEW_COORDINATION TaskPlan assigned for this campaign.',
      });
    }

    return { request, plan };
  }

  // ─── Conflict detection ──────────────────────────────────────────────

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

  // ─── Public API ──────────────────────────────────────────────────────

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

    if (!payload.interviewers.length) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'At least one interviewer is required',
      });
    }

    // FR-07: all three plan-lock preconditions
    await this.assertPlanLocked(payload.requestId);

    // Conflict check
    const conflicts = await this.detectConflicts(
      payload.candidateId,
      payload.interviewers,
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

    return this.prisma.interviewSchedule.create({
      data: {
        requestId: payload.requestId,
        candidateId: payload.candidateId,
        scheduledAt,
        duration: payload.duration,
        location: payload.location,
        interviewers: payload.interviewers,
        status: InterviewStatus.SCHEDULED,
      },
      include: { results: true },
    });
  }

  async getSchedule(id: string) {
    const schedule = await this.prisma.interviewSchedule.findUnique({
      where: { id },
      include: { results: true },
    });

    if (!schedule) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Interview schedule ${id} not found`,
      });
    }

    return schedule;
  }

  async listSchedules(requestId: string) {
    return this.prisma.interviewSchedule.findMany({
      where: { requestId },
      include: { results: true },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async cancelSchedule(payload: { id: string; cancelledBy: string }) {
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

    return this.prisma.interviewSchedule.update({
      where: { id: payload.id },
      data: { status: InterviewStatus.CANCELLED },
    });
  }

  // ─── Reschedule ─────────────────────────────────────────────────────

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

    if (!payload.interviewers.length) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'At least one interviewer is required',
      });
    }

    // Conflict check — exclude the schedule being rescheduled so it does not
    // conflict against its own old slot.
    const conflicts = await this.detectConflicts(
      existing.candidateId,
      payload.interviewers,
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
        where: { id: { in: payload.interviewers } },
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

    const emailSubject = `Interview Rescheduled — New time: ${newDateStr} (ICT)`;

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
        'HR Team — Recruitment Management System',
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
          interviewers: payload.interviewers,
          status: InterviewStatus.RESCHEDULED,
        },
      }),

      // EmailLog — candidate
      ...(candidateProfile
        ? [
            this.prisma.emailLog.create({
              data: {
                toEmail: candidateProfile.email,
                subject: emailSubject,
                body: buildEmailBody(candidateProfile.fullName, 'Candidate'),
                status: EmailStatus.PENDING,
              },
            }),
          ]
        : []),

      // EmailLog — interviewers
      ...interviewerUsers.map((u) =>
        this.prisma.emailLog.create({
          data: {
            toEmail: u.email,
            subject: emailSubject,
            body: buildEmailBody(u.displayName, 'Interviewer'),
            status: EmailStatus.PENDING,
          },
        }),
      ),

      // In-app Notification — candidate
      ...(candidateProfile
        ? [
            this.prisma.notification.create({
              data: {
                userId: candidateProfile.userId,
                type: NotificationType.INTERVIEW_INVITE,
                title: notificationTitle,
                body: buildNotificationBody('Candidate'),
                relatedEntityId: payload.id,
                relatedEntityType: 'InterviewSchedule',
              },
            }),
          ]
        : []),

      // In-app Notification — interviewers
      ...interviewerUsers.map((u) =>
        this.prisma.notification.create({
          data: {
            userId: u.id,
            type: NotificationType.INTERVIEW_INVITE,
            title: notificationTitle,
            body: buildNotificationBody('Interviewer'),
            relatedEntityId: payload.id,
            relatedEntityType: 'InterviewSchedule',
          },
        }),
      ),
    ]);

    return {
      schedule: updatedSchedule,
      notified: {
        candidate: candidateProfile?.email ?? null,
        interviewers: interviewerUsers.map((u) => u.email),
      },
    };
  }

  // ─── FR-14: Record interview result ──────────────────────────────────

  /**
   * FR-14: Record PASS/FAIL result with mandatory panel notes after the interview.
   * Marks the InterviewSchedule as COMPLETED atomically in the same transaction.
   */
  async recordResult(payload: { interviewId: string; result: string; notes: string }) {
    const schedule = await this.prisma.interviewSchedule.findUnique({
      where: { id: payload.interviewId },
    });

    if (!schedule) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Interview schedule ${payload.interviewId} not found`,
      });
    }

    if (schedule.status === InterviewStatus.CANCELLED) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: 'Cannot record a result for a cancelled interview',
      });
    }

    const validResults = Object.values(InterviewResult) as string[];
    if (!validResults.includes(payload.result)) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `result must be one of: ${validResults.join(', ')}`,
      });
    }

    if (!payload.notes?.trim()) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'notes are mandatory when recording an interview result',
      });
    }

    const [result] = await this.prisma.$transaction([
      this.prisma.interviewResult.create({
        data: {
          interviewId: payload.interviewId,
          result: payload.result,
          notes: payload.notes.trim(),
        },
      }),
      this.prisma.interviewSchedule.update({
        where: { id: payload.interviewId },
        data: { status: InterviewStatus.COMPLETED },
      }),
    ]);

    return result;
  }
}
