import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateOrganizationSchema, CreateOrganizationInput } from '@wr/contracts';

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
      data: parsed,
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
}
