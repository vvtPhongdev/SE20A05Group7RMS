import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES, JOB_NAMES } from '@wr/queue';
import Redis from 'ioredis';
import {
  CreateNotificationSchema,
  CreateEmailLogSchema,
  CreateNotificationInput,
  CreateEmailLogInput,
  EmailStatus,
} from '@wr/contracts';
import { EmailTemplateService } from './email-template.service';
import { config } from '../../config';

@Injectable()
export class NotificationsService {
  private readonly pubClient: Redis;

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.EMAIL_SEND) private readonly emailQueue: Queue,
    private readonly emailTemplateService: EmailTemplateService,
  ) {
    const redisUrl = config.REDIS_URL;
    this.pubClient = new Redis(redisUrl);
  }

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
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        relatedEntityId: data.relatedEntityId,
        relatedEntityType: data.relatedEntityType,
      },
    });

    // Publish to Redis for real-time SSE
    await this.pubClient.publish('notifications:created', JSON.stringify(notification));

    return notification;
  }

  async sendToRole(payload: {
    role: string;
    departmentId?: string;
    title: string;
    body: string;
    type: string;
    relatedEntityId?: string;
    relatedEntityType?: string;
  }) {
    // Find all active users with the specified role
    const users = await this.prisma.user.findMany({
      where: {
        role: payload.role,
        isActive: true,
        ...(payload.departmentId ? { departmentId: payload.departmentId } : {}),
      },
      select: { id: true },
    });

    const notifications = await Promise.all(
      users.map(async (user) => {
        const notification = await this.prisma.notification.create({
          data: {
            userId: user.id,
            type: payload.type,
            title: payload.title,
            body: payload.body,
            relatedEntityId: payload.relatedEntityId,
            relatedEntityType: payload.relatedEntityType,
          },
        });

        // Publish to Redis for real-time SSE
        await this.pubClient.publish('notifications:created', JSON.stringify(notification));

        return notification;
      }),
    );

    return { count: notifications.length };
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
        jobId: `email-${emailLog.id}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );

    return emailLog;
  }

  async renderTemplate(payload: { templateType: string; templateData: Record<string, any> }) {
    return this.emailTemplateService.render(payload.templateType, payload.templateData);
  }

  async sendTemplatedEmail(payload: {
    userId?: string;
    toEmail: string;
    templateType: string;
    templateData: Record<string, any>;
  }) {
    const { subject, body } = this.emailTemplateService.render(
      payload.templateType,
      payload.templateData,
    );

    return this.sendEmail({
      userId: payload.userId,
      toEmail: payload.toEmail,
      subject,
      body,
      status: EmailStatus.PENDING,
    });
  }
}
