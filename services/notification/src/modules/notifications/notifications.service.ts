import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES, JOB_NAMES } from '@wr/queue';
import {
  CreateNotificationSchema,
  CreateEmailLogSchema,
  CreateNotificationInput,
  CreateEmailLogInput,
  EmailStatus,
} from '@wr/contracts';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.EMAIL_SEND) private readonly emailQueue: Queue,
  ) {}

  async listNotifications(payload: { userId: string }) {
    if (!payload.userId) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'userId is required',
      });
    }
    return this.prisma.notification.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markRead(payload: { id: string; userId: string }) {
    if (!payload.id || !payload.userId) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'id and userId are required',
      });
    }

    // 1. Verify notification exists and belongs to the authenticated user
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: payload.id,
        userId: payload.userId,
      },
    });

    if (!notification) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Notification with ID ${payload.id} not found or access denied`,
      });
    }

    // 2. Update status
    return this.prisma.notification.update({
      where: { id: payload.id },
      data: { isRead: true },
    });
  }

  async markAllRead(payload: { userId: string }) {
    if (!payload.userId) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'userId is required',
      });
    }

    // Update all unread notifications for this user
    await this.prisma.notification.updateMany({
      where: {
        userId: payload.userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { success: true };
  }

  async createNotification(payload: CreateNotificationInput) {
    const validated = CreateNotificationSchema.safeParse(payload);
    if (!validated.success) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid notification data: ' + validated.error.message,
      });
    }

    const data = validated.data;
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        relatedEntityId: data.relatedEntityId,
        relatedEntityType: data.relatedEntityType,
      },
    });
  }

  async sendEmail(payload: CreateEmailLogInput) {
    const validated = CreateEmailLogSchema.safeParse(payload);
    if (!validated.success) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid email log data: ' + validated.error.message,
      });
    }

    const data = validated.data;

    // 1. Create a PENDING EmailLog record in the database
    const emailLog = await this.prisma.emailLog.create({
      data: {
        userId: data.userId,
        toEmail: data.toEmail,
        subject: data.subject,
        body: data.body,
        status: EmailStatus.PENDING,
      },
    });

    // 2. Enqueue the email sending job to BullMQ
    await this.emailQueue.add(
      JOB_NAMES.SEND_EMAIL,
      {
        emailLogId: emailLog.id,
        to: emailLog.toEmail,
        subject: emailLog.subject,
        body: emailLog.body,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );

    return emailLog;
  }
}
