import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import { PlanGuardService } from '../../common/plan-guard/plan-guard.service';
import { CreateRoleSchema } from '@wr/contracts';
import { TaskPlanType } from '@wr/contracts';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planGuard: PlanGuardService,
  ) {}

  /**
   * FR-07: Job posting is a plan-locked activity.
   * Requires: request APPROVED+, OverallPlan APPROVED, JOB_POSTING task assigned.
   */
  async create(dto: {
    organizationId: string;
    hiringRequestId: string;
    title: string;
    description?: string;
    workMode?: string;
    location?: string;
  }) {
    // FR-07: Enforce plan-locked preconditions before creating the job posting
    await this.planGuard.assertPlanReady(dto.hiringRequestId, TaskPlanType.JOB_POSTING);

    const parsed = CreateRoleSchema.parse(dto);

    return this.prisma.role.create({
      data: {
        organizationId: dto.organizationId,
        hiringRequestId: dto.hiringRequestId,
        title: parsed.title,
        description: parsed.description,
        workMode: parsed.workMode,
        location: parsed.location,
      },
    });
  }

  async list(query: { organizationId?: string; isActive?: boolean; page?: number; pageSize?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, query.pageSize ?? 20));

    const where: any = {};
    if (query.organizationId) where.organizationId = query.organizationId;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const [items, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.role.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async get(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new RpcException({ status: HttpStatus.NOT_FOUND, message: 'Role not found' });
    }
    return role;
  }
}
