import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import {
  InterviewStatus,
  PlanStatus,
  RecruitmentRequestStatus,
  TaskType,
} from '@wr/contracts';

const SCHEDULABLE_STATUSES: string[] = [
  RecruitmentRequestStatus.APPROVED,
  RecruitmentRequestStatus.PLANNING,
  RecruitmentRequestStatus.PLAN_APPROVED,
  RecruitmentRequestStatus.SCREENING,
  RecruitmentRequestStatus.INTERVIEWING,
];

const ACTIVE_INTERVIEW_STATUSES = [
  InterviewStatus.SCHEDULED,
  InterviewStatus.RESCHEDULED,
];
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
        message: `Plan-lock violated: request status is "${request.status}"`,
      });
    }

    const plan = await this.prisma.overallPlan.findUnique({
      where: { requestId },
      include: {
        tasks: { where: { taskType: TaskType.INTERVIEW_COORDINATION } },
      },
    });

    if (!plan || plan.status !== PlanStatus.APPROVED || plan.tasks.length === 0) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message:
          'Plan-lock violated: an approved plan with an interview coordination task is required',
      });
    }
  }

  private async detectConflicts(
    candidateId: string,
    interviewers: string[],
    newStart: Date,
    durationMinutes: number,
  ): Promise<ConflictEntry[]> {
    const newEnd = new Date(newStart.getTime() + durationMinutes * 60_000);
    const windowStart = new Date(newStart.getTime() - MAX_DURATION_MS);
    const nearby = await this.prisma.interviewSchedule.findMany({
      where: {
        status: { in: ACTIVE_INTERVIEW_STATUSES },
        scheduledAt: { gte: windowStart, lt: newEnd },
      },
    });
    const conflicts: ConflictEntry[] = [];

    for (const schedule of nearby) {
      const existingEnd = new Date(
        schedule.scheduledAt.getTime() + schedule.duration * 60_000,
      );
      if (schedule.scheduledAt >= newEnd || existingEnd <= newStart) continue;

      if (schedule.candidateId === candidateId) {
        conflicts.push({
          type: 'CANDIDATE',
          scheduleId: schedule.id,
          scheduledAt: schedule.scheduledAt,
          conflictingWith: candidateId,
        });
      }

      const sharedInterviewer = interviewers.find((id) =>
        schedule.interviewers.includes(id),
      );
      if (sharedInterviewer) {
        conflicts.push({
          type: 'INTERVIEWER',
          scheduleId: schedule.id,
          scheduledAt: schedule.scheduledAt,
          conflictingWith: sharedInterviewer,
        });
      }
    }

    return conflicts;
  }

  async create(payload: {
    requestId: string;
    candidateId: string;
    scheduledAt: string;
    duration: number;
    location: string;
    interviewers: string[];
  }) {
    const scheduledAt = new Date(payload.scheduledAt);

    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'scheduledAt must be a valid future ISO-8601 date',
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

    await this.assertPlanLocked(payload.requestId);
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

    return this.prisma.interviewSchedule.update({
      where: { id: payload.id },
      data: { status: InterviewStatus.CANCELLED },
    });
  }
}
