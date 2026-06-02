import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../database/prisma.service';
import { HiringRequestStatus, OverallPlanStatus, TaskPlanType } from '@wr/contracts';

/**
 * T-034: Plan-locked enforcement — FR-07 CRITICAL RULE.
 *
 * No recruitment activity (CV screening, interview scheduling, job posting)
 * can proceed unless:
 *   1. HiringRequest status is APPROVED or later (PLANNING, ACTIVE)
 *   2. OverallPlan exists and is APPROVED
 *   3. TaskPlan for the specific activity type is assigned
 */
@Injectable()
export class PlanGuardService {
  private readonly approvedOrLaterStatuses = new Set<string>([
    HiringRequestStatus.APPROVED,
    HiringRequestStatus.PLANNING,
    HiringRequestStatus.ACTIVE,
  ]);

  constructor(private readonly prisma: PrismaService) {}

  async assertPlanReady(hiringRequestId: string, requiredTaskType: TaskPlanType): Promise<void> {
    // Step 1: Validate HiringRequest exists and status is APPROVED or later
    const request = await this.prisma.hiringRequest.findUnique({ where: { id: hiringRequestId } });
    if (!request) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Precondition failed: Hiring request '${hiringRequestId}' not found`,
      });
    }
    if (!this.approvedOrLaterStatuses.has(request.status)) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: `Precondition failed: Recruitment request must be APPROVED or later. Current status: ${request.status}`,
      });
    }

    // Step 2: Validate OverallPlan exists and is APPROVED
    const plan = await this.prisma.overallPlan.findUnique({ where: { hiringRequestId } });
    if (!plan) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: `Precondition failed: No overall plan exists for request '${hiringRequestId}'. Create and get the plan approved first.`,
      });
    }
    if (plan.status !== OverallPlanStatus.APPROVED) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: `Precondition failed: Overall plan is not yet approved. Current plan status: ${plan.status}`,
      });
    }

    // Step 3: Validate TaskPlan for the required activity type is assigned
    const taskPlan = await this.prisma.taskPlan.findFirst({
      where: { overallPlanId: plan.id, taskType: requiredTaskType },
    });
    if (!taskPlan) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: `Precondition failed: No task plan assigned for activity type '${requiredTaskType}'. Add a ${requiredTaskType} task to the plan first.`,
      });
    }
  }
}
