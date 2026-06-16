import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuditLogService } from '@wr/database';
import { AuditAction, AuditEntityType, TaskStatus, TaskType, UserRole } from '@wr/contracts';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class TaskPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
  ) {}

  /**
   * T-107: Create (assign) a task within an OverallPlan.
   */
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
      throw new BadRequestException(
        `taskType must be one of: ${Object.values(TaskType).join(', ')}`,
      );
    }

    const plan = await this.prisma.overallPlan.findUnique({ where: { id: overallPlanId } });
    if (!plan) throw new NotFoundException(`OverallPlan ${overallPlanId} not found`);

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('startDate and endDate must be valid dates');
    }
    if (end <= start) {
      throw new BadRequestException('endDate must be after startDate');
    }

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

    if (task.assignedTo?.email) {
      const formattedStartDate = start.toLocaleDateString('en-US', {
        dateStyle: 'long',
      });
      const formattedEndDate = end.toLocaleDateString('en-US', {
        dateStyle: 'long',
      });

      const emailBody = [
        `Dear ${task.assignedTo.displayName},`,
        '',
        `You have been assigned a new task: ${taskType}.`,
        '',
        `Details:`,
        `- Start Date: ${formattedStartDate}`,
        `- Deadline (End Date): ${formattedEndDate}`,
        '',
        `Please log in to the recruitment portal to view more details.`,
        '',
        `Best regards,`,
        `HR Management System`,
      ].join('\n');

      this.notificationClient
        .send('notification.send_email', {
          userId: task.assignedToId,
          toEmail: task.assignedTo.email,
          subject: `[Works Recruiter] New Task Assigned: ${taskType}`,
          body: emailBody,
        })
        .subscribe({
          error: (err) => console.error('Failed to send task assignment email:', err),
        });
    }

    return task;
  }

  /**
   * T-107: Update a task's status (PENDING -> IN_PROGRESS -> COMPLETED).
   */
  async updateStatus(payload: { id: string; status: string; performedById: string }) {
    const { id, status, performedById } = payload;

    if (!Object.values(TaskStatus).includes(status as TaskStatus)) {
      throw new BadRequestException(
        `status must be one of: ${Object.values(TaskStatus).join(', ')}`,
      );
    }

    const task = await this.prisma.taskPlan.findUnique({ where: { id } });
    if (!task) throw new NotFoundException(`TaskPlan ${id} not found`);

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
    if (!plan) throw new NotFoundException(`OverallPlan ${overallPlanId} not found`);

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
      throw new NotFoundException(`No OverallPlan found for RecruitmentRequest ${hiringRequestId}`);
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
    if (payload.requestId) where.overallPlan = { requestId: payload.requestId };
    if (payload.role === UserRole.HR_RECRUITER && payload.userId) {
      where.assignedToId = payload.userId;
    }

    return this.prisma.taskPlan.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, displayName: true, email: true } },
        overallPlan: {
          select: {
            id: true,
            requestId: true,
            startDate: true,
            endDate: true,
            status: true,
            request: {
              select: {
                id: true,
                position: true,
                headcount: true,
                department: { select: { id: true, name: true, code: true } },
              },
            },
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }
}
