import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class InterviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async schedule(payload: {
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
        status: 'SCHEDULED',
      },
      include: { results: true },
    });
  }

  async reschedule(payload: {
    id: string;
    scheduledAt?: string;
    duration?: number;
    location?: string;
    interviewers?: string[];
  }) {
    const { id, scheduledAt, ...rest } = payload;
    return this.prisma.interviewSchedule.update({
      where: { id },
      data: {
        ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}),
        ...rest,
        status: 'RESCHEDULED',
      },
      include: { results: true },
    });
  }

  async cancel(payload: { id: string }) {
    return this.prisma.interviewSchedule.update({
      where: { id: payload.id },
      data: { status: 'CANCELLED' },
      include: { results: true },
    });
  }

  async recordResult(payload: {
    interviewId: string;
    result: string;
    notes?: string | null;
  }) {
    const [resultRecord] = await this.prisma.$transaction([
      this.prisma.interviewResult.create({
        data: {
          interviewId: payload.interviewId,
          result: payload.result,
          notes: payload.notes ?? null,
        },
      }),
      this.prisma.interviewSchedule.update({
        where: { id: payload.interviewId },
        data: { status: 'COMPLETED' },
      }),
    ]);
    return resultRecord;
  }

  async get(id: string) {
    return this.prisma.interviewSchedule.findUniqueOrThrow({
      where: { id },
      include: { results: true },
    });
  }

  async list(query: {
    requestId?: string;
    candidateId?: string;
    status?: string;
    page?: string | number;
    pageSize?: string | number;
  }) {
    const page = Number(query.page ?? 1);
    const pageSize = Math.min(Number(query.pageSize ?? 20), 100);

    const where: Record<string, unknown> = {};
    if (query.requestId) where['requestId'] = query.requestId;
    if (query.candidateId) where['candidateId'] = query.candidateId;
    if (query.status) where['status'] = query.status;

    const [data, total] = await Promise.all([
      this.prisma.interviewSchedule.findMany({
        where: where as any,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { scheduledAt: 'asc' },
        include: { results: true },
      }),
      this.prisma.interviewSchedule.count({ where: where as any }),
    ]);

    return { data, total, page, pageSize };
  }
}
