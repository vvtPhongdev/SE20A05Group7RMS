import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import { PlanGuardService } from '../../common/plan-guard/plan-guard.service';
import { TaskPlanType, InviteStatus } from '@wr/contracts';

@Injectable()
export class InvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planGuard: PlanGuardService,
  ) {}

  /**
   * FR-07: Sending an interview invite is a plan-locked activity.
   * Requires: request APPROVED+, OverallPlan APPROVED, INTERVIEW_COORDINATION task assigned.
   */
  async create(dto: {
    roleId: string;
    sentByUserId: string;
    candidateUserId: string;
    message?: string;
    expiresAt?: string;
  }) {
    // Resolve the hiringRequestId through the role
    const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role) {
      throw new RpcException({ status: HttpStatus.NOT_FOUND, message: 'Role not found' });
    }

    // FR-07: Enforce plan guard for interview coordination activities
    if (role.hiringRequestId) {
      await this.planGuard.assertPlanReady(role.hiringRequestId, TaskPlanType.INTERVIEW_COORDINATION);
    }

    const existing = await this.prisma.invite.findUnique({
      where: { uq_invites_role_candidate: { roleId: dto.roleId, candidateUserId: dto.candidateUserId } },
    });
    if (existing) {
      throw new RpcException({ status: HttpStatus.CONFLICT, message: 'An invite already exists for this candidate and role' });
    }

    return this.prisma.invite.create({
      data: {
        roleId: dto.roleId,
        sentByUserId: dto.sentByUserId,
        candidateUserId: dto.candidateUserId,
        message: dto.message ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        status: InviteStatus.PENDING,
      },
    });
  }

  async list(query: { roleId?: string; candidateUserId?: string; status?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, query.pageSize ?? 20));

    const where: any = {};
    if (query.roleId) where.roleId = query.roleId;
    if (query.candidateUserId) where.candidateUserId = query.candidateUserId;
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      this.prisma.invite.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invite.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async get(id: string) {
    const invite = await this.prisma.invite.findUnique({ where: { id } });
    if (!invite) {
      throw new RpcException({ status: HttpStatus.NOT_FOUND, message: 'Invite not found' });
    }
    return invite;
  }
}
