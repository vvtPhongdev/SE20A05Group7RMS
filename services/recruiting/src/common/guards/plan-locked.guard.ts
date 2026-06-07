import { Injectable, CanActivate, ExecutionContext, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../database/prisma.service';
import { PLAN_LOCKED_KEY } from '../decorators/plan-locked.decorator';
import { TaskType, RecruitmentRequestStatus, PlanStatus } from '@wr/contracts';

@Injectable()
export class PlanLockedGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const activityType = this.reflector.get<TaskType>(PLAN_LOCKED_KEY, context.getHandler());
    if (!activityType) {
      return true;
    }

    const data = context.switchToRpc().getData();
    const requestId = data?.requestId || data?.id || data?.filters?.requestId;

    if (!requestId) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'requestId is required for plan-locked checks',
      });
    }

    // 1. RecruitmentRequest is APPROVED or later
    const request = await this.prisma.recruitmentRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Recruitment request with ID ${requestId} not found`,
      });
    }

    const unallowedStatuses = [
      RecruitmentRequestStatus.DRAFT,
      RecruitmentRequestStatus.PENDING_REVIEW,
      RecruitmentRequestStatus.REJECTED,
      RecruitmentRequestStatus.REVISION_NEEDED,
    ];

    if (unallowedStatuses.includes(request.status as RecruitmentRequestStatus)) {
      throw new RpcException({
        status: HttpStatus.PRECONDITION_FAILED,
        message: `Recruitment request status must be APPROVED or later. Current status: ${request.status}`,
      });
    }

    // 2. OverallPlan exists and is approved
    const overallPlan = await this.prisma.overallPlan.findUnique({
      where: { requestId },
    });

    if (!overallPlan) {
      throw new RpcException({
        status: HttpStatus.PRECONDITION_FAILED,
        message: `Overall plan for recruitment request ${requestId} does not exist`,
      });
    }

    if (overallPlan.status !== PlanStatus.APPROVED) {
      throw new RpcException({
        status: HttpStatus.PRECONDITION_FAILED,
        message: `Overall plan is not approved. Current status: ${overallPlan.status}`,
      });
    }

    // 3. TaskPlan assignments exist for activity type
    const taskPlan = await this.prisma.taskPlan.findFirst({
      where: {
        overallPlanId: overallPlan.id,
        taskType: activityType,
      },
    });

    if (!taskPlan) {
      throw new RpcException({
        status: HttpStatus.PRECONDITION_FAILED,
        message: `No TaskPlan assignment found for activity type ${activityType}`,
      });
    }

    return true;
  }
}
