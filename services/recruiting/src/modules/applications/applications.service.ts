import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import {
  isHrRole,
  JobPostingStatus,
  JobVisibility,
  PlanStatus,
  RecruitmentRequestStatus,
  TaskType,
  UserRole,
} from '@wr/contracts';
import { PrismaService } from '../../common/database/prisma.service';

const APPLICATION_OPEN_REQUEST_STATUSES = [
  RecruitmentRequestStatus.ACTIVE,
  RecruitmentRequestStatus.SCREENING,
  RecruitmentRequestStatus.INTERVIEWING,
  RecruitmentRequestStatus.DECISION_PENDING,
  RecruitmentRequestStatus.INTERVIEW_COMPLETED,
  RecruitmentRequestStatus.OFFER_EXTENDED,
] as const;

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly applicationInclude = {
    request: true,
    candidate: {
      include: {
        cvDocuments: {
          orderBy: { createdAt: 'desc' as const },
          take: 1,
          select: { screeningStatus: true },
        },
      },
    },
    collectedBy: {
      select: { id: true, displayName: true, email: true },
    },
  };

  private async resolveCollectedById(payload: {
    requestId: string;
    actorUserId?: string;
    actorRole?: string;
  }) {
    if (isHrRole(payload.actorRole) && payload.actorUserId) {
      return payload.actorUserId;
    }

    const collectionTask = await this.prisma.taskPlan.findFirst({
      where: {
        taskType: TaskType.CV_COLLECTION,
        overallPlan: { requestId: payload.requestId },
      },
      orderBy: { createdAt: 'asc' },
      select: { assignedToId: true },
    });

    return collectionTask?.assignedToId ?? null;
  }

  async create(payload: {
    requestId: string;
    candidateId?: string;
    userId?: string;
    actorUserId?: string;
    actorRole?: string;
  }) {
    const { requestId, candidateId, userId } = payload;

    if (!requestId) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'requestId is required',
      });
    }

    const request = await this.prisma.recruitmentRequest.findUnique({
      where: { id: requestId },
      include: {
        overallPlan: { select: { status: true } },
        jobPosting: {
          select: {
            status: true,
            visibility: true,
            startDate: true,
            expireDate: true,
          },
        },
      },
    });

    if (!request) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Recruitment request with ID ${requestId} not found`,
      });
    }

    if (payload.actorRole === UserRole.CANDIDATE) {
      const now = new Date();
      const posting = request.jobPosting;

      if (
        !APPLICATION_OPEN_REQUEST_STATUSES.includes(request.status as any) ||
        request.overallPlan?.status !== PlanStatus.APPROVED
      ) {
        throw new RpcException({
          status: HttpStatus.PRECONDITION_FAILED,
          message: `Applications require a started campaign and an APPROVED plan. Current request status: ${request.status}; plan status: ${request.overallPlan?.status ?? 'MISSING'}`,
        });
      }

      if (
        !posting ||
        posting.status !== JobPostingStatus.PUBLISHED ||
        posting.visibility !== JobVisibility.PUBLIC ||
        (posting.startDate && posting.startDate > now) ||
        (posting.expireDate && posting.expireDate <= now)
      ) {
        throw new RpcException({
          status: HttpStatus.PRECONDITION_FAILED,
          message: 'This job posting is not currently open for applications',
        });
      }
    }

    let candidateProfile: any = null;

    if (candidateId) {
      candidateProfile = await this.prisma.candidateProfile.findUnique({
        where: { id: candidateId },
        include: { cvDocuments: { select: { id: true }, take: 1 } },
      });
    } else if (userId) {
      candidateProfile = await this.prisma.candidateProfile.findUnique({
        where: { userId },
        include: { cvDocuments: { select: { id: true }, take: 1 } },
      });

      if (!candidateProfile) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });

        if (user && user.role === 'CANDIDATE') {
          candidateProfile = await this.prisma.candidateProfile.create({
            data: {
              userId: user.id,
              fullName: user.displayName,
              email: user.email,
              phone: user.phone || null,
              summary: '',
              structuredData: {},
            },
          });
        }
      }
    }

    if (!candidateProfile) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: 'Candidate profile not found or user is not a candidate',
      });
    }

    if (
      payload.actorRole === UserRole.CANDIDATE &&
      (candidateProfile.cvDocuments?.length ?? 0) === 0
    ) {
      throw new RpcException({
        status: HttpStatus.PRECONDITION_FAILED,
        message: 'Upload a CV before applying',
      });
    }

    const existing = await this.prisma.application.findUnique({
      where: {
        requestId_candidateId: {
          requestId,
          candidateId: candidateProfile.id,
        },
      },
    });

    if (existing) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: 'Candidate has already applied to this recruitment request',
      });
    }

    const collectedById = await this.resolveCollectedById(payload);

    return this.prisma.application.create({
      data: {
        requestId,
        candidateId: candidateProfile.id,
        collectedById,
        status: 'SUBMITTED',
      },
      include: this.applicationInclude,
    });
  }

  async list(query: {
    candidateId?: string;
    requestId?: string;
    status?: string;
    userId?: string;
    userRole?: string;
  }) {
    const { candidateId, requestId, status, userId, userRole } = query;
    const where: any = {};

    if (userRole === 'CANDIDATE' && userId) {
      where.candidate = { userId };
    } else if (candidateId) {
      where.candidateId = candidateId;
    }
    if (requestId) {
      where.requestId = requestId;
    }
    if (status) {
      where.status = status;
    }

    return this.prisma.application.findMany({
      where,
      include: this.applicationInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async get(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: this.applicationInclude,
    });

    if (!application) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Application with ID ${id} not found`,
      });
    }

    return application;
  }

  async updateStatus(id: string, status: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Application with ID ${id} not found`,
      });
    }

    return this.prisma.application.update({
      where: { id },
      data: { status },
      include: this.applicationInclude,
    });
  }
}
