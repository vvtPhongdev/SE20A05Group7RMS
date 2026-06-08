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
  UserRole,
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

  // ─── FR-14/FR-15: Record interview result & advance pipeline ─────────

  /**
   * FR-14/FR-15: Records PASS/FAIL with mandatory notes and the evaluator
   * who made the call. Marks the interview COMPLETED, advances the
   * candidate's Application pipeline on FAIL (→ REJECTED, with the
   * rejection workflow triggered immediately), and escalates to every
   * Admin to make the final hiring decision on PASS — all atomically in
   * one transaction so the pipeline status never drifts from the result.
   */
  async recordResult(payload: {
    interviewId: string;
    evaluatorId: string;
    result: string;
    notes: string;
  }) {
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

    const evaluator = await this.prisma.user.findUnique({
      where: { id: payload.evaluatorId },
      select: { id: true, displayName: true },
    });

    if (!evaluator) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Evaluator ${payload.evaluatorId} not found`,
      });
    }

    // Resolve everyone the result needs to flow to before the transaction.
    const [candidateProfile, application, admins] = await Promise.all([
      this.prisma.candidateProfile.findUnique({
        where: { id: schedule.candidateId },
        select: { userId: true, fullName: true, email: true },
      }),
      this.prisma.application.findUnique({
        where: {
          requestId_candidateId: {
            requestId: schedule.requestId,
            candidateId: schedule.candidateId,
          },
        },
      }),
      this.prisma.user.findMany({
        where: { role: UserRole.ADMIN },
        select: { id: true },
      }),
    ]);

    const passed = payload.result === InterviewResult.PASS;
    const trimmedNotes = payload.notes.trim();
    const scheduledDateStr = schedule.scheduledAt.toLocaleString('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    // ─── Workflow copy ──────────────────────────────────────────────
    const rejectionEmailSubject = `Update on your application — interview held ${scheduledDateStr} (ICT)`;
    const buildRejectionEmailBody = (name: string) =>
      [
        `Dear ${name},`,
        '',
        `Thank you for taking the time to interview with us on ${scheduledDateStr} (ICT).`,
        '',
        'After careful review of your interview, we have decided not to move forward with your application for this position.',
        '',
        'We appreciate your interest and wish you success in your future endeavours.',
        '',
        'Best regards,',
        'HR Team — Recruitment Management System',
      ].join('\n');

    const candidateNotificationBody = `Your interview on ${scheduledDateStr} (ICT) has concluded. The hiring team has decided not to move forward with your application at this time.`;

    const adminNotificationTitle = passed
      ? 'Candidate Passed Interview — Final Decision Needed'
      : 'Interview Result Recorded — Candidate Not Selected';
    const adminNotificationBody = passed
      ? `${candidateProfile?.fullName ?? 'The candidate'} PASSED the interview on ${scheduledDateStr} (ICT) (evaluator: ${evaluator.displayName}). Awaiting your final hiring decision (FR-15).`
      : `${candidateProfile?.fullName ?? 'The candidate'} did NOT pass the interview on ${scheduledDateStr} (ICT) (evaluator: ${evaluator.displayName}). Notes: ${trimmedNotes}`;

    const nextPipelineStatus = !passed ? RecruitmentRequestStatus.REJECTED : (application?.status ?? null);

    // Atomic transaction: persist result + complete schedule + advance
    // pipeline + notify + log timeline — a partial failure must never
    // leave the candidate's pipeline status out of sync with the result.
    const [result] = await this.prisma.$transaction([
      // 1. Persist the result with evaluator attribution
      this.prisma.interviewResult.create({
        data: {
          interviewId: payload.interviewId,
          evaluatorId: payload.evaluatorId,
          result: payload.result,
          notes: trimmedNotes,
        },
      }),

      // 2. Mark the interview COMPLETED
      this.prisma.interviewSchedule.update({
        where: { id: payload.interviewId },
        data: { status: InterviewStatus.COMPLETED },
      }),

      // 3. Candidate pipeline status — FAIL moves the Application to
      //    REJECTED immediately; PASS is left for Admin's FR-15 decision
      //    rather than prematurely advancing toward an offer.
      ...(!passed && application
        ? [
            this.prisma.application.update({
              where: { id: application.id },
              data: { status: RecruitmentRequestStatus.REJECTED },
            }),
          ]
        : []),

      // 4. Candidate-facing rejection workflow — only on FAIL. A PASS
      //    awaits Admin's decision before any candidate communication
      //    is sent (avoids promising an outcome HR hasn't approved yet).
      ...(!passed && candidateProfile
        ? [
            this.prisma.notification.create({
              data: {
                userId: candidateProfile.userId,
                type: NotificationType.REJECTION,
                title: 'Interview Result Recorded',
                body: candidateNotificationBody,
                relatedEntityId: payload.interviewId,
                relatedEntityType: 'InterviewSchedule',
              },
            }),
            this.prisma.emailLog.create({
              data: {
                toEmail: candidateProfile.email,
                subject: rejectionEmailSubject,
                body: buildRejectionEmailBody(candidateProfile.fullName),
                status: EmailStatus.PENDING,
              },
            }),
          ]
        : []),

      // 5. Escalate to every Admin — triggers the FR-15 final hiring
      //    decision workflow regardless of outcome.
      ...admins.map((admin: { id: string }) =>
        this.prisma.notification.create({
          data: {
            userId: admin.id,
            type: NotificationType.SYSTEM,
            title: adminNotificationTitle,
            body: adminNotificationBody,
            relatedEntityId: payload.interviewId,
            relatedEntityType: 'InterviewSchedule',
          },
        }),
      ),

      // 6. Timeline entry on the parent recruitment request.
      this.prisma.requestLog.create({
        data: {
          requestId: schedule.requestId,
          action: 'INTERVIEW_RESULT_RECORDED',
          fromStatus: application?.status ?? null,
          toStatus: nextPipelineStatus,
          performedById: payload.evaluatorId,
          metadata: {
            interviewId: payload.interviewId,
            result: payload.result,
            notes: trimmedNotes,
            evaluatorId: payload.evaluatorId,
          },
        },
      }),
    ]);

    return {
      result,
      pipelineStatus: nextPipelineStatus,
      escalatedToAdmins: admins.length,
    };
  }
}
