import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import {
  EmailStatus,
  InterviewStatus,
  NotificationType,
} from '@wr/contracts';

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

  private async detectConflicts(
    candidateId: string,
    interviewers: string[],
    newStart: Date,
    durationMinutes: number,
    excludeId: string,
  ): Promise<ConflictEntry[]> {
    const newEnd = new Date(newStart.getTime() + durationMinutes * 60_000);
    const windowStart = new Date(newStart.getTime() - MAX_DURATION_MS);
    const nearby = await this.prisma.interviewSchedule.findMany({
      where: {
        status: { in: ACTIVE_INTERVIEW_STATUSES },
        scheduledAt: { gte: windowStart, lt: newEnd },
        NOT: { id: excludeId },
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

  async scheduleInterview(payload: {
    requestId: string;
    candidateId: string;
    scheduledAt: string;
    duration: number;
    location: string;
    interviewers: string[];
  }) {
    return this.prisma.interviewSchedule.create({
      data: {
        requestId: payload.requestId,
        candidateId: payload.candidateId,
        scheduledAt: new Date(payload.scheduledAt),
        duration: payload.duration,
        location: payload.location,
        interviewers: payload.interviewers,
        status: InterviewStatus.SCHEDULED,
      },
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

    if (
      existing.status === InterviewStatus.CANCELLED ||
      existing.status === InterviewStatus.COMPLETED
    ) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: `Cannot reschedule a ${existing.status.toLowerCase()} interview`,
      });
    }

    if (!payload.reason?.trim()) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'reason is required when rescheduling an interview',
      });
    }

    const newStart = new Date(payload.scheduledAt);
    if (Number.isNaN(newStart.getTime()) || newStart <= new Date()) {
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

    const [candidate, interviewers] = await Promise.all([
      this.prisma.candidateProfile.findUnique({
        where: { id: existing.candidateId },
        select: { userId: true, fullName: true, email: true },
      }),
      this.prisma.user.findMany({
        where: { id: { in: payload.interviewers } },
        select: { id: true, email: true, displayName: true },
      }),
    ]);

    const newTime = newStart.toLocaleString('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      dateStyle: 'full',
      timeStyle: 'short',
    });
    const oldTime = existing.scheduledAt.toLocaleString('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      dateStyle: 'full',
      timeStyle: 'short',
    });
    const reason = payload.reason.trim();
    const subject = `Interview rescheduled - ${newTime} (ICT)`;
    const emailBody = (name: string, role: string) =>
      [
        `Dear ${name},`,
        '',
        `Your interview as ${role} has been rescheduled.`,
        `Previous time: ${oldTime} (ICT)`,
        `New time: ${newTime} (ICT)`,
        `Duration: ${payload.duration} minutes`,
        `Location: ${payload.location}`,
        `Reason: ${reason}`,
      ].join('\n');
    const notificationBody = (role: string) =>
      `Your interview as ${role} has moved to ${newTime} (ICT). Reason: ${reason}`;

    const [schedule] = await this.prisma.$transaction([
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
      ...(candidate
        ? [
            this.prisma.emailLog.create({
              data: {
                userId: candidate.userId,
                toEmail: candidate.email,
                subject,
                body: emailBody(candidate.fullName, 'Candidate'),
                status: EmailStatus.PENDING,
              },
            }),
            this.prisma.notification.create({
              data: {
                userId: candidate.userId,
                type: NotificationType.INTERVIEW_INVITE,
                title: 'Interview Rescheduled',
                body: notificationBody('Candidate'),
                relatedEntityId: payload.id,
                relatedEntityType: 'InterviewSchedule',
              },
            }),
          ]
        : []),
      ...interviewers.flatMap((interviewer) => [
        this.prisma.emailLog.create({
          data: {
            userId: interviewer.id,
            toEmail: interviewer.email,
            subject,
            body: emailBody(interviewer.displayName, 'Interviewer'),
            status: EmailStatus.PENDING,
          },
        }),
        this.prisma.notification.create({
          data: {
            userId: interviewer.id,
            type: NotificationType.INTERVIEW_INVITE,
            title: 'Interview Rescheduled',
            body: notificationBody('Interviewer'),
            relatedEntityId: payload.id,
            relatedEntityType: 'InterviewSchedule',
          },
        }),
      ]),
    ]);

    return {
      schedule,
      notified: {
        candidate: candidate?.email ?? null,
        interviewers: interviewers.map((interviewer) => interviewer.email),
      },
    };
  }
}
