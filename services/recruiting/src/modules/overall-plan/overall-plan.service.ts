import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuditLogService } from '@wr/database';
import { AuditAction, AuditEntityType, NotificationType, PlanStatus } from '@wr/contracts';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class OverallPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
  ) {}

  async create(payload: {
    hiringRequestId: string;
    createdById: string;
    startDate: string; // ISO date string
    endDate: string; // ISO date string
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

    const request = await this.prisma.recruitmentRequest.findUnique({
      where: { id: hiringRequestId },
    });
    if (!request) {
      throw new NotFoundException(`RecruitmentRequest ${hiringRequestId} not found`);
    }

    if (request.status !== 'APPROVED') {
      throw new BadRequestException(
        `Cannot create a plan for a request in status "${request.status}". Request must be APPROVED.`,
      );
    }

    const existing = await this.prisma.overallPlan.findUnique({
      where: { requestId: hiringRequestId },
    });
    if (existing) {
      throw new ConflictException(
        `An OverallPlan already exists for RecruitmentRequest ${hiringRequestId}`,
      );
    }

    const [plan] = await this.prisma.$transaction([
      this.prisma.overallPlan.create({
        data: {
          requestId: hiringRequestId,
          createdById,
          startDate: start,
          endDate: end,
          status: 'PENDING_APPROVAL',
        },
        include: {
          createdBy: { select: { id: true, displayName: true } },
          request: { select: { id: true, position: true, status: true, createdById: true } },
        },
      }),
      this.prisma.recruitmentRequest.update({
        where: { id: hiringRequestId },
        data: { status: 'PLANNING' },
      }),
    ]);

    this.notificationClient
      .send('notification.create_notification', {
        userId: plan.request.createdById,
        type: NotificationType.REQUEST_UPDATE,
        title: 'Request status update: Planning',
        body: `Recruitment request for ${plan.request.position} has transitioned to Planning.`,
        relatedEntityId: hiringRequestId,
        relatedEntityType: 'RecruitmentRequest',
      })
      .subscribe({
        error: (err) => console.error('Failed to send dept head planning notification:', err),
      });

    this.notificationClient
      .send('notification.send_to_role', {
        role: 'HR_MANAGER',
        type: NotificationType.REQUEST_UPDATE,
        title: 'Request status update: Planning',
        body: `Recruitment request for ${plan.request.position} has transitioned to Planning.`,
        relatedEntityId: hiringRequestId,
        relatedEntityType: 'RecruitmentRequest',
      })
      .subscribe({
        error: (err) => console.error('Failed to send HR planning notification:', err),
      });

    this.auditLog
      .log({
        entityType: AuditEntityType.PLAN,
        entityId: plan.id,
        action: AuditAction.PLAN_CREATED,
        toStatus: PlanStatus.PENDING_APPROVAL,
        performedById: createdById,
        metadata: { requestId: hiringRequestId },
      })
      .catch((err) => console.error('Failed to write audit log for PLAN_CREATED:', err));

    return plan;
  }

  /**
   * T-107: Approve a plan pending approval (PENDING_APPROVAL -> APPROVED).
   */
  async approve(payload: { id: string; approvedById: string }) {
    const { id, approvedById } = payload;

    const plan = await this.prisma.overallPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException(`OverallPlan ${id} not found`);
    if (plan.status !== PlanStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        `Cannot approve a plan in status "${plan.status}". Plan must be PENDING_APPROVAL.`,
      );
    }

    const updated = await this.prisma.overallPlan.update({
      where: { id },
      data: { status: PlanStatus.APPROVED, approvedById },
    });

    this.auditLog
      .log({
        entityType: AuditEntityType.PLAN,
        entityId: id,
        action: AuditAction.PLAN_APPROVED,
        fromStatus: PlanStatus.PENDING_APPROVAL,
        toStatus: PlanStatus.APPROVED,
        performedById: approvedById,
      })
      .catch((err) => console.error('Failed to write audit log for PLAN_APPROVED:', err));

    return updated;
  }

  /**
   * T-107: Reject a plan pending approval (PENDING_APPROVAL -> REJECTED).
   */
  async reject(payload: { id: string; approvedById: string; revisionNotes: string }) {
    const { id, approvedById, revisionNotes } = payload;

    const plan = await this.prisma.overallPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException(`OverallPlan ${id} not found`);
    if (plan.status !== PlanStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        `Cannot reject a plan in status "${plan.status}". Plan must be PENDING_APPROVAL.`,
      );
    }
    if (!revisionNotes?.trim()) {
      throw new BadRequestException('revisionNotes are required when rejecting a plan');
    }

    const updated = await this.prisma.overallPlan.update({
      where: { id },
      data: { status: PlanStatus.REJECTED, approvedById, revisionNotes: revisionNotes.trim() },
    });

    this.auditLog
      .log({
        entityType: AuditEntityType.PLAN,
        entityId: id,
        action: AuditAction.PLAN_REJECTED,
        fromStatus: PlanStatus.PENDING_APPROVAL,
        toStatus: PlanStatus.REJECTED,
        performedById: approvedById,
        reason: revisionNotes.trim(),
      })
      .catch((err) => console.error('Failed to write audit log for PLAN_REJECTED:', err));

    return updated;
  }

  async get(id: string) {
    const plan = await this.prisma.overallPlan.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, displayName: true } },
        approvedBy: { select: { id: true, displayName: true } },
        request: { select: { id: true, position: true, status: true } },
        tasks: {
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
      where: { requestId: hiringRequestId },
      include: {
        createdBy: { select: { id: true, displayName: true } },
        approvedBy: { select: { id: true, displayName: true } },
        tasks: {
          include: { assignedTo: { select: { id: true, displayName: true } } },
          orderBy: { startDate: 'asc' },
        },
      },
    });
    if (!plan)
      throw new NotFoundException(`No OverallPlan found for RecruitmentRequest ${hiringRequestId}`);
    return plan;
  }
}
