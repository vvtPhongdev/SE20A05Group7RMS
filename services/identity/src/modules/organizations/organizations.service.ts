import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import { CreateOrganizationSchema, CreateOrganizationInput } from '@wr/contracts';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrganizationInput) {
    const parsed = CreateOrganizationSchema.parse(dto);

    const existing = await this.prisma.organization.findUnique({
      where: { slug: parsed.slug },
    });
    if (existing) {
      throw new RpcException({ status: HttpStatus.CONFLICT, message: 'Organization slug already exists' });
    }

    return this.prisma.organization.create({ data: { name: parsed.name, slug: parsed.slug } });
  }

  async list(query: { page?: number; pageSize?: number }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.organization.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { departments: true, members: true } } },
      }),
      this.prisma.organization.count(),
    ]);

    return { items, total, page, pageSize };
  }

  async get(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        departments: { select: { id: true, name: true, code: true, headUserId: true } },
        _count: { select: { members: true } },
      },
    });
    if (!org) {
      throw new RpcException({ status: HttpStatus.NOT_FOUND, message: 'Organization not found' });
    }
    return org;
  }
}
