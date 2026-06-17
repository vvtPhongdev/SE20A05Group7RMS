import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { AuditLogService } from '@wr/database';
import { AuditAction, AuditEntityType, PlanStatus, TaskStatus, TaskType, UserRole } from '@wr/contracts';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class TaskPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * T-107: Create (assign) a task within an OverallPlan.
   */
  private rpc(status: HttpStatus, message: string): never {
    throw new RpcException({ status, message });
  }

  private assertEditablePlanStatus(status: string) {
    if (
      ![PlanStatus.DRAFT, PlanStatus.REJECTED, PlanStatus.PENDING_APPROVAL].includes(
        status as PlanStatus,
      )
    ) {
      this.rpc(
        HttpStatus.BAD_REQUEST,
        `Tasks can only be edited before Admin approves the plan. Current status: ${status}`,
      );
    }
  }

  private parseAndValidateDates(plan: { startDate: Date; endDate: Date }, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      this.rpc(HttpStatus.BAD_REQUEST, 'startDate and endDate must be valid dates');
    }
    if (end <= start) {
      this.rpc(HttpStatus.BAD_REQUEST, 'endDate must be after startDate');
    }

    const planStart = new Date(plan.startDate);
    const planEnd = new Date(plan.endDate);
    if (start < planStart || end > planEnd) {
      this.rpc(
        HttpStatus.BAD_REQUEST,
        `Task dates must fall within the overall plan timeline (${planStart.toISOString()} to ${planEnd.toISOString()})`,
      );
    }

    return { start, end };
  }

  async create(payload: {
    overallPlanId: string;
    taskType: string;
    assignedToId: string;
    startDate: string;
    endDate: string;
    performedById?: string;
  }) {
    const { overallPlanId, taskType, assignedToId, startDate, endDate, performedById } = payload;

    if (!Object.values(TaskType).includes(taskType as TaskType)) {
      this.rpc(
        HttpStatus.BAD_REQUEST,
        `taskType must be one of: ${Object.values(TaskType).join(', ')}`,
      );
    }

    const plan = await this.prisma.overallPlan.findUnique({ where: { id: overallPlanId } });
    if (!plan) this.rpc(HttpStatus.NOT_FOUND, `OverallPlan ${overallPlanId} not found`);

    this.assertEditablePlanStatus(plan.status);

    const assignee = await this.prisma.user.findUnique({
      where: { id: assignedToId },
      select: { id: true, role: true, isActive: true },
    });

    if (!assignee) {
      this.rpc(HttpStatus.NOT_FOUND, `Assigned HR member ${assignedToId} not found`);
    }

    if (!assignee.isActive || ![UserRole.HR_LEADER, UserRole.HR_RECRUITER].includes(assignee.role as UserRole)) {
      this.rpc(HttpStatus.BAD_REQUEST, 'Task can only be assigned to an active HR member');
    }

    const { start, end } = this.parseAndValidateDates(plan, startDate, endDate);

    const task = await this.prisma.taskPlan.create({
      data: {
        overallPlanId,
        taskType,
        assignedToId,
        startDate: start,
        endDate: end,
        status: TaskStatus.PENDING,
      },
      include: { assignedTo: { select: { id: true, displayName: true, email: true } } },
    });

    this.auditLog
      .log({
        entityType: AuditEntityType.TASK_PLAN,
        entityId: task.id,
        action: AuditAction.TASK_PLAN_ASSIGNED,
        toStatus: TaskStatus.PENDING,
        performedById: performedById ?? assignedToId,
        metadata: { overallPlanId, taskType, assignedToId },
      })
      .catch((err) => console.error('Failed to write audit log for TASK_PLAN_ASSIGNED:', err));

    return task;
  }

  async update(payload: {
    id: string;
    taskType?: string;
    startDate?: string;
    endDate?: string;
    performedById: string;
  }) {
    const task = await this.prisma.taskPlan.findUnique({
      where: { id: payload.id },
      include: { overallPlan: true },
    });
    if (!task) this.rpc(HttpStatus.NOT_FOUND, `TaskPlan ${payload.id} not found`);

    this.assertEditablePlanStatus(task.overallPlan.status);

    const nextTaskType = payload.taskType ?? task.taskType;
    if (!Object.values(TaskType).includes(nextTaskType as TaskType)) {
      this.rpc(
        HttpStatus.BAD_REQUEST,
        `taskType must be one of: ${Object.values(TaskType).join(', ')}`,
      );
    }

    const { start, end } = this.parseAndValidateDates(
      task.overallPlan,
      payload.startDate ?? task.startDate.toISOString(),
      payload.endDate ?? task.endDate.toISOString(),
    );

    const updated = await this.prisma.taskPlan.update({
      where: { id: payload.id },
      data: {
        taskType: nextTaskType,
        startDate: start,
        endDate: end,
      },
      include: { assignedTo: { select: { id: true, displayName: true, email: true, role: true } } },
    });

    this.auditLog
      .log({
        entityType: AuditEntityType.TASK_PLAN,
        entityId: payload.id,
        action: AuditAction.TASK_PLAN_ASSIGNED,
        performedById: payload.performedById,
        metadata: {
          previousTaskType: task.taskType,
          taskType: nextTaskType,
          previousStartDate: task.startDate.toISOString(),
          startDate: start.toISOString(),
          previousEndDate: task.endDate.toISOString(),
          endDate: end.toISOString(),
        },
      })
      .catch((err) => console.error('Failed to write audit log for TASK_PLAN_UPDATED:', err));

    return updated;
  }

  async assignRecruiter(payload: { id: string; assignedToId: string; performedById: string }) {
    const task = await this.prisma.taskPlan.findUnique({
      where: { id: payload.id },
      include: { overallPlan: true },
    });
    if (!task) this.rpc(HttpStatus.NOT_FOUND, `TaskPlan ${payload.id} not found`);

    if (task.overallPlan.status !== PlanStatus.APPROVED) {
      this.rpc(HttpStatus.BAD_REQUEST, 'Recruiters can only be assigned after Admin approves the plan');
    }

    const assignee = await this.prisma.user.findUnique({
      where: { id: payload.assignedToId },
      select: { id: true, role: true, isActive: true },
    });
    if (!assignee) this.rpc(HttpStatus.NOT_FOUND, `Assigned HR recruiter ${payload.assignedToId} not found`);
    if (!assignee.isActive || assignee.role !== UserRole.HR_RECRUITER) {
      this.rpc(HttpStatus.BAD_REQUEST, 'Task must be assigned to an active HR recruiter');
    }

    const updated = await this.prisma.taskPlan.update({
      where: { id: payload.id },
      data: { assignedToId: payload.assignedToId },
      include: { assignedTo: { select: { id: true, displayName: true, email: true } } },
    });

    this.auditLog
      .log({
        entityType: AuditEntityType.TASK_PLAN,
        entityId: payload.id,
        action: AuditAction.TASK_PLAN_ASSIGNED,
        performedById: payload.performedById,
        metadata: {
          previousAssignedToId: task.assignedToId,
          assignedToId: payload.assignedToId,
        },
      })
      .catch((err) => console.error('Failed to write audit log for TASK_PLAN_ASSIGNED:', err));

    return updated;
  }

  /**
   * T-107: Update a task's status (PENDING -> IN_PROGRESS -> COMPLETED).
   */
  async updateStatus(payload: { id: string; status: string; performedById: string }) {
    const { id, status, performedById } = payload;

    if (!Object.values(TaskStatus).includes(status as TaskStatus)) {
      this.rpc(
        HttpStatus.BAD_REQUEST,
        `status must be one of: ${Object.values(TaskStatus).join(', ')}`,
      );
    }

    const task = await this.prisma.taskPlan.findUnique({ where: { id } });
    if (!task) this.rpc(HttpStatus.NOT_FOUND, `TaskPlan ${id} not found`);

    const updated = await this.prisma.taskPlan.update({
      where: { id },
      data: { status },
      include: { assignedTo: { select: { id: true, displayName: true } } },
    });

    this.auditLog
      .log({
        entityType: AuditEntityType.TASK_PLAN,
        entityId: id,
        action: AuditAction.TASK_PLAN_STATUS_CHANGED,
        fromStatus: task.status,
        toStatus: status,
        performedById,
      })
      .catch((err) =>
        console.error('Failed to write audit log for TASK_PLAN_STATUS_CHANGED:', err),
      );

    return updated;
  }

  async list(overallPlanId: string) {
    const plan = await this.prisma.overallPlan.findUnique({ where: { id: overallPlanId } });
    if (!plan) this.rpc(HttpStatus.NOT_FOUND, `OverallPlan ${overallPlanId} not found`);

    return this.prisma.taskPlan.findMany({
      where: { overallPlanId },
      include: { assignedTo: { select: { id: true, displayName: true } } },
      orderBy: { startDate: 'asc' },
    });
  }

  async listByRequest(hiringRequestId: string) {
    const plan = await this.prisma.overallPlan.findUnique({
      where: { requestId: hiringRequestId },
    });
    if (!plan) {
      this.rpc(
        HttpStatus.NOT_FOUND,
        `No OverallPlan found for RecruitmentRequest ${hiringRequestId}`,
      );
    }
    return this.list(plan.id);
  }

  async listAll(payload: {
    role?: string;
    userId?: string;
    status?: string;
    taskType?: string;
    overallPlanId?: string;
    requestId?: string;
  }) {
    const where: any = {};

    if (payload.overallPlanId) where.overallPlanId = payload.overallPlanId;
    if (payload.status) where.status = payload.status;
    if (payload.taskType) where.taskType = payload.taskType;
    if (payload.role === UserRole.HR_RECRUITER && payload.userId) {
      where.assignedToId = payload.userId;
    }

    if (payload.requestId) {
      const matchingPlans = await this.prisma.overallPlan.findMany({
        where: { requestId: payload.requestId },
        select: { id: true },
      });
      where.overallPlanId = { in: matchingPlans.map((plan) => plan.id) };
    }

    const tasks = await this.prisma.taskPlan.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });

    const assignedToIds = [...new Set(tasks.map((task) => task.assignedToId))];
    const overallPlanIds = [...new Set(tasks.map((task) => task.overallPlanId))];

    const [users, plans] = await Promise.all([
      assignedToIds.length
        ? this.prisma.user.findMany({
            where: { id: { in: assignedToIds } },
            select: { id: true, displayName: true, email: true },
          })
        : [],
      overallPlanIds.length
        ? this.prisma.overallPlan.findMany({
            where: { id: { in: overallPlanIds } },
            select: {
              id: true,
              requestId: true,
              startDate: true,
              endDate: true,
              status: true,
            },
          })
        : [],
    ]);

    const requestIds = [...new Set(plans.map((plan) => plan.requestId))];
    const requests = requestIds.length
      ? await this.prisma.recruitmentRequest.findMany({
          where: { id: { in: requestIds } },
          select: {
            id: true,
            position: true,
            headcount: true,
            departmentId: true,
          },
        })
      : [];

    const departmentIds = [
      ...new Set(requests.map((request) => request.departmentId).filter(Boolean)),
    ];
    const departments = departmentIds.length
      ? await this.prisma.department.findMany({
          where: { id: { in: departmentIds } },
          select: { id: true, name: true, code: true },
        })
      : [];

    const userMap = new Map(users.map((user) => [user.id, user]));
    const planMap = new Map(plans.map((plan) => [plan.id, plan]));
    const requestMap = new Map(requests.map((request) => [request.id, request]));
    const departmentMap = new Map(departments.map((department) => [department.id, department]));

    return tasks.map((task) => {
      const plan = planMap.get(task.overallPlanId);
      const request = plan ? requestMap.get(plan.requestId) : null;
      const department = request ? departmentMap.get(request.departmentId) ?? null : null;

      return {
        ...task,
        assignedTo: userMap.get(task.assignedToId) ?? null,
        overallPlan: {
          id: plan?.id ?? task.overallPlanId,
          requestId: plan?.requestId ?? '',
          startDate: plan?.startDate ?? task.startDate,
          endDate: plan?.endDate ?? task.endDate,
          status: plan?.status ?? 'UNKNOWN',
          request: {
            id: request?.id ?? plan?.requestId ?? '',
            position: request?.position ?? 'Unknown campaign',
            headcount: request?.headcount ?? 0,
            department,
          },
        },
      };
    });
  }
}
