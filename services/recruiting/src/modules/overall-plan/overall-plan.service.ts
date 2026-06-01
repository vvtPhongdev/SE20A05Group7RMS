import { Injectable, BadRequestException, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class OverallPlanService {
  private readonly logger = new Logger(OverallPlanService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(payload: {
    hiringRequestId: string;
    createdById: string;
    startDate: string;
    endDate: string;
  }) {
    const { hiringRequestId, createdById, startDate, endDate } = payload;

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('startDate and endDate must be valid dates');
    }
    if (end <= start) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const request = await this.prisma.hiringRequest.findUnique({ where: { id: hiringRequestId } });
    if (!request) throw new NotFoundException(`HiringRequest ${hiringRequestId} not found`);
    if (request.status !== 'APPROVED') {
      throw new BadRequestException(
        `Cannot create a plan for a request in status "${request.status}". Request must be APPROVED.`,
      );
    }

    const existing = await this.prisma.overallPlan.findUnique({ where: { hiringRequestId } });
    if (existing) {
      throw new ConflictException(`An OverallPlan already exists for HiringRequest ${hiringRequestId}`);
    }

    const [plan] = await this.prisma.$transaction([
      this.prisma.overallPlan.create({
        data: { hiringRequestId, createdById, startDate: start, endDate: end, status: 'PENDING_APPROVAL' },
        include: {
          createdBy: { select: { id: true, displayName: true } },
          hiringRequest: { select: { id: true, title: true, status: true } },
        },
      }),
      this.prisma.hiringRequest.update({
        where: { id: hiringRequestId },
        data: { status: 'PLANNING' },
      }),
    ]);

    return plan;
  }

  async get(id: string) {
    const plan = await this.prisma.overallPlan.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, displayName: true } },
        approvedBy: { select: { id: true, displayName: true } },
        hiringRequest: { select: { id: true, title: true, status: true } },
        taskPlans: {
          include: { assignedTo: { select: { id: true, displayName: true } } },
          orderBy: { startDate: 'asc' },
        },
      },
    });
    if (!plan) throw new NotFoundException(`OverallPlan ${id} not found`);
    return plan;
  }

  async getByRequest(hiringRequestId: string) {
    const plan = await this.prisma.overallPlan.findUnique({
      where: { hiringRequestId },
      include: {
        createdBy: { select: { id: true, displayName: true } },
        approvedBy: { select: { id: true, displayName: true } },
        taskPlans: {
          include: { assignedTo: { select: { id: true, displayName: true } } },
          orderBy: { startDate: 'asc' },
        },
      },
    });
    if (!plan) throw new NotFoundException(`No OverallPlan found for HiringRequest ${hiringRequestId}`);
    return plan;
  }

  // ─── Approve ──────────────────────────────────────────────────────

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

  // ─── Reject ───────────────────────────────────────────────────────

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
