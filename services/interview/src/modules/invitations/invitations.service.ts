import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import { EmailStatus } from '@wr/contracts';

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * FR-13: Creates EmailLog entries for each recipient and marks them PENDING.
   * Actual SMTP delivery is handled by the worker service consuming the email queue.
   */
  async sendInvitations(payload: {
    interviewId: string;
    recipients: Array<{ email: string; name: string; role: string }>;
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

    const subject = `Interview Invitation — ${new Date(schedule.scheduledAt).toLocaleString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' })}`;

    const logs = await this.prisma.$transaction(
      payload.recipients.map((recipient) =>
        this.prisma.emailLog.create({
          data: {
            toEmail: recipient.email,
            subject,
            body: this.buildInvitationBody(recipient, schedule),
            status: EmailStatus.PENDING,
          },
        }),
      ),
    );

    return { sent: logs.length, logs };
  }

  async getEmailLogs(interviewId: string) {
    const schedule = await this.prisma.interviewSchedule.findUnique({
      where: { id: interviewId },
    });

    if (!schedule) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Interview schedule ${interviewId} not found`,
      });
    }

    // EmailLog has no direct FK to interviewId; query by subject prefix derived from scheduledAt
    const subject = `Interview Invitation — ${new Date(schedule.scheduledAt).toLocaleString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' })}`;

    return this.prisma.emailLog.findMany({
      where: { subject },
      orderBy: { createdAt: 'desc' },
    });
  }

  private buildInvitationBody(
    recipient: { name: string; role: string },
    schedule: { scheduledAt: Date; duration: number; location: string },
  ): string {
    const dateStr = new Date(schedule.scheduledAt).toLocaleString('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    return [
      `Dear ${recipient.name},`,
      '',
      `You are invited to attend an interview as ${recipient.role}.`,
      '',
      `Date & Time : ${dateStr} (ICT)`,
      `Duration   : ${schedule.duration} minutes`,
      `Location   : ${schedule.location}`,
      '',
      'Please confirm your attendance by replying to this email.',
      '',
      'Best regards,',
      'HR Team — Recruitment Management System',
    ].join('\n');
  }
}
