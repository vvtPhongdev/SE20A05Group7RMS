import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class OverallPlanService {
  private readonly logger = new Logger(OverallPlanService.name);

  constructor(private readonly prisma: PrismaService) {}

  async approve(hiringRequestId: string, approverId: string) {
    const plan = await this.prisma.overallPlan.findUnique({
      where: { hiringRequestId },
      include: {
        createdBy: { select: { id: true, displayName: true, email: true } },
        hiringRequest: { select: { id: true, title: true } },
      },
    });
    if (!plan) throw new NotFoundException(`No OverallPlan found for HiringRequest ${hiringRequestId}`);
    if (plan.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(
        `Plan cannot be approved in status "${plan.status}". Must be PENDING_APPROVAL.`,
      );
    }

    const approver = await this.prisma.user.findUnique({ where: { id: approverId } });
    if (!approver) throw new NotFoundException(`Approver user ${approverId} not found`);

    const [updated] = await this.prisma.$transaction([
      this.prisma.overallPlan.update({
        where: { id: plan.id },
        data: { status: 'APPROVED', approvedById: approverId, approvedAt: new Date() },
        include: {
          createdBy: { select: { id: true, displayName: true } },
          approvedBy: { select: { id: true, displayName: true } },
          hiringRequest: { select: { id: true, title: true, status: true } },
          taskPlans: {
            include: { assignedTo: { select: { id: true, displayName: true } } },
            orderBy: { startDate: 'asc' },
          },
        },
      }),
      this.prisma.hiringRequest.update({
        where: { id: hiringRequestId },
        data: { status: 'ACTIVE' },
      }),
    ]);

    this.logger.log(
      `[NOTIFY] OverallPlan ${plan.id} approved by ${approver.displayName}. ` +
      `HiringRequest "${plan.hiringRequest.title}" is now ACTIVE (downstream unlocked). ` +
      `Notifying HR: ${plan.createdBy.displayName} (${plan.createdBy.email}).`,
    );

    return updated;
  }

  async reject(hiringRequestId: string, approverId: string, reason: string) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('A rejection reason is mandatory');
    }

    const plan = await this.prisma.overallPlan.findUnique({
      where: { hiringRequestId },
      include: {
        createdBy: { select: { id: true, displayName: true, email: true } },
        hiringRequest: { select: { id: true, title: true } },
      },
    });
    if (!plan) throw new NotFoundException(`No OverallPlan found for HiringRequest ${hiringRequestId}`);
    if (plan.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(
        `Plan cannot be rejected in status "${plan.status}". Must be PENDING_APPROVAL.`,
      );
    }

    const updated = await this.prisma.overallPlan.update({
      where: { id: plan.id },
      data: { status: 'REVISION_REQUIRED', revisionNotes: reason },
      include: {
        createdBy: { select: { id: true, displayName: true } },
        hiringRequest: { select: { id: true, title: true, status: true } },
        taskPlans: {
          include: { assignedTo: { select: { id: true, displayName: true } } },
          orderBy: { startDate: 'asc' },
        },
      },
    });

    this.logger.log(
      `[NOTIFY] OverallPlan ${plan.id} rejected. Reason: "${reason}". ` +
      `Notifying HR: ${plan.createdBy.displayName} (${plan.createdBy.email}).`,
    );

    return updated;
  }
}
