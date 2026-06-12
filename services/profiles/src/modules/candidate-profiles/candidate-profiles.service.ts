import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import { UserRole } from '@wr/contracts';

@Injectable()
export class CandidateProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  private structuredData(value: unknown): Record<string, any> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, any>)
      : {};
  }

  private async findStoredProfile(id: string) {
    const profile = await this.prisma.candidateProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
    });

    if (!profile) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Candidate profile not found for ID ${id}`,
      });
    }

    return profile;
  }

  async listCandidates(payload: { q?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, Number(payload.page) || 1);
    const pageSize = Math.max(1, Math.min(100, Number(payload.pageSize) || 50));
    const where: any = {};

    if (payload.q?.trim()) {
      where.OR = [
        { fullName: { contains: payload.q.trim(), mode: 'insensitive' } },
        { email: { contains: payload.q.trim(), mode: 'insensitive' } },
      ];
    }

    const activeApplicationStatuses = [
      'SUBMITTED',
      'SCREENING',
      'INTERVIEWING',
      'OFFER_EXTENDED',
      'OFFER_ACCEPTED',
    ];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [total, candidates, parsedCount, newThisWeekCount, activeCampaignsCount] =
      await Promise.all([
        this.prisma.candidateProfile.count({ where }),
        this.prisma.candidateProfile.findMany({
          where,
          include: {
            cvDocuments: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { parsedAt: true, screeningStatus: true },
            },
            applications: {
              orderBy: { createdAt: 'desc' },
              take: 3,
              select: {
                status: true,
                request: {
                  select: {
                    position: true,
                    department: { select: { name: true } },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        this.prisma.candidateProfile.count({
          where: { cvDocuments: { some: { parsedAt: { not: null } } } },
        }),
        this.prisma.candidateProfile.count({
          where: { createdAt: { gte: sevenDaysAgo } },
        }),
        this.prisma.candidateProfile.count({
          where: { applications: { some: { status: { in: activeApplicationStatuses } } } },
        }),
      ]);

    return {
      data: candidates,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        parsedCount,
        newThisWeekCount,
        activeCampaignsCount,
      },
    };
  }

  async getProfile(id: string) {
    let profile = await this.prisma.candidateProfile.findFirst({
      where: {
        OR: [{ id: id }, { userId: id }],
      },
      include: {
        cvDocuments: true,
        applications: {
          include: {
            request: {
              include: {
                department: true,
              },
            },
          },
        },
        interviews: {
          include: {
            request: {
              include: {
                department: true,
              },
            },
          },
          orderBy: { scheduledAt: 'asc' },
        },
      },
    });

    if (!profile) {
      // Self-healing: if the user exists and is a CANDIDATE, create their profile record
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (user && user.role === UserRole.CANDIDATE) {
        profile = await this.prisma.candidateProfile.create({
          data: {
            userId: user.id,
            fullName: user.displayName,
            email: user.email,
            phone: user.phone || null,
            summary: '',
            structuredData: {},
          },
          include: {
            cvDocuments: true,
            applications: {
              include: {
                request: {
                  include: {
                    department: true,
                  },
                },
              },
            },
            interviews: {
              include: {
                request: {
                  include: {
                    department: true,
                  },
                },
              },
              orderBy: { scheduledAt: 'asc' },
            },
          },
        });
      } else {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Candidate profile not found for ID ${id}`,
        });
      }
    }

    const interviewerIds = [
      ...new Set(profile.interviews.flatMap((interview) => interview.interviewers)),
    ];
    const interviewers = interviewerIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: interviewerIds } },
          select: { id: true, displayName: true, role: true },
        })
      : [];
    const interviewerMap = new Map(interviewers.map((user) => [user.id, user]));

    return {
      ...profile,
      interviews: profile.interviews.map((interview) => ({
        ...interview,
        panel: interview.interviewers
          .map((id) => interviewerMap.get(id))
          .filter((user) => user !== undefined),
      })),
    };
  }

  async updateProfile(id: string, data: any) {
    const profile = await this.findStoredProfile(id);
    const currentStructuredData = this.structuredData(profile.structuredData);

    const allowedData = {
      ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
      ...(data.summary !== undefined ? { summary: data.summary } : {}),
      ...(data.structuredData !== undefined
        ? {
            structuredData: {
              ...currentStructuredData,
              ...this.structuredData(data.structuredData),
            },
          }
        : {}),
    };

    return this.prisma.candidateProfile.update({
      where: { id: profile.id },
      data: allowedData,
    });
  }

  async getAvatar(id: string) {
    const profile = await this.findStoredProfile(id);
    return this.structuredData(profile.structuredData).avatar ?? null;
  }

  async setAvatar(id: string, avatar: Record<string, string>) {
    const profile = await this.findStoredProfile(id);
    const structuredData = this.structuredData(profile.structuredData);
    const previousAvatar = structuredData.avatar ?? null;
    const updatedProfile = await this.prisma.candidateProfile.update({
      where: { id: profile.id },
      data: {
        structuredData: {
          ...structuredData,
          avatar,
        },
      },
    });

    return {
      avatar,
      previousAvatar,
      updatedAt: updatedProfile.updatedAt,
    };
  }

  async removeAvatar(id: string) {
    const profile = await this.findStoredProfile(id);
    const structuredData = this.structuredData(profile.structuredData);
    const { avatar: previousAvatar, ...remainingData } = structuredData;
    const updatedProfile = await this.prisma.candidateProfile.update({
      where: { id: profile.id },
      data: { structuredData: remainingData },
    });

    return {
      previousAvatar: previousAvatar ?? null,
      updatedAt: updatedProfile.updatedAt,
    };
  }
}
