import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { RecruitmentRequestStatus, UserRole } from '@wr/contracts';
import { PrismaService } from '../../common/database/prisma.service';

export type UUID = string;

export interface RecruitmentRequest {
  id: UUID;
  positionTitle: string;
  jdText: string;
  headcount: number;
  urgency: string;
  justification: string;
  departmentId: string;
  createdBy: string;
  status: RecruitmentRequestStatus;
  createdAt: string;
  logs: RequestLog[];
}

export interface RequestLog {
  timestamp: string;
  actorId: string;
  previousStatus: RecruitmentRequestStatus | null;
  newStatus: RecruitmentRequestStatus;
  notes?: string;
}

@Injectable()
export class RecruitmentRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  store = new Map<string, RecruitmentRequest>();

  logTransition(
    req: RecruitmentRequest,
    actorId: string,
    previous: RecruitmentRequestStatus | null,
    next: RecruitmentRequestStatus,
    notes?: string,
  ) {
    const entry: RequestLog = {
      timestamp: new Date().toISOString(),
      actorId,
      previousStatus: previous,
      newStatus: next,
      notes,
    };
    if (!req.logs) req.logs = [];
    req.logs.push(entry);
  }

  async listForAdmin(payload: {
    page?: number;
    limit?: number;
    status?: string;
    departmentId?: string;
    urgency?: string;
    q?: string;
  }) {
    const page = Math.max(1, Number(payload.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(payload.limit) || 50));
    const where: any = {};

    if (payload.status) where.status = payload.status;
    if (payload.departmentId) where.departmentId = payload.departmentId;
    if (payload.urgency) where.urgency = payload.urgency;
    if (payload.q?.trim()) {
      where.OR = [
        { position: { contains: payload.q.trim(), mode: 'insensitive' } },
        { createdBy: { displayName: { contains: payload.q.trim(), mode: 'insensitive' } } },
        { reviewedBy: { displayName: { contains: payload.q.trim(), mode: 'insensitive' } } },
      ];
    }

    const [total, requests] = await Promise.all([
      this.prisma.recruitmentRequest.count({ where }),
      this.prisma.recruitmentRequest.findMany({
        where,
        include: {
          department: {
            select: { id: true, name: true, code: true },
          },
          createdBy: {
            select: { id: true, displayName: true },
          },
          reviewedBy: {
            select: { id: true, displayName: true },
          },
          applications: {
            select: { status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: requests.map((request) => ({
        id: request.id,
        position: request.position,
        department: request.department,
        requester: request.createdBy,
        owner: request.reviewedBy,
        status: request.status,
        urgency: request.urgency,
        headcount: request.headcount,
        filledHeadcount: request.applications.filter(
          (application) => application.status === 'OFFER_ACCEPTED',
        ).length,
        jobDescription: request.jobDescription,
        skillRequirements: request.skillRequirements,
        justification: request.justification,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async assignToHr(payload: { id: string; hrManagerId: string; assignedById: string }) {
    const [request, hrManager] = await Promise.all([
      this.prisma.recruitmentRequest.findUnique({ where: { id: payload.id } }),
      this.prisma.user.findUnique({ where: { id: payload.hrManagerId } }),
    ]);

    if (!request) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Recruitment request with ID ${payload.id} not found`,
      });
    }
    if (!hrManager || hrManager.role !== UserRole.HR_MANAGER || !hrManager.isActive) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'The selected user must be an active HR manager',
      });
    }

    const updated = await this.prisma.recruitmentRequest.update({
      where: { id: payload.id },
      data: { reviewedById: hrManager.id },
      include: {
        reviewedBy: {
          select: { id: true, displayName: true },
        },
      },
    });

    await this.prisma.requestLog.create({
      data: {
        requestId: payload.id,
        action: 'ASSIGNED_TO_HR',
        performedById: payload.assignedById,
        metadata: {
          hrManagerId: hrManager.id,
          hrManagerName: hrManager.displayName,
        },
      },
    });

    return updated;
  }
}
