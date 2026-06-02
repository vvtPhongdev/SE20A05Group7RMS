import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import { PlanGuardService } from '../../common/plan-guard/plan-guard.service';
import { TaskPlanType, ApplicationStatus } from '@wr/contracts';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planGuard: PlanGuardService,
  ) {}

  /**
   * FR-07: CV submission / screening is a plan-locked activity.
   * Requires: request APPROVED+, OverallPlan APPROVED, CV_SCREENING task assigned.
   */
  async create(dto: {
    roleId: string;
    candidateProfileId: string;
    applicantUserId: string;
    coverNote?: string;
  }) {
    // Resolve the hiringRequestId through the role
    const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role) {
      throw new RpcException({ status: HttpStatus.NOT_FOUND, message: 'Role not found' });
    }

    // FR-07: Only enforce plan guard if the role originated from a hiring request
    if (role.hiringRequestId) {
      await this.planGuard.assertPlanReady(role.hiringRequestId, TaskPlanType.CV_SCREENING);
    }

    const existing = await this.prisma.application.findUnique({
      where: { uq_applications_role_candidate: { roleId: dto.roleId, candidateProfileId: dto.candidateProfileId } },
    });
    if (existing) {
      throw new RpcException({ status: HttpStatus.CONFLICT, message: 'Application already exists for this role and candidate' });
    }

    return this.prisma.application.create({
      data: {
        roleId: dto.roleId,
        candidateProfileId: dto.candidateProfileId,
        applicantUserId: dto.applicantUserId,
        coverNote: dto.coverNote ?? null,
        status: ApplicationStatus.SUBMITTED,
      },
    });
  }

  async list(query: { roleId?: string; candidateProfileId?: string; status?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, query.pageSize ?? 20));

    const where: any = {};
    if (query.roleId) where.roleId = query.roleId;
    if (query.candidateProfileId) where.candidateProfileId = query.candidateProfileId;
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.application.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async get(id: string) {
    const app = await this.prisma.application.findUnique({ where: { id } });
    if (!app) {
      throw new RpcException({ status: HttpStatus.NOT_FOUND, message: 'Application not found' });
    }
    return app;
  }

  async updateStatus(id: string, status: string) {
    await this.get(id);
    return this.prisma.application.update({ where: { id }, data: { status } });
  }
}
