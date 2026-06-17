import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { RpcException } from '@nestjs/microservices';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/database/prisma.service';
import { UserRole } from '@wr/contracts';
import { Prisma } from '@prisma/client';
import { JOB_NAMES, QUEUE_NAMES } from '@wr/queue';

const PROFILE_ENRICHMENT_START = '--- RMS PROFILE ENRICHMENT START ---';
const PROFILE_ENRICHMENT_END = '--- RMS PROFILE ENRICHMENT END ---';

@Injectable()
export class CandidateProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.EMBEDDING_GENERATE) private readonly embeddingQueue: Queue,
  ) {}

  private structuredData(value: unknown): Record<string, any> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, any>)
      : {};
  }

  private avatarData(value: unknown): Record<string, string> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    const avatar = value as Record<string, string>;
    if (avatar.fileName) {
      return avatar;
    }

    const source = avatar.path || avatar.url;
    const fileName = source?.split(/[\\/]/).pop();
    return fileName ? { ...avatar, fileName } : avatar;
  }

  private withUserAvatar<T extends { structuredData: unknown; user?: { avatar?: unknown } | null }>(
    profile: T,
  ) {
    const structuredData = this.structuredData(profile.structuredData);
    const avatar = this.avatarData(profile.user?.avatar) ?? this.avatarData(structuredData.avatar);

    return {
      ...profile,
      structuredData: avatar ? { ...structuredData, avatar } : structuredData,
    };
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

  private compactList(values: unknown): string[] {
    if (!Array.isArray(values)) return [];
    return values
      .map((value) => String(value ?? '').trim())
      .filter(Boolean);
  }

  private profileEnrichmentText(profile: {
    fullName: string;
    email: string;
    phone: string | null;
    summary: string | null;
    structuredData: unknown;
  }) {
    const data = this.structuredData(profile.structuredData);
    const skills = this.compactList(data.skills);
    const experience = Array.isArray(data.experience)
      ? data.experience
          .map((item) => {
            const record = this.structuredData(item);
            return [record.title, record.company, record.duration, record.description]
              .map((value) => String(value ?? '').trim())
              .filter(Boolean)
              .join(' - ');
          })
          .filter(Boolean)
      : [];
    const education = Array.isArray(data.education)
      ? data.education
          .map((item) => {
            const record = this.structuredData(item);
            return [record.degree, record.school, record.year]
              .map((value) => String(value ?? '').trim())
              .filter(Boolean)
              .join(' - ');
          })
          .filter(Boolean)
      : [];

    const lines = [
      PROFILE_ENRICHMENT_START,
      `Candidate profile name: ${profile.fullName}`,
      data.currentRole ? `Current role: ${data.currentRole}` : '',
      profile.summary ? `Professional summary: ${profile.summary}` : '',
      data.location ? `Location: ${data.location}` : '',
      profile.phone ? `Phone: ${profile.phone}` : '',
      profile.email ? `Email: ${profile.email}` : '',
      data.linkedinUrl ? `LinkedIn: ${data.linkedinUrl}` : '',
      skills.length ? `Skills: ${skills.join(', ')}` : '',
      experience.length ? `Work experience: ${experience.join(' | ')}` : '',
      education.length ? `Education: ${education.join(' | ')}` : '',
      data.openToNewOpportunities !== undefined
        ? `Open to new opportunities: ${Boolean(data.openToNewOpportunities) ? 'yes' : 'no'}`
        : '',
      PROFILE_ENRICHMENT_END,
    ].filter(Boolean);

    return lines.join('\n');
  }

  private mergeProfileEnrichment(rawText: string, enrichment: string) {
    const pattern = new RegExp(
      `\\n?${PROFILE_ENRICHMENT_START}[\\s\\S]*?${PROFILE_ENRICHMENT_END}\\n?`,
      'm',
    );
    const cleaned = rawText.replace(pattern, '').trim();
    return [cleaned, enrichment].filter(Boolean).join('\n\n');
  }

  private async syncProfileToLatestCvEmbedding(profileId: string) {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { id: profileId },
      include: {
        cvDocuments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const latestCv = profile?.cvDocuments[0];
    if (!profile || !latestCv) return;

    const enrichedRawText = this.mergeProfileEnrichment(
      latestCv.rawText ?? '',
      this.profileEnrichmentText(profile),
    );

    const updatedCv = await this.prisma.candidateCV.update({
      where: { id: latestCv.id },
      data: {
        rawText: enrichedRawText,
      },
    });

    await this.embeddingQueue.add(
      JOB_NAMES.GENERATE_EMBEDDING,
      {
        cvDocumentId: updatedCv.id,
        rawText: updatedCv.rawText,
      },
      {
        jobId: `cv-embedding-${updatedCv.id}-profile-${Date.now()}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );
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
            user: {
              select: { avatar: true },
            },
            cvDocuments: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { parsedAt: true, screeningStatus: true },
            },
            applications: {
              orderBy: { createdAt: 'desc' },
              take: 3,
              select: {
                requestId: true,
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
      data: candidates.map((candidate) => this.withUserAvatar(candidate)),
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
        user: {
          select: { avatar: true },
        },
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
            user: {
              select: { avatar: true },
            },
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
      ...this.withUserAvatar(profile),
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

    const updated = await this.prisma.candidateProfile.update({
      where: { id: profile.id },
      data: allowedData,
    });

    await this.syncProfileToLatestCvEmbedding(updated.id).catch((error) => {
      console.warn(
        `Failed to sync candidate profile ${updated.id} to CV search index: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    });

    return updated;
  }

  async getAvatar(id: string) {
    const profile = await this.findStoredProfile(id);
    const user = await this.prisma.user.findUnique({
      where: { id: profile.userId },
      select: { avatar: true },
    });
    return this.avatarData(user?.avatar) ?? this.structuredData(profile.structuredData).avatar ?? null;
  }

  async setAvatar(id: string, avatar: Record<string, string>) {
    const profile = await this.findStoredProfile(id);
    const structuredData = this.structuredData(profile.structuredData);
    const user = await this.prisma.user.findUnique({
      where: { id: profile.userId },
      select: { avatar: true },
    });
    const previousAvatar = this.avatarData(user?.avatar) ?? structuredData.avatar ?? null;
    const { avatar: _legacyAvatar, ...remainingData } = structuredData;
    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: profile.userId },
        data: { avatar },
      }),
      this.prisma.candidateProfile.update({
        where: { id: profile.id },
        data: { structuredData: remainingData },
      }),
    ]);

    return {
      avatar,
      previousAvatar,
      updatedAt: updatedUser.updatedAt,
    };
  }

  async removeAvatar(id: string) {
    const profile = await this.findStoredProfile(id);
    const structuredData = this.structuredData(profile.structuredData);
    const { avatar: previousAvatar, ...remainingData } = structuredData;
    const user = await this.prisma.user.findUnique({
      where: { id: profile.userId },
      select: { avatar: true },
    });
    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: profile.userId },
        data: { avatar: Prisma.JsonNull },
      }),
      this.prisma.candidateProfile.update({
        where: { id: profile.id },
        data: { structuredData: remainingData },
      }),
    ]);

    return {
      previousAvatar: this.avatarData(user?.avatar) ?? previousAvatar ?? null,
      updatedAt: updatedUser.updatedAt,
    };
  }
}
