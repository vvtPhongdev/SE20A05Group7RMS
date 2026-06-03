import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class CandidateProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(id: string) {
    return this.prisma.candidateProfile.findFirst({
      where: { OR: [{ id }, { userId: id }] },
      include: {
        user: { select: { id: true, displayName: true, email: true, role: true } },
        cvDocuments: {
          where: { documentType: 'CV' },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, fileName: true, state: true, mimeType: true, createdAt: true },
        },
      },
    });
  }

  async updateProfile(
    id: string,
    data: {
      headline?: string;
      summary?: string;
      visibility?: string;
      preferredWorkMode?: string;
      preferredLocations?: string[];
      yearsOfExperience?: number;
    },
  ) {
    return this.prisma.candidateProfile.update({
      where: { id },
      data,
    });
  }

  async searchProfiles(query: {
    q?: string;
    workMode?: string;
    location?: string;
    minYearsExperience?: number | string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    const page = Number(query.page ?? 1);
    const pageSize = Math.min(Number(query.pageSize ?? 20), 50);
    const minYears = query.minYearsExperience ? Number(query.minYearsExperience) : undefined;

    const where: Record<string, unknown> = { visibility: { not: 'PRIVATE' } };

    if (query.q) {
      where['OR'] = [
        { headline: { contains: query.q, mode: 'insensitive' } },
        { summary: { contains: query.q, mode: 'insensitive' } },
        { user: { displayName: { contains: query.q, mode: 'insensitive' } } },
      ];
    }
    if (query.workMode) where['preferredWorkMode'] = query.workMode;
    if (minYears !== undefined) where['yearsOfExperience'] = { gte: minYears };

    const [data, total] = await Promise.all([
      this.prisma.candidateProfile.findMany({
        where: where as any,
        include: {
          user: { select: { id: true, displayName: true, email: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.candidateProfile.count({ where: where as any }),
    ]);

    return { data, total, page, pageSize };
  }

  async screenProfile(candidateProfileId: string, roleId?: string) {
    const profile = await this.prisma.candidateProfile.findUniqueOrThrow({
      where: { id: candidateProfileId },
      include: {
        cvDocuments: {
          where: { documentType: 'CV', state: 'PARSED' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, fileName: true, state: true },
        },
        user: { select: { id: true, displayName: true } },
      },
    });

    return {
      status: 'QUEUED',
      message: 'CV screening queued for processing',
      candidateProfileId,
      candidateName: profile.user.displayName,
      roleId: roleId ?? null,
      latestParsedCvId: profile.cvDocuments[0]?.id ?? null,
    };
  }
}
