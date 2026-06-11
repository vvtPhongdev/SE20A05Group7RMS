import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateOrganizationSchema,
  CreateOrganizationInput,
  UpdateOrganizationSchema,
  UpdateOrganizationInput,
} from '@wr/contracts';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrganizationInput) {
    const parsed = CreateOrganizationSchema.parse(dto);

    // Check slug uniqueness
    const existing = await this.prisma.organization.findUnique({
      where: { slug: parsed.slug },
    });
    if (existing) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: `Organization with slug '${parsed.slug}' already exists`,
      });
    }

    return this.prisma.organization.create({
      data: {
        name: parsed.name,
        slug: parsed.slug,
        ...(parsed.settings !== undefined
          ? { settings: parsed.settings as Prisma.InputJsonValue }
          : {}),
      },
    });
  }

  async list() {
    return this.prisma.organization.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async get(payload: { id: string }) {
    const org = await this.prisma.organization.findUnique({
      where: { id: payload.id },
    });

    if (!org) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Organization with ID ${payload.id} not found`,
      });
    }

    return org;
  }

  async update(payload: { id: string } & UpdateOrganizationInput) {
    const { id, ...data } = payload;
    const existing = await this.prisma.organization.findUnique({ where: { id } });

    if (!existing) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Organization with ID ${id} not found`,
      });
    }

    const parsed = UpdateOrganizationSchema.parse(data);
    if (parsed.slug && parsed.slug !== existing.slug) {
      const slugOwner = await this.prisma.organization.findUnique({
        where: { slug: parsed.slug },
      });
      if (slugOwner) {
        throw new RpcException({
          status: HttpStatus.CONFLICT,
          message: `Organization with slug '${parsed.slug}' already exists`,
        });
      }
    }

    return this.prisma.organization.update({
      where: { id },
      data: {
        name: parsed.name,
        slug: parsed.slug,
        ...(parsed.settings !== undefined
          ? { settings: parsed.settings as Prisma.InputJsonValue }
          : {}),
      },
    });
  }
}
