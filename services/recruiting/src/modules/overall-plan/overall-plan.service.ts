import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import { HiringRequestStatus, OverallPlanStatus, UserRole } from '@wr/contracts';
import { NotificationsService } from '../../common/notifications/notifications.service';

@Injectable()
export class OverallPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // T-030: Create OverallPlan linked to APPROVED request; validate dates; transition request to PLANNING
  async create(dto: {
    hiringRequestId: string;
    createdById: string;
    startDate: string;
    endDate: string;
  }) {
    const request = await this.findRequestOrFail(dto.hiringRequestId);

    if (request.status !== HiringRequestStatus.APPROVED) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Recruitment request must be APPROVED before creating a plan. Current status: ${request.status}`,
      });
    }

    const existing = await this.prisma.overallPlan.findUnique({
      where: { hiringRequestId: dto.hiringRequestId },
    });
    if (existing) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: 'An overall plan already exists for this recruitment request',
      });
    }

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end <= start) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'endDate must be after startDate',
      });
    }

    const [plan] = await this.prisma.$transaction([
      this.prisma.overallPlan.create({
        data: {
          hiringRequestId: dto.hiringRequestId,
          createdById: dto.createdById,
          startDate: start,
          endDate: end,
          status: OverallPlanStatus.PENDING_APPROVAL,
        },
        include: { taskPlans: true },
      }),
      this.prisma.hiringRequest.update({
        where: { id: dto.hiringRequestId },
        data: { status: HiringRequestStatus.PLANNING },
      }),
    ]);

    // Notify Admins that a plan is awaiting their approval
    await this.notifications.notifyByRole(
      UserRole.ADMIN,
      request.organizationId,
      'REQUEST_SUBMITTED',
      `Recruitment plan ready for review: ${request.title}`,
      `HR Manager has created a recruitment plan for "${request.title}" (${start.toDateString()} – ${end.toDateString()}). Please review and approve.`,
      plan.id,
      'OVERALL_PLAN',
    );

    return plan;
  }

  // T-030: Get Overall Plan with all task plans
  async getByRequest(hiringRequestId: string) {
    const plan = await this.prisma.overallPlan.findUnique({
      where: { hiringRequestId },
      include: {
        taskPlans: { orderBy: { startDate: 'asc' } },
      },
    });
    if (!plan) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: 'No overall plan found for this recruitment request',
      });
    }
    return plan;
  }

  // T-033: Approve plan → APPROVED; HiringRequest → ACTIVE (downstream unlocked). FR-06.
  async approve(dto: { hiringRequestId: string; approverId: string }) {
    const plan = await this.findPlanOrFail(dto.hiringRequestId);

    if (plan.status !== OverallPlanStatus.PENDING_APPROVAL) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Only PENDING_APPROVAL plans can be approved. Current status: ${plan.status}`,
      });
    }

    const request = await this.findRequestOrFail(dto.hiringRequestId);

    const [updated] = await this.prisma.$transaction([
      this.prisma.overallPlan.update({
        where: { id: plan.id },
        data: { status: OverallPlanStatus.APPROVED, approvedById: dto.approverId },
        include: { taskPlans: true },
      }),
      this.prisma.hiringRequest.update({
        where: { id: dto.hiringRequestId },
        data: { status: HiringRequestStatus.ACTIVE },
      }),
    ]);

    // FR-06: Notify HR Manager that the plan is approved and activities are unlocked
    await this.notifications.notify(
      plan.createdById,
      'PLAN_APPROVED',
      `Your recruitment plan for "${request.title}" has been approved`,
      `Admin has approved the plan. Recruitment activities (job posting, CV screening, interview coordination) are now unlocked.`,
      plan.id,
      'OVERALL_PLAN',
    );

    // Also notify the Department Head
    await this.notifications.notify(
      request.requestedById,
      'PLAN_APPROVED',
      `Recruitment plan approved for "${request.title}"`,
      `The overall recruitment plan has been approved. Active recruitment will begin shortly.`,
      plan.id,
      'OVERALL_PLAN',
    );

    return updated;
  }

  // T-033: Reject plan → REVISION_REQUIRED; mandatory reason; HiringRequest stays PLANNING. FR-06.
  async reject(dto: { hiringRequestId: string; approverId: string; reason: string }) {
    if (!dto.reason || dto.reason.trim().length === 0) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Rejection reason is mandatory and cannot be empty',
      });
    }

    const plan = await this.findPlanOrFail(dto.hiringRequestId);

    if (plan.status !== OverallPlanStatus.PENDING_APPROVAL) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Only PENDING_APPROVAL plans can be rejected. Current status: ${plan.status}`,
      });
    }

    const request = await this.findRequestOrFail(dto.hiringRequestId);

    const updated = await this.prisma.overallPlan.update({
      where: { id: plan.id },
      data: {
        status: OverallPlanStatus.REVISION_REQUIRED,
        revisionNotes: dto.reason,
        approvedById: dto.approverId,
      },
      include: { taskPlans: true },
    });

    // FR-06: Notify HR Manager with the rejection reason to trigger the revision cycle
    await this.notifications.notify(
      plan.createdById,
      'PLAN_REJECTED',
      `Revision required for recruitment plan: "${request.title}"`,
      `Admin has requested revisions to the recruitment plan. Reason: ${dto.reason}`,
      plan.id,
      'OVERALL_PLAN',
    );

    return updated;
  }

  private async findPlanOrFail(hiringRequestId: string) {
    const plan = await this.prisma.overallPlan.findUnique({ where: { hiringRequestId } });
    if (!plan) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: 'Overall plan not found for this recruitment request',
      });
    }
    return plan;
  }

  private async findRequestOrFail(id: string) {
    const request = await this.prisma.hiringRequest.findUnique({ where: { id } });
    if (!request) {
      throw new RpcException({ status: HttpStatus.NOT_FOUND, message: 'Hiring request not found' });
    }
    return request;
  }
}
