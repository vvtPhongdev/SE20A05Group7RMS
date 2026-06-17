import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import {
  CreateUserSchema,
  CreateUserInput,
  UpdateUserSchema,
  UpdateUserInput,
  UserRole,
} from '@wr/contracts';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeAvatar(value: unknown) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return value;
    }

    const avatar = value as Record<string, unknown>;
    if (typeof avatar.fileName === 'string' && avatar.fileName) {
      return avatar;
    }

    const source = typeof avatar.path === 'string' ? avatar.path : avatar.url;
    const fileName = typeof source === 'string' ? source.split(/[\\/]/).pop() : undefined;
    return fileName ? { ...avatar, fileName } : avatar;
  }

  private normalizeUserAvatar<T extends { avatar?: unknown }>(user: T): T {
    return {
      ...user,
      avatar: this.normalizeAvatar(user.avatar),
    };
  }

  private get userSelect() {
    return {
      id: true,
      email: true,
      displayName: true,
      role: true,
      organizationId: true,
      departmentId: true,
      phone: true,
      avatar: true,
      isActive: true,
      department: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    };
  }

  async list(query: { page?: number; limit?: number; role?: string; departmentId?: string }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.role) {
      where.role = query.role;
    }
    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }

    const [total, data] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: this.userSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: data.map((user) => this.normalizeUserAvatar(user)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async get(payload: { id: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
      select: this.userSelect,
    });

    if (!user) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `User with ID ${payload.id} not found`,
      });
    }

    return this.normalizeUserAvatar(user);
  }

  async create(dto: CreateUserInput & { password?: string }) {
    // 1. Zod runtime validation for the core user payload
    const parsed = CreateUserSchema.parse(dto);

    // 2. Check email uniqueness
    const existing = await this.prisma.user.findUnique({
      where: { email: parsed.email },
    });
    if (existing) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: 'Email already exists',
      });
    }

    // 3. Verify organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: parsed.organizationId },
    });
    if (!organization) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Organization does not exist',
      });
    }

    // 4. Verify department exists if provided
    if (parsed.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: parsed.departmentId },
      });
      if (!department) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Department does not exist',
        });
      }
    }

    // 5. Password hashing (if provided)
    let passwordHash: string | null = null;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 12);
    }

    // 6. DB creation
    const user = await this.prisma.user.create({
      data: {
        email: parsed.email,
        displayName: parsed.displayName,
        role: parsed.role,
        organizationId: parsed.organizationId,
        departmentId: parsed.departmentId || null,
        phone: parsed.phone || null,
        passwordHash,
        isActive: true,
      },
      select: this.userSelect,
    });

    return user;
  }

  async update(payload: { id: string } & UpdateUserInput) {
    const { id, ...updateData } = payload;

    // 1. Verify user exists
    const existing = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `User with ID ${id} not found`,
      });
    }

    // 2. Validate input schema
    const parsed = UpdateUserSchema.parse(updateData);

    // 3. Verify department if changing
    if (parsed.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: parsed.departmentId },
      });
      if (!department) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Department does not exist',
        });
      }
    }

    // 4. DB update
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        displayName: parsed.displayName !== undefined ? parsed.displayName : undefined,
        phone: parsed.phone !== undefined ? parsed.phone : undefined,
        isActive: parsed.isActive !== undefined ? parsed.isActive : undefined,
        departmentId: parsed.departmentId !== undefined ? parsed.departmentId : undefined,
      },
      select: this.userSelect,
    });

    return updated;
  }

  async delete(payload: { id: string }) {
    // 1. Verify user exists
    const existing = await this.prisma.user.findUnique({
      where: { id: payload.id },
    });
    if (!existing) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `User with ID ${payload.id} not found`,
      });
    }

    // 2. DB delete
    await this.prisma.user.delete({
      where: { id: payload.id },
    });

    return { success: true };
  }

  async updateRole(payload: { id: string; role: string }) {
    // 1. Verify user exists
    const existing = await this.prisma.user.findUnique({
      where: { id: payload.id },
    });
    if (!existing) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `User with ID ${payload.id} not found`,
      });
    }

    // 2. Validate against UserRole enum values
    const roleValues = Object.values(UserRole) as string[];
    if (!roleValues.includes(payload.role)) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Invalid role: ${payload.role}. Must be one of ${roleValues.join(', ')}`,
      });
    }

    // 3. DB update
    const updated = await this.prisma.user.update({
      where: { id: payload.id },
      data: { role: payload.role },
      select: this.userSelect,
    });

    return updated;
  }

  async updateStatus(payload: { id: string; isActive: boolean }) {
    // 1. Verify user exists
    const existing = await this.prisma.user.findUnique({
      where: { id: payload.id },
    });
    if (!existing) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `User with ID ${payload.id} not found`,
      });
    }

    // 2. DB update
    const updated = await this.prisma.user.update({
      where: { id: payload.id },
      data: { isActive: payload.isActive },
      select: this.userSelect,
    });

    return updated;
  }
}
