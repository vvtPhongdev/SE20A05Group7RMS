import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import { InterviewStatus } from '@wr/contracts';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

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
}
