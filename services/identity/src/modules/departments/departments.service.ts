import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import {
  CreateDepartmentSchema,
  CreateDepartmentInput,
  UpdateDepartmentSchema,
  UpdateDepartmentInput,
  UserRole,
} from '@wr/contracts';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDepartmentInput) {
    const parsed = CreateDepartmentSchema.parse(dto);

    // 1. Check unique name in organization (case-insensitive)
    const existingName = await this.prisma.department.findFirst({
      where: {
        organizationId: parsed.organizationId,
        name: { equals: parsed.name, mode: 'insensitive' },
      },
    });
    if (existingName) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: `Department with name '${parsed.name}' already exists in this organization`,
      });
    }

    // 2. Check unique code in organization
    const existingCode = await this.prisma.department.findUnique({
      where: {
        organizationId_code: {
          organizationId: parsed.organizationId,
          code: parsed.code,
        },
      },
    });
    if (existingCode) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: `Department with code '${parsed.code}' already exists in this organization`,
      });
    }

    // 3. Verify headUserId exists and has DEPARTMENT_HEAD role
    if (parsed.headUserId) {
      const headUser = await this.prisma.user.findUnique({
        where: { id: parsed.headUserId },
      });
      if (!headUser) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Assigned department head user does not exist',
        });
      }
      if (headUser.role !== UserRole.DEPARTMENT_HEAD) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Assigned department head user must have the DEPARTMENT_HEAD role',
        });
      }
    }

    // 4. Verify parentId department exists and belongs to the same organization
    if (parsed.parentId) {
      const parentDept = await this.prisma.department.findUnique({
        where: { id: parsed.parentId },
      });
      if (!parentDept) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Parent department does not exist',
        });
      }
      if (parentDept.organizationId !== parsed.organizationId) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Parent department must belong to the same organization',
        });
      }
    }

    return this.prisma.department.create({
      data: {
        organizationId: parsed.organizationId,
        name: parsed.name,
        code: parsed.code,
        headUserId: parsed.headUserId || null,
        parentId: parsed.parentId || null,
      },
    });
  }

  async list(query?: {
    organizationId?: string;
    actorId?: string;
    actorRole?: string;
    actorOrganizationId?: string;
  }) {
    const where: any = {};
    if (query?.actorRole === UserRole.DEPARTMENT_HEAD) {
      where.organizationId = query.actorOrganizationId;
      where.headUserId = query.actorId;
    } else if (query?.organizationId) {
      where.organizationId = query.organizationId;
    }

    return this.prisma.department.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        headUser: {
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
          },
        },
        _count: {
          select: {
            users: true,
            requests: {
              where: {
                status: {
                  notIn: ['CLOSED', 'CANCELLED', 'REJECTED'],
                },
              },
            },
          },
        },
      },
    });
  }

  async get(payload: { id: string }) {
    const dept = await this.prisma.department.findUnique({
      where: { id: payload.id },
      include: {
        headUser: {
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
          },
        },
        parent: true,
        children: true,
      },
    });

    if (!dept) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Department with ID ${payload.id} not found`,
      });
    }

    return dept;
  }

  async update(payload: { id: string } & UpdateDepartmentInput) {
    const { id, ...updateData } = payload;

    // 1. Verify department exists
    const existing = await this.prisma.department.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Department with ID ${id} not found`,
      });
    }

    // 2. Validate input schema
    const parsed = UpdateDepartmentSchema.parse(updateData);

    // 3. Check unique name if changing
    if (parsed.name) {
      const existingName = await this.prisma.department.findFirst({
        where: {
          organizationId: existing.organizationId,
          name: { equals: parsed.name, mode: 'insensitive' },
          id: { not: id },
        },
      });
      if (existingName) {
        throw new RpcException({
          status: HttpStatus.CONFLICT,
          message: `Department with name '${parsed.name}' already exists in this organization`,
        });
      }
    }

    // 4. Check unique code if changing
    if (parsed.code) {
      const existingCode = await this.prisma.department.findUnique({
        where: {
          organizationId_code: {
            organizationId: existing.organizationId,
            code: parsed.code,
          },
        },
      });
      if (existingCode && existingCode.id !== id) {
        throw new RpcException({
          status: HttpStatus.CONFLICT,
          message: `Department with code '${parsed.code}' already exists in this organization`,
        });
      }
    }

    // 5. Verify headUserId exists and has DEPARTMENT_HEAD role
    if (parsed.headUserId) {
      const headUser = await this.prisma.user.findUnique({
        where: { id: parsed.headUserId },
      });
      if (!headUser) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Assigned department head user does not exist',
        });
      }
      if (headUser.role !== UserRole.DEPARTMENT_HEAD) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Assigned department head user must have the DEPARTMENT_HEAD role',
        });
      }
    }

    // 6. Verify parentId
    if (parsed.parentId) {
      if (parsed.parentId === id) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'A department cannot be its own parent',
        });
      }
      const parentDept = await this.prisma.department.findUnique({
        where: { id: parsed.parentId },
      });
      if (!parentDept) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Parent department does not exist',
        });
      }
      if (parentDept.organizationId !== existing.organizationId) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Parent department must belong to the same organization',
        });
      }
    }

    return this.prisma.department.update({
      where: { id },
      data: {
        name: parsed.name !== undefined ? parsed.name : undefined,
        code: parsed.code !== undefined ? parsed.code : undefined,
        headUserId: parsed.headUserId !== undefined ? parsed.headUserId : undefined,
        parentId: parsed.parentId !== undefined ? parsed.parentId : undefined,
      },
    });
  }

  async delete(payload: { id: string }) {
    // 1. Verify department exists
    const existing = await this.prisma.department.findUnique({
      where: { id: payload.id },
    });
    if (!existing) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Department with ID ${payload.id} not found`,
      });
    }

    // 2. DB Delete
    await this.prisma.department.delete({
      where: { id: payload.id },
    });

    return { success: true };
  }
}
