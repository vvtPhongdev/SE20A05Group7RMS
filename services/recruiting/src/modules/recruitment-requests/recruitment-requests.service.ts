import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class RecruitmentRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: {
    requestedById: string;
    organizationId: string;
    departmentId: string;
    title: string;
    description?: string;
    justification?: string;
    headcount?: number;
    priority?: string;
    workMode?: string;
    location?: string;
    budgetRange?: { min: number; max: number; currency: string };
    targetStartDate?: string;
  }) {
    return this.prisma.hiringRequest.create({
      data: {
        requestedById: payload.requestedById,
        organizationId: payload.organizationId,
        departmentId: payload.departmentId,
        title: payload.title,
        description: payload.description,
        justification: payload.justification,
        headcount: payload.headcount ?? 1,
        priority: payload.priority ?? 'NORMAL',
        workMode: payload.workMode,
        location: payload.location,
        budgetRange: payload.budgetRange ?? undefined,
        targetStartDate: payload.targetStartDate ? new Date(payload.targetStartDate) : undefined,
        status: 'DRAFT',
        currentLevel: 0,
      },
      include: {
        department: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, displayName: true, email: true } },
      },
    });
  }

  async list(filters: {
    organizationId?: string;
    departmentId?: string;
    requestedById?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, filters.pageSize ?? 20);
    const where: Record<string, unknown> = {};
    if (filters.organizationId) where.organizationId = filters.organizationId;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.requestedById) where.requestedById = filters.requestedById;
    if (filters.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      this.prisma.hiringRequest.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
          requestedBy: { select: { id: true, displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.hiringRequest.count({ where }),
    ]);

    return { data, meta: { pagination: { page, pageSize, total } } };
  }

  async get(id: string) {
    const request = await this.prisma.hiringRequest.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, displayName: true, email: true } },
        approvals: {
          include: { approverUser: { select: { id: true, displayName: true } } },
          orderBy: { level: 'asc' },
        },
      },
    });
    if (!request) throw new NotFoundException(`HiringRequest ${id} not found`);
    return request;
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      justification?: string;
      headcount?: number;
      priority?: string;
      workMode?: string;
      location?: string;
      budgetRange?: { min: number; max: number; currency: string };
      targetStartDate?: string;
    },
  ) {
    const existing = await this.prisma.hiringRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`HiringRequest ${id} not found`);
    if (existing.status !== 'DRAFT' && existing.status !== 'REVISION_REQUESTED') {
      throw new BadRequestException('Only DRAFT or REVISION_REQUESTED requests can be updated');
    }

    return this.prisma.hiringRequest.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.justification !== undefined && { justification: data.justification }),
        ...(data.headcount !== undefined && { headcount: data.headcount }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.workMode !== undefined && { workMode: data.workMode }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.budgetRange !== undefined && { budgetRange: data.budgetRange }),
        ...(data.targetStartDate !== undefined && {
          targetStartDate: new Date(data.targetStartDate),
        }),
      },
      include: {
        department: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, displayName: true } },
      },
    });
  }

  async submit(id: string) {
    const existing = await this.prisma.hiringRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`HiringRequest ${id} not found`);
    if (existing.status !== 'DRAFT' && existing.status !== 'REVISION_REQUESTED') {
      throw new BadRequestException('Only DRAFT or REVISION_REQUESTED requests can be submitted');
    }

    return this.prisma.hiringRequest.update({
      where: { id },
      data: { status: 'PENDING_APPROVAL', currentLevel: 1, submittedAt: new Date() },
    });
  }

  async forwardToBoss(id: string) {
    const existing = await this.prisma.hiringRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`HiringRequest ${id} not found`);
    if (existing.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Request must be PENDING_APPROVAL to forward');
    }

    return this.prisma.hiringRequest.update({
      where: { id },
      data: { currentLevel: existing.currentLevel + 1 },
    });
  }

  async approve(id: string, actorId: string, comments?: string) {
    const existing = await this.prisma.hiringRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`HiringRequest ${id} not found`);
    if (existing.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Request must be PENDING_APPROVAL to approve');
    }

    const [, request] = await this.prisma.$transaction([
      this.prisma.hiringRequestApproval.create({
        data: {
          hiringRequestId: id,
          approverUserId: actorId,
          level: existing.currentLevel,
          decision: 'APPROVED',
          comments,
          decidedAt: new Date(),
        },
      }),
      this.prisma.hiringRequest.update({
        where: { id },
        data: { status: 'APPROVED', approvedAt: new Date() },
      }),
    ]);

    return request;
  }

  async reject(
    id: string,
    actorId: string,
    decision: 'REJECTED' | 'REVISION_REQUESTED',
    comments?: string,
  ) {
    const existing = await this.prisma.hiringRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`HiringRequest ${id} not found`);
    if (existing.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Request must be PENDING_APPROVAL to reject');
    }

    const newStatus = decision === 'REVISION_REQUESTED' ? 'REVISION_REQUESTED' : 'REJECTED';

    const [, request] = await this.prisma.$transaction([
      this.prisma.hiringRequestApproval.create({
        data: {
          hiringRequestId: id,
          approverUserId: actorId,
          level: existing.currentLevel,
          decision,
          comments,
          decidedAt: new Date(),
        },
      }),
      this.prisma.hiringRequest.update({
        where: { id },
        data: {
          status: newStatus,
          ...(newStatus === 'REJECTED' && { rejectionReason: comments, rejectedAt: new Date() }),
          ...(newStatus === 'REVISION_REQUESTED' && { revisionNotes: comments }),
        },
      }),
    ]);

    return request;
  }

  async getLogs(id: string) {
    const existing = await this.prisma.hiringRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`HiringRequest ${id} not found`);

    return this.prisma.hiringRequestApproval.findMany({
      where: { hiringRequestId: id },
      include: { approverUser: { select: { id: true, displayName: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getTracking(id: string) {
    const request = await this.prisma.hiringRequest.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, displayName: true } },
        approvals: {
          include: { approverUser: { select: { id: true, displayName: true } } },
          orderBy: { level: 'asc' },
        },
      },
    });
    if (!request) throw new NotFoundException(`HiringRequest ${id} not found`);

    return {
      id: request.id,
      title: request.title,
      status: request.status,
      currentLevel: request.currentLevel,
      priority: request.priority,
      headcount: request.headcount,
      submittedAt: request.submittedAt,
      approvedAt: request.approvedAt,
      rejectedAt: request.rejectedAt,
      rejectionReason: request.rejectionReason,
      revisionNotes: request.revisionNotes,
      department: request.department,
      requestedBy: request.requestedBy,
      approvals: request.approvals,
    };
  }
}
