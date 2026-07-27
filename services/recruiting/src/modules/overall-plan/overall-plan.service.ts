import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { AuditLogService } from '@wr/database';
import {
  AuditAction,
  AuditEntityType,
  isHrRole,
  NotificationType,
  PlanStatus,
  RecruitmentRequestStatus,
  TaskStatus,
  TaskType,
} from '@wr/contracts';
import { PrismaService } from '../../common/database/prisma.service';

const DEFAULT_CAMPAIGN_TASK_TYPES = [
  TaskType.JOB_POSTING,
  TaskType.CV_COLLECTION,
  TaskType.CV_SCREENING,
  TaskType.INTERVIEW_COORDINATION,
  TaskType.HIRING,
];

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const startOfUtcDay = (value: Date) => {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const endOfUtcDay = (value: Date) => {
  const date = startOfUtcDay(value);
  date.setUTCHours(23, 59, 59, 999);
  return date;
};

const addUtcDays = (value: Date, days: number) =>
  new Date(value.getTime() + days * DAY_IN_MS);

@Injectable()
export class OverallPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
  ) {}

  private rpc(status: HttpStatus, message: string): never {
    throw new RpcException({ status, message });
  }

  private async ensureDefaultCampaignTasks(plan: {
    id: string;
    createdById: string;
    startDate: Date | null;
    endDate: Date | null;
    tasks: Array<{ taskType: string }>;
  }) {
    const existingTaskTypes = new Set(plan.tasks.map((task) => task.taskType));
    const missingTaskTypes = DEFAULT_CAMPAIGN_TASK_TYPES.filter(
      (taskType) => !existingTaskTypes.has(taskType),
    );

    if (missingTaskTypes.length === 0) return;

    await this.prisma.taskPlan.createMany({
      data: missingTaskTypes.map((taskType) => ({
        overallPlanId: plan.id,
        taskType,
        assignedToId: plan.createdById,
        startDate: null,
        endDate: null,
        status: TaskStatus.PENDING,
      })) as any,
    });
  }

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
      this.rpc(HttpStatus.BAD_REQUEST, 'startDate and endDate must be valid dates');
    }
    if (end <= start) {
      this.rpc(HttpStatus.BAD_REQUEST, 'endDate must be after startDate');
    }

    const planStart = startOfUtcDay(start);
    const planEnd = endOfUtcDay(end);
    const totalDays = Math.floor((planEnd.getTime() - planStart.getTime()) / DAY_IN_MS) + 1;
    if (totalDays < DEFAULT_CAMPAIGN_TASK_TYPES.length) {
      this.rpc(
        HttpStatus.BAD_REQUEST,
        `Plan duration must be at least ${DEFAULT_CAMPAIGN_TASK_TYPES.length} days to schedule all campaign tasks`,
      );
    }

    const baseDuration = Math.floor(totalDays / DEFAULT_CAMPAIGN_TASK_TYPES.length);
    const extraDays = totalDays % DEFAULT_CAMPAIGN_TASK_TYPES.length;
    let taskStart = planStart;
    const scheduledTasks = DEFAULT_CAMPAIGN_TASK_TYPES.map((taskType, index) => {
      const durationDays = baseDuration + (index < extraDays ? 1 : 0);
      const taskEnd = endOfUtcDay(addUtcDays(taskStart, durationDays - 1));
      const scheduledTask = {
        taskType,
        assignedToId: createdById,
        startDate: taskStart,
        endDate: taskEnd,
        status: TaskStatus.PENDING,
      };
      taskStart = startOfUtcDay(addUtcDays(taskEnd, 1));
      return scheduledTask;
    });

    const request = await this.prisma.recruitmentRequest.findUnique({
      where: { id: hiringRequestId },
    });
    if (!request) {
      this.rpc(HttpStatus.NOT_FOUND, `RecruitmentRequest ${hiringRequestId} not found`);
    }

    if (request.status !== RecruitmentRequestStatus.APPROVED) {
      this.rpc(
        HttpStatus.BAD_REQUEST,
        `Cannot create a plan for a request in status "${request.status}". Request must be APPROVED.`,
      );
    }

    const existing = await this.prisma.overallPlan.findUnique({
      where: { requestId: hiringRequestId },
    });
    if (existing) {
      this.rpc(
        HttpStatus.CONFLICT,
        `An OverallPlan already exists for RecruitmentRequest ${hiringRequestId}`,
      );
    }

    const [plan] = await this.prisma.$transaction([
      this.prisma.overallPlan.create({
        data: {
          requestId: hiringRequestId,
          createdById,
          startDate: planStart,
          endDate: planEnd,
          status: PlanStatus.DRAFT,
          tasks: {
            create: scheduledTasks as any,
          },
        },
        include: {
          createdBy: { select: { id: true, displayName: true } },
          request: { select: { id: true, position: true, status: true, createdById: true } },
          tasks: {
            include: {
              assignedTo: { select: { id: true, displayName: true, email: true, role: true } },
            },
            orderBy: { startDate: 'asc' },
          },
        },
      }),
      this.prisma.recruitmentRequest.update({
        where: { id: hiringRequestId },
        data: { status: RecruitmentRequestStatus.PLANNING },
      }),
    ]);

    this.auditLog
      .log({
        entityType: AuditEntityType.PLAN,
        entityId: plan.id,
        action: AuditAction.PLAN_CREATED,
        toStatus: PlanStatus.DRAFT,
        performedById: createdById,
        metadata: { requestId: hiringRequestId },
      })
      .catch((err) => console.error('Failed to write audit log for PLAN_CREATED:', err));

    return plan;
  }

  async submit(payload: { id: string; performedById: string }) {
    const { id, performedById } = payload;
    const plan = await this.prisma.overallPlan.findUnique({
      where: { id },
      include: {
        request: { select: { id: true, position: true, createdById: true } },
        tasks: { select: { id: true } },
      },
    });

    if (!plan) this.rpc(HttpStatus.NOT_FOUND, `OverallPlan ${id} not found`);
    if (![PlanStatus.DRAFT, PlanStatus.REJECTED].includes(plan.status as PlanStatus)) {
      this.rpc(
        HttpStatus.BAD_REQUEST,
        `Cannot submit a plan in status "${plan.status}". Plan must be DRAFT or REJECTED.`,
      );
    }
    if (plan.tasks.length === 0) {
      this.rpc(HttpStatus.BAD_REQUEST, 'At least one task is required before submitting a plan');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.overallPlan.update({
        where: { id },
        data: {
          status: PlanStatus.PENDING_APPROVAL,
          approvedById: null,
          revisionNotes: null,
        },
        include: {
          createdBy: { select: { id: true, displayName: true } },
          approvedBy: { select: { id: true, displayName: true } },
          tasks: {
            include: {
              assignedTo: { select: { id: true, displayName: true, email: true, role: true } },
            },
            orderBy: { startDate: 'asc' },
          },
        },
      }),
      this.prisma.recruitmentRequest.update({
        where: { id: plan.requestId },
        data: { status: RecruitmentRequestStatus.PLAN_PENDING_APPROVAL },
      }),
      this.prisma.requestLog.create({
        data: {
          requestId: plan.requestId,
          action: 'PLAN_SUBMITTED_FOR_APPROVAL',
          fromStatus: RecruitmentRequestStatus.PLANNING,
          toStatus: RecruitmentRequestStatus.PLAN_PENDING_APPROVAL,
          performedById,
          metadata: { planId: id },
        },
      }),
    ]);

    this.notificationClient
      .send('notification.send_to_role', {
        role: 'ADMIN',
        type: NotificationType.PLAN_UPDATE,
        title: 'Plan pending approval',
        body: `Recruitment plan for ${plan.request.position} has been submitted for approval.`,
        relatedEntityId: plan.requestId,
        relatedEntityType: 'RecruitmentRequest',
      })
      .subscribe({
        error: (err) => console.error('Failed to notify Admin about plan submission:', err),
      });

    this.notificationClient
      .send('notification.create_notification', {
        userId: plan.request.createdById,
        type: NotificationType.REQUEST_UPDATE,
        title: 'Request status update: Plan Pending Approval',
        body: `Recruitment request for ${plan.request.position} has transitioned to Plan Pending Approval.`,
        relatedEntityId: plan.requestId,
        relatedEntityType: 'RecruitmentRequest',
      })
      .subscribe({
        error: (err) => console.error('Failed to send dept head planning notification:', err),
      });

    this.auditLog
      .log({
        entityType: AuditEntityType.PLAN,
        entityId: id,
        action: AuditAction.PLAN_RESUBMITTED,
        fromStatus: plan.status,
        toStatus: PlanStatus.PENDING_APPROVAL,
        performedById,
        metadata: { requestId: plan.requestId },
      })
      .catch((err) => console.error('Failed to write audit log for PLAN_SUBMITTED:', err));

    return updated;
  }

  /**
   * T-107: Approve a plan pending approval (PENDING_APPROVAL -> APPROVED).
   */
  async approve(payload: { id: string; approvedById: string }) {
    const { id, approvedById } = payload;

    const plan = await this.prisma.overallPlan.findUnique({ where: { id } });
    if (!plan) this.rpc(HttpStatus.NOT_FOUND, `OverallPlan ${id} not found`);
    if (plan.status !== PlanStatus.PENDING_APPROVAL) {
      this.rpc(
        HttpStatus.BAD_REQUEST,
        `Cannot approve a plan in status "${plan.status}". Plan must be PENDING_APPROVAL.`,
      );
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.overallPlan.update({
        where: { id },
        data: { status: PlanStatus.APPROVED, approvedById },
      }),
      this.prisma.recruitmentRequest.update({
        where: { id: plan.requestId },
        data: { status: RecruitmentRequestStatus.PLAN_APPROVED },
      }),
      this.prisma.requestLog.create({
        data: {
          requestId: plan.requestId,
          action: 'PLAN_APPROVED',
          fromStatus: RecruitmentRequestStatus.PLAN_PENDING_APPROVAL,
          toStatus: RecruitmentRequestStatus.PLAN_APPROVED,
          performedById: approvedById,
          metadata: { planId: id },
        },
      }),
    ]);

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
    if (!plan) this.rpc(HttpStatus.NOT_FOUND, `OverallPlan ${id} not found`);
    if (plan.status !== PlanStatus.PENDING_APPROVAL) {
      this.rpc(
        HttpStatus.BAD_REQUEST,
        `Cannot reject a plan in status "${plan.status}". Plan must be PENDING_APPROVAL.`,
      );
    }
    if (!revisionNotes?.trim()) {
      this.rpc(HttpStatus.BAD_REQUEST, 'revisionNotes are required when rejecting a plan');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.overallPlan.update({
        where: { id },
        data: { status: PlanStatus.REJECTED, approvedById, revisionNotes: revisionNotes.trim() },
      }),
      this.prisma.recruitmentRequest.update({
        where: { id: plan.requestId },
        data: { status: RecruitmentRequestStatus.PLANNING },
      }),
      this.prisma.requestLog.create({
        data: {
          requestId: plan.requestId,
          action: 'PLAN_REJECTED',
          fromStatus: RecruitmentRequestStatus.PLAN_PENDING_APPROVAL,
          toStatus: RecruitmentRequestStatus.PLANNING,
          performedById: approvedById,
          metadata: { planId: id, revisionNotes: revisionNotes.trim() },
        },
      }),
    ]);

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

  /**
   * Phase 2a: Resubmit a rejected plan for approval (REJECTED -> PENDING_APPROVAL).
   */
  async resubmit(payload: {
    id: string;
    performedById: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { id, performedById, startDate, endDate } = payload;

    const plan = await this.prisma.overallPlan.findUnique({ where: { id } });
    if (!plan) this.rpc(HttpStatus.NOT_FOUND, `OverallPlan ${id} not found`);
    if (plan.status !== PlanStatus.REJECTED) {
      this.rpc(
        HttpStatus.BAD_REQUEST,
        `Cannot resubmit a plan in status "${plan.status}". Plan must be REJECTED.`,
      );
    }

    const data: {
      status: PlanStatus;
      approvedById: null;
      revisionNotes: null;
      startDate?: Date;
      endDate?: Date;
    } = {
      status: PlanStatus.PENDING_APPROVAL,
      approvedById: null,
      revisionNotes: null,
    };

    if (startDate !== undefined || endDate !== undefined) {
      const start = startDate ? new Date(startDate) : plan.startDate;
      const end = endDate ? new Date(endDate) : plan.endDate;
      if (!start || !end) {
        this.rpc(HttpStatus.BAD_REQUEST, 'startDate and endDate are required');
      }
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        this.rpc(HttpStatus.BAD_REQUEST, 'startDate and endDate must be valid dates');
      }
      if (end <= start) {
        this.rpc(HttpStatus.BAD_REQUEST, 'endDate must be after startDate');
      }
      data.startDate = start;
      data.endDate = end;
    }

    const updated = await this.prisma.overallPlan.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { id: true, displayName: true } },
        approvedBy: { select: { id: true, displayName: true } },
        tasks: {
          include: {
            assignedTo: { select: { id: true, displayName: true, email: true, role: true } },
          },
          orderBy: { startDate: 'asc' },
        },
      },
    });

    this.auditLog
      .log({
        entityType: AuditEntityType.PLAN,
        entityId: id,
        action: AuditAction.PLAN_RESUBMITTED,
        fromStatus: PlanStatus.REJECTED,
        toStatus: PlanStatus.PENDING_APPROVAL,
        performedById,
        metadata: { previousRevisionNotes: plan.revisionNotes },
      })
      .catch((err) => console.error('Failed to write audit log for PLAN_RESUBMITTED:', err));

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
          include: {
            assignedTo: { select: { id: true, displayName: true, email: true, role: true } },
          },
          orderBy: { startDate: 'asc' },
        },
      },
    });
    if (!plan) this.rpc(HttpStatus.NOT_FOUND, `OverallPlan ${id} not found`);
    return plan;
  }

  async getByRequest(payload: { hiringRequestId: string; userId?: string; role?: string }) {
    let plan = await this.prisma.overallPlan.findUnique({
      where: { requestId: payload.hiringRequestId },
      include: {
        createdBy: { select: { id: true, displayName: true } },
        approvedBy: { select: { id: true, displayName: true } },
        tasks: {
          include: {
            assignedTo: { select: { id: true, displayName: true, email: true, role: true } },
          },
          orderBy: { startDate: 'asc' },
        },
      },
    });
    if (!plan)
      this.rpc(
        HttpStatus.NOT_FOUND,
        `No OverallPlan found for RecruitmentRequest ${payload.hiringRequestId}`,
      );
    await this.ensureDefaultCampaignTasks(plan);
    plan = await this.prisma.overallPlan.findUnique({
      where: { requestId: payload.hiringRequestId },
      include: {
        createdBy: { select: { id: true, displayName: true } },
        approvedBy: { select: { id: true, displayName: true } },
        tasks: {
          include: {
            assignedTo: { select: { id: true, displayName: true, email: true, role: true } },
          },
          orderBy: { startDate: 'asc' },
        },
      },
    });
    if (!plan)
      this.rpc(
        HttpStatus.NOT_FOUND,
        `No OverallPlan found for RecruitmentRequest ${payload.hiringRequestId}`,
      );
    return plan;
  }

  async startCampaign(payload: { id: string; performedById: string }) {
    const { id, performedById } = payload;
    const plan = await this.prisma.overallPlan.findUnique({
      where: { id },
      include: {
        request: { select: { id: true, position: true, status: true } },
        tasks: {
          include: {
            assignedTo: {
              select: { id: true, displayName: true, email: true, role: true, isActive: true },
            },
          },
          orderBy: { startDate: 'asc' },
        },
      },
    });

    if (!plan) this.rpc(HttpStatus.NOT_FOUND, `OverallPlan ${id} not found`);
    if (plan.status !== PlanStatus.APPROVED) {
      this.rpc(HttpStatus.BAD_REQUEST, 'Only approved plans can be started');
    }
    if (plan.request.status !== RecruitmentRequestStatus.PLAN_APPROVED) {
      this.rpc(
        HttpStatus.PRECONDITION_FAILED,
        `Campaign can only start when its request is PLAN_APPROVED. Current status: ${plan.request.status}`,
      );
    }
    if (plan.tasks.length === 0) {
      this.rpc(HttpStatus.PRECONDITION_FAILED, 'Campaign must have at least one task before starting');
    }

    const invalidTask = plan.tasks.find(
      (task) =>
        !task.assignedTo ||
        !isHrRole(task.assignedTo.role) ||
        !task.assignedTo.isActive ||
        !task.startDate ||
        !task.endDate,
    );
    if (invalidTask) {
      this.rpc(
        HttpStatus.BAD_REQUEST,
        'Every task must be assigned to an active HR member with start date and deadline before starting the campaign',
      );
    }

    const [startedRequest, log] = await this.prisma.$transaction([
      this.prisma.recruitmentRequest.update({
        where: { id: plan.requestId },
        data: { status: RecruitmentRequestStatus.ACTIVE },
      }),
      this.prisma.requestLog.create({
        data: {
          requestId: plan.requestId,
          action: 'CAMPAIGN_STARTED',
          fromStatus: RecruitmentRequestStatus.PLAN_APPROVED,
          toStatus: RecruitmentRequestStatus.ACTIVE,
          performedById,
          metadata: { planId: id },
        },
      }),
    ]);

    if (startedRequest.status !== RecruitmentRequestStatus.ACTIVE) {
      this.rpc(HttpStatus.INTERNAL_SERVER_ERROR, 'Campaign activation did not update the request status');
    }

    for (const task of plan.tasks) {
      const dueDate = task.endDate!.toLocaleDateString('en-US', { dateStyle: 'long' });
      this.notificationClient
        .send('notification.send_email', {
          userId: task.assignedTo.id,
          toEmail: task.assignedTo.email,
          subject: `[Works Recruiter] Campaign Task: ${plan.request.position}`,
          body: [
            `Dear ${task.assignedTo.displayName},`,
            '',
            `You have been assigned to the recruitment campaign for ${plan.request.position}.`,
            '',
            `Task: ${task.taskType}`,
            `Due date: ${dueDate}`,
            '',
            'Please log in to the recruitment portal and begin execution.',
            '',
            'Best regards,',
            'HR Management System',
          ].join('\n'),
        })
        .subscribe({
          error: (err) => console.error('Failed to send campaign task email:', err),
        });

      this.notificationClient
        .send('notification.create_notification', {
          userId: task.assignedTo.id,
          type: NotificationType.PLAN_UPDATE,
          title: 'Campaign task assigned',
          body: `${plan.request.position}: ${task.taskType} is due on ${dueDate}.`,
          relatedEntityId: plan.requestId,
          relatedEntityType: 'RecruitmentRequest',
        })
        .subscribe({
          error: (err) => console.error('Failed to send campaign task notification:', err),
        });
    }

    return {
      success: true,
      requestId: plan.requestId,
      requestStatus: startedRequest.status,
      planStatus: plan.status,
      logId: log.id,
      notifiedRecruiters: plan.tasks.length,
    };
  }
}
