import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

const APPROVED_OR_LATER = new Set([
  'APPROVED',
  'PLANNING',
  'PLAN_PENDING_APPROVAL',
  'ACTIVE',
]);

@Injectable()
export class PlanGuardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Asserts all plan-lock conditions before a downstream activity may proceed.
   * Throws ForbiddenException with a specific message for each unmet condition:
   *   1. HiringRequest must be APPROVED or later.
   *   2. An OverallPlan must exist and be APPROVED.
   *   3. If taskType is given, a TaskPlan for that activity must be assigned.
   */
  async assertPlanReady(hiringRequestId: string, taskType?: string): Promise<void> {
    // ── Check 1: request status ──────────────────────────────────────
    const request = await this.prisma.hiringRequest.findUnique({
      where: { id: hiringRequestId },
      select: { id: true, status: true },
    });
    if (!request) {
      throw new NotFoundException(`HiringRequest ${hiringRequestId} not found`);
    }
    if (!APPROVED_OR_LATER.has(request.status)) {
      throw new ForbiddenException(
        `Recruitment request is not yet approved (current status: "${request.status}"). ` +
        `The request must be APPROVED or later before downstream activities can proceed.`,
      );
    }

    // ── Check 2: OverallPlan exists and is APPROVED ──────────────────
    const plan = await this.prisma.overallPlan.findUnique({
      where: { hiringRequestId },
      select: { id: true, status: true },
    });
    if (!plan) {
      throw new ForbiddenException(
        `No recruitment plan exists for request ${hiringRequestId}. ` +
        `An approved OverallPlan is required before downstream activities can proceed.`,
      );
    }
    if (plan.status !== 'APPROVED') {
      throw new ForbiddenException(
        `Recruitment plan is not approved (current plan status: "${plan.status}"). ` +
        `The OverallPlan must be APPROVED before downstream activities can proceed.`,
      );
    }

    // ── Check 3: TaskPlan assignment for the activity type ───────────
    if (taskType) {
      const taskPlan = await this.prisma.taskPlan.findFirst({
        where: { overallPlanId: plan.id, taskType },
        select: { id: true },
      });
      if (!taskPlan) {
        throw new ForbiddenException(
          `No task assignment found for activity type "${taskType}" in the recruitment plan. ` +
          `A TaskPlan for "${taskType}" must be created and assigned before this activity can proceed.`,
        );
      }
    }
  }
}
