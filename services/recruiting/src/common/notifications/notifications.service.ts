import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from '@wr/contracts';

export type NotificationType =
  | 'REQUEST_SUBMITTED'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'REVISION_REQUESTED'
  | 'PLAN_APPROVED'
  | 'PLAN_REJECTED'
  | 'TASK_ASSIGNED';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Send one notification to a specific user
  async notify(
    recipientId: string,
    type: NotificationType,
    title: string,
    body: string,
    resourceId?: string,
    resourceType?: string,
  ) {
    await this.prisma.notification.create({
      data: { recipientId, type, title, body, resourceId: resourceId ?? null, resourceType: resourceType ?? null },
    });
  }

  // Notify all users with a given role in an organization
  async notifyByRole(
    role: UserRole,
    organizationId: string,
    type: NotificationType,
    title: string,
    body: string,
    resourceId?: string,
    resourceType?: string,
  ) {
    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: { user: { select: { id: true, role: true } } },
    });

    const targets = members.filter((m) => m.user.role === role);
    if (targets.length === 0) return;

    await this.prisma.notification.createMany({
      data: targets.map((m) => ({
        recipientId: m.user.id,
        type,
        title,
        body,
        resourceId: resourceId ?? null,
        resourceType: resourceType ?? null,
      })),
    });
  }
}
