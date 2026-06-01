import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class TaskPlanService {
  private readonly logger = new Logger(TaskPlanService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Create ───────────────────────────────────────────────────────

  async create(payload: {
    overallPlanId: string;
    taskType: string;
    assignedToId: string;
    startDate: string;
    endDate: string; // deadline
    notes?: string;
  }) {
    const { overallPlanId, taskType, assignedToId, startDate, endDate, notes } = payload;

    // Parse and validate task dates
    const taskStart = new Date(startDate);
    const taskEnd = new Date(endDate);
    if (isNaN(taskStart.getTime()) || isNaN(taskEnd.getTime())) {
      throw new BadRequestException('startDate and endDate must be valid dates');
    }
    if (taskEnd <= taskStart) {
      throw new BadRequestException('endDate (deadline) must be after startDate');
    }

    // Load overall plan — must exist
    const plan = await this.prisma.overallPlan.findUnique({
      where: { id: overallPlanId },
    });
    if (!plan) {
      throw new NotFoundException(`OverallPlan ${overallPlanId} not found`);
    }

    // Validate task timeline is within the overall plan window
    const planStart = new Date(plan.startDate);
    const planEnd = new Date(plan.endDate);
    if (taskStart < planStart) {
      throw new BadRequestException(
        `Task startDate (${startDate}) must not be before the plan startDate (${plan.startDate.toISOString().slice(0, 10)})`,
      );
    }
    if (taskEnd > planEnd) {
      throw new BadRequestException(
        `Task endDate/deadline (${endDate}) must not exceed the plan endDate (${plan.endDate.toISOString().slice(0, 10)})`,
      );
    }

    // Load the assignee to confirm they exist (and for notification)
    const assignee = await this.prisma.user.findUnique({
      where: { id: assignedToId },
      select: { id: true, displayName: true, email: true },
    });
    if (!assignee) {
      throw new NotFoundException(`User ${assignedToId} not found`);
    }

    const task = await this.prisma.taskPlan.create({
      data: {
        overallPlanId,
        taskType,
        assignedToId,
        startDate: taskStart,
        endDate: taskEnd,
        status: 'PENDING',
        notes,
      },
      include: {
        assignedTo: { select: { id: true, displayName: true, email: true } },
        overallPlan: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            hiringRequest: { select: { id: true, title: true } },
          },
        },
      },
    });

    // Notify assignee — placeholder for notification service dispatch
    this.logger.log(
      `[NOTIFY] Task "${taskType}" assigned to ${assignee.displayName} (${assignee.email}). ` +
      `Deadline: ${endDate}. OverallPlan: ${overallPlanId}.`,
    );

    return task;
  }

  // ─── List ─────────────────────────────────────────────────────────

  async list(overallPlanId: string) {
    const plan = await this.prisma.overallPlan.findUnique({ where: { id: overallPlanId } });
    if (!plan) throw new NotFoundException(`OverallPlan ${overallPlanId} not found`);

    return this.prisma.taskPlan.findMany({
      where: { overallPlanId },
      include: { assignedTo: { select: { id: true, displayName: true } } },
      orderBy: { startDate: 'asc' },
    });
  }

  // ─── Get ──────────────────────────────────────────────────────────

  async get(id: string) {
    const task = await this.prisma.taskPlan.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, displayName: true, email: true } },
        overallPlan: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            hiringRequest: { select: { id: true, title: true } },
          },
        },
      },
    });
    if (!task) throw new NotFoundException(`TaskPlan ${id} not found`);
    return task;
  }

  // ─── Update ───────────────────────────────────────────────────────

  async update(
    id: string,
    data: {
      taskType?: string;
      assignedToId?: string;
      startDate?: string;
      endDate?: string;
      notes?: string;
    },
  ) {
    const existing = await this.prisma.taskPlan.findUnique({
      where: { id },
      include: { overallPlan: true },
    });
    if (!existing) throw new NotFoundException(`TaskPlan ${id} not found`);
    if (existing.status === 'COMPLETED') {
      throw new BadRequestException('Cannot update a COMPLETED task');
    }

    // Validate updated dates stay within plan window if either date is being changed
    const newStart = data.startDate ? new Date(data.startDate) : existing.startDate;
    const newEnd = data.endDate ? new Date(data.endDate) : existing.endDate;

    if (newEnd <= newStart) {
      throw new BadRequestException('endDate (deadline) must be after startDate');
    }
    const planStart = new Date(existing.overallPlan.startDate);
    const planEnd = new Date(existing.overallPlan.endDate);
    if (newStart < planStart || newEnd > planEnd) {
      throw new BadRequestException('Task dates must remain within the Overall Plan timeline');
    }

    // If assignee changes, verify new user exists
    if (data.assignedToId && data.assignedToId !== existing.assignedToId) {
      const user = await this.prisma.user.findUnique({ where: { id: data.assignedToId } });
      if (!user) throw new NotFoundException(`User ${data.assignedToId} not found`);

      this.logger.log(
        `[NOTIFY] Task "${existing.taskType}" reassigned to ${user.displayName} (${user.email}). TaskPlan: ${id}.`,
      );
    }

    return this.prisma.taskPlan.update({
      where: { id },
      data: {
        ...(data.taskType !== undefined && { taskType: data.taskType }),
        ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
        ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: { assignedTo: { select: { id: true, displayName: true } } },
    });
  }

  // ─── Create by Request ────────────────────────────────────────────
  // Convenience: resolve overallPlanId from hiringRequestId, then delegate to create()

  async createByRequest(payload: {
    hiringRequestId: string;
    taskType: string;
    assignedToId: string;
    startDate: string;
    endDate: string;
    notes?: string;
  }) {
    const plan = await this.prisma.overallPlan.findUnique({
      where: { hiringRequestId: payload.hiringRequestId },
    });
    if (!plan) {
      throw new NotFoundException(
        `No OverallPlan found for HiringRequest ${payload.hiringRequestId}. Create an OverallPlan first.`,
      );
    }
    const { hiringRequestId: _ignored, ...rest } = payload;
    return this.create({ overallPlanId: plan.id, ...rest });
  }

  // ─── List by Request ──────────────────────────────────────────────

  async listByRequest(hiringRequestId: string) {
    const plan = await this.prisma.overallPlan.findUnique({
      where: { hiringRequestId },
    });
    if (!plan) {
      throw new NotFoundException(`No OverallPlan found for HiringRequest ${hiringRequestId}`);
    }
    return this.list(plan.id);
  }

  // ─── Update Status ────────────────────────────────────────────────

  async updateStatus(id: string, status: string) {
    const VALID = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
    if (!VALID.includes(status)) {
      throw new BadRequestException(`Invalid status "${status}". Must be one of: ${VALID.join(', ')}`);
    }

    const existing = await this.prisma.taskPlan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`TaskPlan ${id} not found`);

    return this.prisma.taskPlan.update({
      where: { id },
      data: { status },
      include: { assignedTo: { select: { id: true, displayName: true } } },
    });
  }
}
