import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import {
  CreateHiringRequestSchema,
  CreateHiringRequestInput,
  UpdateHiringRequestSchema,
} from '@wr/contracts';
import { HiringRequestStatus, UserRole } from '@wr/contracts';
import { NotificationsService } from '../../common/notifications/notifications.service';

@Injectable()
export class HiringRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // T-020: Create recruitment request — initial status DRAFT
  async create(dto: CreateHiringRequestInput & { requestedById: string; organizationId: string }) {
    const parsed = CreateHiringRequestSchema.parse(dto);

    return this.prisma.hiringRequest.create({
      data: {
        organizationId: dto.organizationId,
        departmentId: parsed.departmentId,
        requestedById: dto.requestedById,
        title: parsed.title,
        description: parsed.description,
        justification: parsed.justification,
        headcount: parsed.headcount,
        priority: parsed.priority,
        workMode: parsed.workMode,
        location: parsed.location,
        budgetRange: parsed.budgetRange as any,
        targetStartDate: parsed.targetStartDate ? new Date(parsed.targetStartDate) : null,
        status: HiringRequestStatus.DRAFT,
      },
    });
  }

  // T-021: Update DRAFT request — only DRAFT status allowed
  async update(id: string, dto: Partial<CreateHiringRequestInput>, actorId: string) {
    const request = await this.findOrFail(id);

    if (request.status !== HiringRequestStatus.DRAFT) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Only DRAFT requests can be edited. Current status: ${request.status}`,
      });
    }

    const parsed = UpdateHiringRequestSchema.parse(dto);

    return this.prisma.hiringRequest.update({
      where: { id },
      data: {
        ...(parsed.title && { title: parsed.title }),
        ...(parsed.description !== undefined && { description: parsed.description }),
        ...(parsed.justification !== undefined && { justification: parsed.justification }),
        ...(parsed.headcount && { headcount: parsed.headcount }),
        ...(parsed.priority && { priority: parsed.priority }),
        ...(parsed.workMode !== undefined && { workMode: parsed.workMode }),
        ...(parsed.location !== undefined && { location: parsed.location }),
        ...(parsed.budgetRange !== undefined && { budgetRange: parsed.budgetRange as any }),
        ...(parsed.targetStartDate !== undefined && {
          targetStartDate: parsed.targetStartDate ? new Date(parsed.targetStartDate) : null,
        }),
      },
    });
  }

  // T-022: Submit DRAFT → PENDING_APPROVAL; log transition; notify HR Managers (FR-02)
  async submit(id: string, actorId: string) {
    const request = await this.findOrFail(id);

    if (request.status !== HiringRequestStatus.DRAFT) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Only DRAFT requests can be submitted. Current status: ${request.status}`,
      });
    }

    if (!request.title || !request.description || !request.justification) {
      throw new RpcException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'Request must have title, description, and justification before submitting',
      });
    }

    const updated = await this.prisma.hiringRequest.update({
      where: { id },
      data: { status: HiringRequestStatus.PENDING_APPROVAL, submittedAt: new Date() },
    });

    await this.logTransition(id, actorId, 'SUBMIT', HiringRequestStatus.DRAFT, HiringRequestStatus.PENDING_APPROVAL);

    // FR-02: Notify HR Managers in the same organization of the new request
    await this.notifications.notifyByRole(
      UserRole.HIRING_MANAGER,
      request.organizationId,
      'REQUEST_SUBMITTED',
      `New recruitment request: ${request.title}`,
      `A Department Head has submitted a recruitment request for "${request.title}" requiring ${request.headcount} headcount. Please review.`,
      id,
      'HIRING_REQUEST',
    );

    return updated;
  }

  // T-023: Approve PENDING_APPROVAL → APPROVED; create ApprovalRecord; notify DH + HR (FR-03)
  async approve(id: string, actorId: string, comments?: string) {
    const request = await this.findOrFail(id);

    if (request.status !== HiringRequestStatus.PENDING_APPROVAL) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Only PENDING_APPROVAL requests can be approved. Current status: ${request.status}`,
      });
    }

    if (request.requestedById === actorId) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'Self-approval is not allowed: the request author cannot approve their own request',
      });
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.hiringRequest.update({
        where: { id },
        data: { status: HiringRequestStatus.APPROVED, approvedAt: new Date() },
      }),
      this.prisma.hiringRequestApproval.create({
        data: {
          hiringRequestId: id,
          approverUserId: actorId,
          level: request.currentLevel + 1,
          decision: 'APPROVED',
          comments: comments ?? null,
          decidedAt: new Date(),
        },
      }),
    ]);

    await this.logTransition(id, actorId, 'APPROVE', HiringRequestStatus.PENDING_APPROVAL, HiringRequestStatus.APPROVED, comments);

    // FR-03: Notify the Department Head who submitted the request
    await this.notifications.notify(
      request.requestedById,
      'REQUEST_APPROVED',
      `Your request "${request.title}" has been approved`,
      `Admin has approved your recruitment request for "${request.title}". HR Manager will now create a recruitment plan.${comments ? ` Comment: ${comments}` : ''}`,
      id,
      'HIRING_REQUEST',
    );

    // FR-03: Also notify HR Managers to proceed with planning
    await this.notifications.notifyByRole(
      UserRole.HIRING_MANAGER,
      request.organizationId,
      'REQUEST_APPROVED',
      `Recruitment request approved: ${request.title}`,
      `The request for "${request.title}" has been approved. Please create an overall plan to begin recruitment.`,
      id,
      'HIRING_REQUEST',
    );

    return updated;
  }

  // T-024: Reject with mandatory reason; create ApprovalRecord; notify DH (FR-03)
  async reject(id: string, actorId: string, reason: string) {
    if (!reason || reason.trim().length === 0) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Rejection reason is mandatory and cannot be empty',
      });
    }

    const request = await this.findOrFail(id);

    if (request.status !== HiringRequestStatus.PENDING_APPROVAL) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Only PENDING_APPROVAL requests can be rejected. Current status: ${request.status}`,
      });
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.hiringRequest.update({
        where: { id },
        data: {
          status: HiringRequestStatus.REJECTED,
          rejectedAt: new Date(),
          rejectionReason: reason,
        },
      }),
      this.prisma.hiringRequestApproval.create({
        data: {
          hiringRequestId: id,
          approverUserId: actorId,
          level: request.currentLevel + 1,
          decision: 'REJECTED',
          comments: reason,
          decidedAt: new Date(),
        },
      }),
    ]);

    await this.logTransition(id, actorId, 'REJECT', HiringRequestStatus.PENDING_APPROVAL, HiringRequestStatus.REJECTED, reason);

    // FR-03: Notify the Department Head with the rejection reason (visible per FR)
    await this.notifications.notify(
      request.requestedById,
      'REQUEST_REJECTED',
      `Your request "${request.title}" has been rejected`,
      `Admin has rejected your recruitment request for "${request.title}". Reason: ${reason}`,
      id,
      'HIRING_REQUEST',
    );

    return updated;
  }

  // T-025: Request revision — PENDING_APPROVAL → REVISION_REQUESTED; feedback stored + visible to DH (FR-03)
  async requestRevision(id: string, actorId: string, feedback: string) {
    if (!feedback || feedback.trim().length === 0) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Revision feedback is mandatory and cannot be empty',
      });
    }

    const request = await this.findOrFail(id);

    if (request.status !== HiringRequestStatus.PENDING_APPROVAL) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Only PENDING_APPROVAL requests can be sent for revision. Current status: ${request.status}`,
      });
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.hiringRequest.update({
        where: { id },
        data: { status: HiringRequestStatus.REVISION_REQUESTED, revisionNotes: feedback },
      }),
      this.prisma.hiringRequestApproval.create({
        data: {
          hiringRequestId: id,
          approverUserId: actorId,
          level: request.currentLevel + 1,
          decision: 'REVISION_REQUESTED',
          comments: feedback,
          decidedAt: new Date(),
        },
      }),
    ]);

    await this.logTransition(id, actorId, 'REVISION_REQUESTED', HiringRequestStatus.PENDING_APPROVAL, HiringRequestStatus.REVISION_REQUESTED, feedback);

    // FR-03: Notify the Department Head with the revision feedback (visible per FR)
    await this.notifications.notify(
      request.requestedById,
      'REVISION_REQUESTED',
      `Revision needed for your request "${request.title}"`,
      `Admin requires revisions to your recruitment request for "${request.title}". Feedback: ${feedback}`,
      id,
      'HIRING_REQUEST',
    );

    return updated;
  }

  // T-026: List requests — role-filtered (DEPT_HEAD sees own dept, HIRING_MANAGER sees all active, ADMIN sees all)
  async list(query: {
    actorId: string;
    actorRole: string;
    departmentId?: string;
    organizationId?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (query.actorRole === UserRole.DEPARTMENT_HEAD) {
      const deptHead = await this.prisma.department.findFirst({
        where: { headUserId: query.actorId },
      });
      where.departmentId = deptHead?.id ?? '__no_dept__';
    } else if (query.actorRole === UserRole.HIRING_MANAGER) {
      where.status = { notIn: [HiringRequestStatus.DRAFT] };
      if (query.organizationId) where.organizationId = query.organizationId;
    } else if (query.actorRole === UserRole.ADMIN) {
      if (query.organizationId) where.organizationId = query.organizationId;
    }

    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      this.prisma.hiringRequest.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          department: { select: { id: true, name: true, code: true } },
          requestedBy: { select: { id: true, displayName: true, email: true } },
          _count: { select: { approvals: true } },
        },
      }),
      this.prisma.hiringRequest.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async get(id: string) {
    const request = await this.prisma.hiringRequest.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true, code: true } },
        requestedBy: { select: { id: true, displayName: true, email: true } },
        approvals: {
          include: { approverUser: { select: { id: true, displayName: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
        logs: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!request) {
      throw new RpcException({ status: HttpStatus.NOT_FOUND, message: 'Hiring request not found' });
    }
    return request;
  }

  // T-027: Automatic status transition logging
  private async logTransition(
    hiringRequestId: string,
    actorId: string,
    action: string,
    previousStatus: string,
    newStatus: string,
    notes?: string,
  ) {
    await this.prisma.hiringRequestLog.create({
      data: { hiringRequestId, actorId, action, previousStatus, newStatus, notes: notes ?? null },
    });
  }

  private async findOrFail(id: string) {
    const request = await this.prisma.hiringRequest.findUnique({ where: { id } });
    if (!request) {
      throw new RpcException({ status: HttpStatus.NOT_FOUND, message: 'Hiring request not found' });
    }
    return request;
  }
}
