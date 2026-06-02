import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateDepartmentSchema, CreateDepartmentInput, UpdateDepartmentSchema } from '@wr/contracts';
import { UserRole } from '@wr/contracts';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDepartmentInput & { organizationId: string }) {
    const parsed = CreateDepartmentSchema.parse(dto);

    const existing = await this.prisma.department.findUnique({
      where: { organizationId_code: { organizationId: dto.organizationId, code: parsed.code } },
    });
    if (existing) {
      throw new RpcException({ status: HttpStatus.CONFLICT, message: `Department code '${parsed.code}' already exists in this organization` });
    }

    if (parsed.headUserId) {
      await this.validateDeptHead(parsed.headUserId);
    }

    return this.prisma.department.create({
      data: {
        organizationId: dto.organizationId,
        name: parsed.name,
        code: parsed.code,
        headUserId: parsed.headUserId ?? null,
        parentId: parsed.parentId ?? null,
      },
    });
  }

  async list(query: { organizationId: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, query.pageSize ?? 20));

    const [items, total] = await Promise.all([
      this.prisma.department.findMany({
        where: { organizationId: query.organizationId },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: 'asc' },
        include: {
          headUser: { select: { id: true, displayName: true, email: true } },
          _count: { select: { hiringRequests: true } },
        },
      }),
      this.prisma.department.count({ where: { organizationId: query.organizationId } }),
    ]);

    return { items, total, page, pageSize };
  }

  async get(id: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: {
        headUser: { select: { id: true, displayName: true, email: true, role: true } },
        children: { select: { id: true, name: true, code: true } },
      },
    });
    if (!dept) {
      throw new RpcException({ status: HttpStatus.NOT_FOUND, message: 'Department not found' });
    }
    return dept;
  }

  async update(id: string, dto: Partial<CreateDepartmentInput>) {
    const parsed = UpdateDepartmentSchema.parse(dto);

    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) {
      throw new RpcException({ status: HttpStatus.NOT_FOUND, message: 'Department not found' });
    }

    if (parsed.code && parsed.code !== dept.code) {
      const conflict = await this.prisma.department.findUnique({
        where: { organizationId_code: { organizationId: dept.organizationId, code: parsed.code } },
      });
      if (conflict) {
        throw new RpcException({ status: HttpStatus.CONFLICT, message: `Department code '${parsed.code}' already exists` });
      }
    }

    if (parsed.headUserId) {
      await this.validateDeptHead(parsed.headUserId);
    }

    return this.prisma.department.update({
      where: { id },
      data: {
        ...(parsed.name && { name: parsed.name }),
        ...(parsed.code && { code: parsed.code }),
        ...(parsed.headUserId !== undefined && { headUserId: parsed.headUserId }),
        ...(parsed.parentId !== undefined && { parentId: parsed.parentId }),
      },
    });
  }

  async remove(id: string) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) {
      throw new RpcException({ status: HttpStatus.NOT_FOUND, message: 'Department not found' });
    }
    await this.prisma.department.delete({ where: { id } });
    return { success: true };
  }

  private async validateDeptHead(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: 'Head user not found' });
    }
    if (user.role !== UserRole.DEPARTMENT_HEAD) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Head user must have role DEPARTMENT_HEAD, got: ${user.role}`,
      });
    }
  }
}
