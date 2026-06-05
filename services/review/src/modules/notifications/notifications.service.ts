import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listNotifications(payload: { userId: string }) {
    return this.prisma.notification.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markRead(payload: { id: string; userId: string }) {
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
}
