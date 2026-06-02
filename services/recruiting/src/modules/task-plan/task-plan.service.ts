import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import { TaskPlanType, TaskPlanStatus } from '@wr/contracts';
import { NotificationsService } from '../../common/notifications/notifications.service';

@Injectable()
export class TaskPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // T-031: Create task within Overall Plan timeline; validate deadline within plan window; notify assignee (FR-05)
  async createByRequest(dto: {
    hiringRequestId: string;
    taskType: string;
    assignedToId: string;
    startDate: string;
    endDate: string;
    notes?: string;
  }) {
    const plan = await this.prisma.overallPlan.findUnique({
      where: { hiringRequestId: dto.hiringRequestId },
      include: { hiringRequest: { select: { title: true } } },
    });
    if (!plan) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: 'No overall plan found for this recruitment request. Create a plan first.',
      });
    }

    const taskStart = new Date(dto.startDate);
    const taskEnd = new Date(dto.endDate);

    if (taskEnd <= taskStart) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Task endDate must be after startDate',
      });
    }
    if (taskStart < plan.startDate || taskEnd > plan.endDate) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Task dates must fall within the Overall Plan window (${plan.startDate.toISOString()} — ${plan.endDate.toISOString()})`,
      });
    }

    const validTaskTypes = Object.values(TaskPlanType) as string[];
    if (!validTaskTypes.includes(dto.taskType)) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Invalid taskType. Must be one of: ${validTaskTypes.join(', ')}`,
      });
    }

    const task = await this.prisma.taskPlan.create({
      data: {
        overallPlanId: plan.id,
        taskType: dto.taskType,
        assignedToId: dto.assignedToId,
        startDate: taskStart,
        endDate: taskEnd,
        notes: dto.notes ?? null,
        status: TaskPlanStatus.PENDING,
      },
    });

    // FR-05: Notify the assignee of their new task responsibility
    await this.notifications.notify(
      dto.assignedToId,
      'TASK_ASSIGNED',
      `You have been assigned a ${dto.taskType.replace('_', ' ')} task`,
      `You have been assigned the "${dto.taskType}" task for recruitment of "${plan.hiringRequest.title}". Deadline: ${taskEnd.toDateString()}.${dto.notes ? ` Notes: ${dto.notes}` : ''}`,
      task.id,
      'TASK_PLAN',
    );

    return task;
  }

  // T-032: List all tasks for a plan with assignee, deadline, completion status
  async listByRequest(hiringRequestId: string) {
    const plan = await this.prisma.overallPlan.findUnique({
      where: { hiringRequestId },
    });
    if (!plan) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: 'No overall plan found for this recruitment request',
      });
    }

    return this.prisma.taskPlan.findMany({
      where: { overallPlanId: plan.id },
      orderBy: { startDate: 'asc' },
    });
  }

  // T-032: Get single task plan
  async get(id: string) {
    const task = await this.prisma.taskPlan.findUnique({ where: { id } });
    if (!task) {
      throw new RpcException({ status: HttpStatus.NOT_FOUND, message: 'Task plan not found' });
    }
    return task;
  }

  async update(id: string, dto: {
    taskType?: string;
    assignedToId?: string;
    startDate?: string;
    endDate?: string;
    notes?: string;
  }) {
    const task = await this.get(id);
    const plan = await this.prisma.overallPlan.findUnique({ where: { id: task.overallPlanId } });
    if (!plan) {
      throw new RpcException({ status: HttpStatus.NOT_FOUND, message: 'Parent plan not found' });
    }

    const newStart = dto.startDate ? new Date(dto.startDate) : task.startDate;
    const newEnd = dto.endDate ? new Date(dto.endDate) : task.endDate;

    if (newEnd <= newStart) {
      throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: 'Task endDate must be after startDate' });
    }
    if (newStart < plan.startDate || newEnd > plan.endDate) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Task dates must fall within the Overall Plan window',
      });
    }

    const updated = await this.prisma.taskPlan.update({
      where: { id },
      data: {
        ...(dto.taskType && { taskType: dto.taskType }),
        ...(dto.assignedToId && { assignedToId: dto.assignedToId }),
        ...(dto.startDate && { startDate: newStart }),
        ...(dto.endDate && { endDate: newEnd }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    // Notify new assignee if the assignment changed
    if (dto.assignedToId && dto.assignedToId !== task.assignedToId) {
      await this.notifications.notify(
        dto.assignedToId,
        'TASK_ASSIGNED',
        `You have been assigned a ${updated.taskType.replace('_', ' ')} task`,
        `You have been reassigned the "${updated.taskType}" task. Deadline: ${newEnd.toDateString()}.`,
        id,
        'TASK_PLAN',
      );
    }

    return updated;
  }

  async updateStatus(id: string, status: string) {
    const validStatuses = Object.values(TaskPlanStatus) as string[];
    if (!validStatuses.includes(status)) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }
    await this.get(id);
    return this.prisma.taskPlan.update({ where: { id }, data: { status } });
  }
}
