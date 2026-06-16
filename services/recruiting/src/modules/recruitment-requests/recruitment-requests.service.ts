import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Prisma } from '@prisma/client';
import { RecruitmentRequestStatus, UserRole } from '@wr/contracts';
import { PrismaService } from '../../common/database/prisma.service';

export type UUID = string;

export interface RecruitmentRequest {
  id: UUID;
  positionTitle: string;
  jdText: string;
  headcount: number;
  urgency: string;
  justification: string;
  departmentId: string;
  createdBy: string;
  status: RecruitmentRequestStatus;
  createdAt: string;
  logs: RequestLog[];
}

export interface RequestLog {
  timestamp: string;
  actorId: string;
  previousStatus: RecruitmentRequestStatus | null;
  newStatus: RecruitmentRequestStatus;
  notes?: string;
}

@Injectable()
export class RecruitmentRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  store = new Map<string, RecruitmentRequest>();

  logTransition(
    req: RecruitmentRequest,
    actorId: string,
    previous: RecruitmentRequestStatus | null,
    next: RecruitmentRequestStatus,
    notes?: string,
  ) {
    const entry: RequestLog = {
      timestamp: new Date().toISOString(),
      actorId,
      previousStatus: previous,
      newStatus: next,
      notes,
    };
    if (!req.logs) req.logs = [];
    req.logs.push(entry);
  }

  async listForAdmin(payload: {
    page?: number;
    limit?: number;
    status?: string;
    departmentId?: string;
    urgency?: string;
    q?: string;
    reviewedById?: string;
  }) {
    const page = Math.max(1, Number(payload.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(payload.limit) || 50));
    const where: any = {};

    if (payload.status) where.status = payload.status;
    if (payload.departmentId) where.departmentId = payload.departmentId;
    if (payload.urgency) where.urgency = payload.urgency;
    if (payload.reviewedById) where.reviewedById = payload.reviewedById;
    if (payload.q?.trim()) {
      where.OR = [
        { position: { contains: payload.q.trim(), mode: 'insensitive' } },
        { createdBy: { displayName: { contains: payload.q.trim(), mode: 'insensitive' } } },
        { reviewedBy: { displayName: { contains: payload.q.trim(), mode: 'insensitive' } } },
      ];
    }

    const [total, requests] = await Promise.all([
      this.prisma.recruitmentRequest.count({ where }),
      this.prisma.recruitmentRequest.findMany({
        where,
        include: {
          department: {
            select: { id: true, name: true, code: true },
          },
          createdBy: {
            select: { id: true, displayName: true },
          },
          reviewedBy: {
            select: { id: true, displayName: true },
          },
          applications: {
            select: { status: true },
          },
          overallPlan: {
            select: {
              id: true,
              status: true,
              startDate: true,
              endDate: true,
              revisionNotes: true,
              updatedAt: true,
              createdBy: { select: { id: true, displayName: true } },
              approvedBy: { select: { id: true, displayName: true } },
              _count: { select: { tasks: true } },
            },
          },
          logs: {
            where: {
              action: {
                in: [
                  'CREATED',
                  'SUBMITTED_FOR_REVIEW',
                  'RESUBMITTED_FOR_REVIEW',
                  'HR_FORWARDED_TO_ADMIN',
                ],
              },
            },
            select: {
              action: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: requests.map((request) => {
        const latestSubmission = request.logs.find((log) =>
          ['CREATED', 'SUBMITTED_FOR_REVIEW', 'RESUBMITTED_FOR_REVIEW'].includes(log.action),
        );
        const latestForward = request.logs.find((log) => log.action === 'HR_FORWARDED_TO_ADMIN');
        const forwardedToAdmin = Boolean(
          latestForward &&
          (!latestSubmission || latestForward.createdAt > latestSubmission.createdAt),
        );

        return {
          id: request.id,
          position: request.position,
          department: request.department,
          requester: request.createdBy,
          owner: request.reviewedBy,
          status: request.status,
          urgency: request.urgency,
          headcount: request.headcount,
          filledHeadcount: request.applications.filter(
            (application) => application.status === 'OFFER_ACCEPTED',
          ).length,
          jobDescription: request.jobDescription,
          skillRequirements: request.skillRequirements,
          justification: request.justification,
          overallPlan: request.overallPlan,
          forwardedToAdmin,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
        };
      }),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getByIdForActor(payload: { id: string; userId: string; role: UserRole }) {
    const request = await this.prisma.recruitmentRequest.findUnique({
      where: { id: payload.id },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, displayName: true },
        },
        reviewedBy: {
          select: { id: true, displayName: true },
        },
        overallPlan: true,
        logs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!request) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Recruitment request with ID ${payload.id} not found`,
      });
    }

    const canAccess =
      payload.role === UserRole.ADMIN ||
      (payload.role === UserRole.DEPARTMENT_HEAD && request.createdById === payload.userId) ||
      (payload.role === UserRole.HR_LEADER && request.reviewedById === payload.userId) ||
      payload.role === UserRole.HR_RECRUITER;

    if (!canAccess) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'You do not have permission to view this recruitment request',
      });
    }

    return request;
  }

  async createForDepartmentHead(payload: {
    positionTitle: string;
    headcount: number;
    jobDescription: string;
    justification: string;
    urgency: string;
    skillRequirements?: Record<string, unknown>;
    createdById: string;
    submit?: boolean;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.createdById },
      select: { departmentId: true },
    });

    if (!user?.departmentId) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Your account is not assigned to a department',
      });
    }

    const status = payload.submit
      ? RecruitmentRequestStatus.PENDING_REVIEW
      : RecruitmentRequestStatus.DRAFT;

    const created = await this.prisma.recruitmentRequest.create({
      data: {
        departmentId: user.departmentId,
        createdById: payload.createdById,
        position: payload.positionTitle,
        headcount: payload.headcount,
        jobDescription: payload.jobDescription,
        skillRequirements: (payload.skillRequirements ?? {}) as Prisma.InputJsonValue,
        justification: payload.justification,
        urgency: payload.urgency,
        status,
      },
    });

    await this.prisma.requestLog.create({
      data: {
        requestId: created.id,
        action: 'CREATED',
        toStatus: status,
        performedById: payload.createdById,
      },
    });

    return created;
  }

  async updateForDepartmentHead(payload: {
    id: string;
    userId: string;
    role?: string;
    positionTitle?: string;
    headcount?: number;
    jobDescription?: string;
    justification?: string;
    urgency?: string;
    skillRequirements?: Record<string, unknown>;
  }) {
    const request = await this.prisma.recruitmentRequest.findUnique({
      where: { id: payload.id },
    });

    if (!request) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Recruitment request with ID ${payload.id} not found`,
      });
    }

    const isOwner = request.createdById === payload.userId;
    const isHrLeader = payload.role === 'HR_LEADER';

    if (!isOwner && !isHrLeader) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'You are not authorized to update this recruitment request',
      });
    }

    if (isHrLeader) {
      if (
        request.status === RecruitmentRequestStatus.DRAFT ||
        request.status === RecruitmentRequestStatus.APPROVED ||
        request.status === RecruitmentRequestStatus.REJECTED ||
        request.status === RecruitmentRequestStatus.CLOSED ||
        request.status === RecruitmentRequestStatus.CANCELLED
      ) {
        throw new RpcException({
          status: HttpStatus.CONFLICT,
          message: `HR Leaders cannot update requests in status ${request.status}`,
        });
      }
    } else {
      if (
        request.status !== RecruitmentRequestStatus.DRAFT &&
        request.status !== RecruitmentRequestStatus.REVISION_NEEDED
      ) {
        throw new RpcException({
          status: HttpStatus.CONFLICT,
          message: 'Only draft requests or requests needing revision can be updated',
        });
      }
    }

    const updated = await this.prisma.recruitmentRequest.update({
      where: { id: payload.id },
      data: {
        position: payload.positionTitle,
        headcount: payload.headcount,
        jobDescription: payload.jobDescription,
        justification: payload.justification,
        urgency: payload.urgency,
        skillRequirements:
          payload.skillRequirements === undefined
            ? undefined
            : (payload.skillRequirements as Prisma.InputJsonValue),
      },
    });

    await this.prisma.requestLog.create({
      data: {
        requestId: payload.id,
        action: 'UPDATED',
        performedById: payload.userId,
      },
    });

    return updated;
  }

  async submitDraft(payload: { id: string; userId: string }) {
    const request = await this.prisma.recruitmentRequest.findUnique({
      where: { id: payload.id },
    });

    if (!request) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Recruitment request with ID ${payload.id} not found`,
      });
    }
    if (request.createdById !== payload.userId) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'You can only submit your own recruitment requests',
      });
    }
    if (
      request.status !== RecruitmentRequestStatus.DRAFT &&
      request.status !== RecruitmentRequestStatus.REVISION_NEEDED
    ) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: 'Only draft requests or requests needing revision can be submitted',
      });
    }

    const previousStatus = request.status as RecruitmentRequestStatus;
    const [updated] = await this.prisma.$transaction([
      this.prisma.recruitmentRequest.update({
        where: { id: payload.id },
        data: {
          status: RecruitmentRequestStatus.PENDING_REVIEW,
          rejectionReason: null,
        },
      }),
      this.prisma.requestLog.create({
        data: {
          requestId: payload.id,
          action:
            previousStatus === RecruitmentRequestStatus.REVISION_NEEDED
              ? 'RESUBMITTED_FOR_REVIEW'
              : 'SUBMITTED_FOR_REVIEW',
          fromStatus: previousStatus,
          toStatus: RecruitmentRequestStatus.PENDING_REVIEW,
          performedById: payload.userId,
        },
      }),
    ]);

    return updated;
  }

  async assignToHr(payload: { id: string; hrManagerId: string; assignedById: string }) {
    const [request, hrManager] = await Promise.all([
      this.prisma.recruitmentRequest.findUnique({ where: { id: payload.id } }),
      this.prisma.user.findUnique({ where: { id: payload.hrManagerId } }),
    ]);

    if (!request) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Recruitment request with ID ${payload.id} not found`,
      });
    }
    if (!hrManager || hrManager.role !== UserRole.HR_LEADER || !hrManager.isActive) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'The selected user must be an active HR Leader',
      });
    }

    const updated = await this.prisma.recruitmentRequest.update({
      where: { id: payload.id },
      data: { reviewedById: hrManager.id },
      include: {
        reviewedBy: {
          select: { id: true, displayName: true },
        },
      },
    });

    await this.prisma.requestLog.create({
      data: {
        requestId: payload.id,
        action: 'ASSIGNED_TO_HR',
        performedById: payload.assignedById,
        metadata: {
          hrManagerId: hrManager.id,
          hrManagerName: hrManager.displayName,
        },
      },
    });

    return updated;
  }

  async decide(payload: {
    id: string;
    decision: 'APPROVED' | 'REJECTED';
    comments?: string;
    adminId: string;
    role?: string;
  }) {
    const request = await this.prisma.recruitmentRequest.findUnique({
      where: { id: payload.id },
    });

    if (!request) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Recruitment request with ID ${payload.id} not found`,
      });
    }
    if (request.status !== RecruitmentRequestStatus.PENDING_REVIEW) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: `Only requests in ${RecruitmentRequestStatus.PENDING_REVIEW} can be decided`,
      });
    }
    if (!request.reviewedById) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: 'The request must be assigned to an HR manager before an Admin decision',
      });
    }

    const isHrLeader = payload.role === 'HR_LEADER';
    if (isHrLeader) {
      if (payload.decision !== 'REJECTED') {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'HR Leaders can only reject recruitment requests, not approve them directly',
        });
      }
      if (request.reviewedById !== payload.adminId) {
        throw new RpcException({
          status: HttpStatus.FORBIDDEN,
          message: 'You can only reject recruitment requests assigned to you',
        });
      }
    } else {
      const [latestSubmission, latestForward] = await Promise.all([
        this.prisma.requestLog.findFirst({
          where: {
            requestId: payload.id,
            action: {
              in: ['CREATED', 'SUBMITTED_FOR_REVIEW', 'RESUBMITTED_FOR_REVIEW'],
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.requestLog.findFirst({
          where: {
            requestId: payload.id,
            action: 'HR_FORWARDED_TO_ADMIN',
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      if (
        !latestForward ||
        (latestSubmission && latestForward.createdAt <= latestSubmission.createdAt)
      ) {
        throw new RpcException({
          status: HttpStatus.CONFLICT,
          message: 'The assigned HR manager must forward the request before an Admin decision',
        });
      }
    }

    if (payload.decision === 'REJECTED' && !payload.comments?.trim()) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Rejection comments are required',
      });
    }

    const comments = payload.comments?.trim() || null;
    const [updated] = await this.prisma.$transaction([
      this.prisma.recruitmentRequest.update({
        where: { id: payload.id },
        data: {
          status: payload.decision,
          approvedById: isHrLeader ? null : payload.adminId,
          rejectionReason: payload.decision === 'REJECTED' ? comments : null,
        },
      }),
      this.prisma.approvalRecord.create({
        data: {
          requestId: payload.id,
          approverId: payload.adminId,
          decision: payload.decision,
          comments,
        },
      }),
      this.prisma.requestLog.create({
        data: {
          requestId: payload.id,
          action: isHrLeader ? 'HR_REQUEST_DECISION' : 'ADMIN_REQUEST_DECISION',
          fromStatus: request.status,
          toStatus: payload.decision,
          performedById: payload.adminId,
          metadata: { comments },
        },
      }),
    ]);

    return updated;
  }

  async requestChanges(payload: {
    id: string;
    adminId: string;
    feedback: string;
    positionTitle?: string;
    headcount?: number;
    jobDescription?: string;
    justification?: string;
    urgency?: string;
    skillRequirements?: Record<string, unknown>;
  }) {
    const request = await this.prisma.recruitmentRequest.findUnique({
      where: { id: payload.id },
    });

    if (!request) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Recruitment request with ID ${payload.id} not found`,
      });
    }
    if (request.status !== RecruitmentRequestStatus.PENDING_REVIEW) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: `Only requests in ${RecruitmentRequestStatus.PENDING_REVIEW} can be returned for changes`,
      });
    }
    if (!payload.feedback?.trim()) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Change request feedback is required',
      });
    }

    const feedback = payload.feedback.trim();
    const proposedChanges = {
      positionTitle: payload.positionTitle,
      headcount: payload.headcount,
      jobDescription: payload.jobDescription,
      justification: payload.justification,
      urgency: payload.urgency,
      skillRequirements: payload.skillRequirements,
    };

    const [updated] = await this.prisma.$transaction([
      this.prisma.recruitmentRequest.update({
        where: { id: payload.id },
        data: {
          position: payload.positionTitle,
          headcount: payload.headcount,
          jobDescription: payload.jobDescription,
          justification: payload.justification,
          urgency: payload.urgency,
          skillRequirements:
            payload.skillRequirements === undefined
              ? undefined
              : (payload.skillRequirements as Prisma.InputJsonValue),
          status: RecruitmentRequestStatus.REVISION_NEEDED,
          rejectionReason: feedback,
          approvedById: null,
        },
      }),
      this.prisma.approvalRecord.create({
        data: {
          requestId: payload.id,
          approverId: payload.adminId,
          decision: RecruitmentRequestStatus.REVISION_NEEDED,
          comments: feedback,
        },
      }),
      this.prisma.requestLog.create({
        data: {
          requestId: payload.id,
          action: 'ADMIN_REQUESTED_CHANGES',
          fromStatus: RecruitmentRequestStatus.PENDING_REVIEW,
          toStatus: RecruitmentRequestStatus.REVISION_NEEDED,
          performedById: payload.adminId,
          metadata: {
            feedback,
            proposedChanges: proposedChanges as any,
          } as Prisma.InputJsonValue,
        },
      }),
    ]);

    return updated;
  }

  async forwardToAdmin(payload: { id: string; hrManagerId: string }) {
    const request = await this.prisma.recruitmentRequest.findUnique({
      where: { id: payload.id },
    });

    if (!request) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Recruitment request with ID ${payload.id} not found`,
      });
    }
    if (request.reviewedById !== payload.hrManagerId) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'You can only forward recruitment requests assigned to you',
      });
    }
    if (request.status !== RecruitmentRequestStatus.PENDING_REVIEW) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: `Only requests in ${RecruitmentRequestStatus.PENDING_REVIEW} status can be forwarded`,
      });
    }

    await this.prisma.requestLog.create({
      data: {
        requestId: payload.id,
        action: 'HR_FORWARDED_TO_ADMIN',
        fromStatus: RecruitmentRequestStatus.PENDING_REVIEW,
        toStatus: RecruitmentRequestStatus.PENDING_REVIEW,
        performedById: payload.hrManagerId,
      },
    });

    return request;
  }

  async returnForRevision(payload: { id: string; hrManagerId: string; feedback: string }) {
    const request = await this.prisma.recruitmentRequest.findUnique({
      where: { id: payload.id },
    });

    if (!request) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Recruitment request with ID ${payload.id} not found`,
      });
    }
    if (request.reviewedById !== payload.hrManagerId) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'You can only return recruitment requests assigned to you',
      });
    }
    if (request.status !== RecruitmentRequestStatus.PENDING_REVIEW) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: `Only requests in ${RecruitmentRequestStatus.PENDING_REVIEW} status can be returned for revision`,
      });
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.recruitmentRequest.update({
        where: { id: payload.id },
        data: {
          status: RecruitmentRequestStatus.REVISION_NEEDED,
          rejectionReason: payload.feedback,
        },
      }),
      this.prisma.requestLog.create({
        data: {
          requestId: payload.id,
          action: 'HR_RETURNED_FOR_REVISION',
          fromStatus: RecruitmentRequestStatus.PENDING_REVIEW,
          toStatus: RecruitmentRequestStatus.REVISION_NEEDED,
          performedById: payload.hrManagerId,
          metadata: { feedback: payload.feedback },
        },
      }),
    ]);

    return updated;
  }
}
