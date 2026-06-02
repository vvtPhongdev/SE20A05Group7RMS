import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(recipientId: string, unreadOnly: boolean, page: number, pageSize: number) {
    const where: any = { recipientId };
    if (unreadOnly) where.isRead = false;

    const skip = (Math.max(1, page) - 1) * pageSize;

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { recipientId, isRead: false } }),
    ]);

    return { items, total, unreadCount, page, pageSize };
  }

  async markRead(id: string, recipientId: string) {
    const notif = await this.prisma.notification.findUnique({ where: { id } });
    if (!notif || notif.recipientId !== recipientId) {
      throw new RpcException({ status: HttpStatus.NOT_FOUND, message: 'Notification not found' });
    }
    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async markAllRead(recipientId: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { recipientId, isRead: false },
      data: { isRead: true },
    });
    return { markedRead: count };
  }
}
