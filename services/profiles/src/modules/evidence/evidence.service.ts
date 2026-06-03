import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class EvidenceService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: {
    evaluationRunId?: string;
    evidenceType?: string;
    page?: string | number;
    pageSize?: string | number;
  }) {
    const page = Number(query.page ?? 1);
    const pageSize = Math.min(Number(query.pageSize ?? 20), 100);

    const where: Record<string, unknown> = {};
    if (query.evaluationRunId) where['evaluationRunId'] = query.evaluationRunId;
    if (query.evidenceType) where['evidenceType'] = query.evidenceType;

    const [data, total] = await Promise.all([
      this.prisma.evidenceRecord.findMany({
        where: where as any,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.evidenceRecord.count({ where: where as any }),
    ]);

    return { data, total, page, pageSize };
  }

  async get(id: string) {
    return this.prisma.evidenceRecord.findUniqueOrThrow({ where: { id } });
  }
}
