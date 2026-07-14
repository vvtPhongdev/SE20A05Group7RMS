import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import {
  CreateJobPostingInput,
  UpdateJobPostingInput,
  JobVisibility,
  JobPostingStatus,
  RecruitmentRequestStatus,
  UserRole,
} from '@wr/contracts';

@Injectable()
export class JobPostingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertCanManagePostingForTask(posting: { requestId: string }, payload: {
    actorUserId?: string;
    actorRole?: string;
  }) {
    void posting;
    void payload;
  }

  private getActivePostingWindowWhere(now = new Date()) {
    return [
      { OR: [{ startDate: null }, { startDate: { lte: now } }] },
      { OR: [{ expireDate: null }, { expireDate: { gt: now } }] },
    ];
  }

  private async closeInactivePostings(now = new Date()) {
    await this.prisma.jobPosting.updateMany({
      where: {
        status: { in: [JobPostingStatus.DRAFT, JobPostingStatus.PUBLISHED] },
        OR: [
          { expireDate: { lte: now } },
          { request: { status: RecruitmentRequestStatus.COMPLETED } },
        ],
      },
      data: { status: JobPostingStatus.CLOSED },
    });
  }

  private parseSchedule(startDate?: string | null, expireDate?: string | null) {
    const start = startDate ? new Date(startDate) : null;
    const end = expireDate ? new Date(expireDate) : null;

    if (start && isNaN(start.getTime())) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'startDate must be a valid date',
      });
    }

    if (end && isNaN(end.getTime())) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'expireDate must be a valid date',
      });
    }

    if (start && end && end <= start) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'expireDate must be after startDate',
      });
    }

    return { start, end };
  }

  async create(payload: CreateJobPostingInput) {
    const { requestId, title, description, requirements, visibility, startDate, expireDate } =
      payload;

    if (!requestId) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'requestId is required',
      });
    }

    // 1. Fetch recruitment request and verify existence
    const request = await this.prisma.recruitmentRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Recruitment request with ID ${requestId} not found`,
      });
    }

    // 2. Verify campaign execution has started.
    const allowedStatuses = [
      RecruitmentRequestStatus.ACTIVE,
      RecruitmentRequestStatus.SCREENING,
      RecruitmentRequestStatus.INTERVIEWING,
      RecruitmentRequestStatus.OFFER_EXTENDED,
      RecruitmentRequestStatus.OFFER_ACCEPTED,
    ];

    if (!allowedStatuses.includes(request.status as RecruitmentRequestStatus)) {
      throw new RpcException({
        status: HttpStatus.PRECONDITION_FAILED,
        message: `Campaign must be active to create a job posting. Current status: ${request.status}`,
      });
    }

    // 3. Check if a JobPosting already exists for this requestId
    const existing = await this.prisma.jobPosting.findUnique({
      where: { requestId },
    });

    if (existing) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: `A job posting already exists for recruitment request ${requestId}`,
      });
    }

    // 4. Create Job Posting with defaults from recruitment request if needed
    const mappedTitle = title || request.position;
    const mappedDescription = description || request.jobDescription;
    const mappedRequirements = (requirements || request.skillRequirements || {}) as any;

    if (!startDate || !expireDate) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'startDate and expireDate are required',
      });
    }

    const { start, end } = this.parseSchedule(startDate, expireDate);

    return this.prisma.jobPosting.create({
      data: {
        requestId,
        title: mappedTitle,
        description: mappedDescription,
        requirements: mappedRequirements,
        visibility: visibility || JobVisibility.PRIVATE,
        status: JobPostingStatus.DRAFT,
        startDate: start,
        expireDate: end,
      } as any,
      include: {
        request: true,
      },
    });
  }

  async list(query: {
    status?: string;
    visibility?: string;
    search?: string;
    userRole?: string;
    userDeptId?: string;
  }) {
    await this.closeInactivePostings();

    const { status, visibility, search, userRole, userDeptId } = query;
    const where: any = {};
    const activeWindowWhere = this.getActivePostingWindowWhere();

    // Apply status and visibility filters if specified
    if (status) {
      where.status = status;
    }
    if (visibility) {
      where.visibility = visibility;
    }

    // Search filter case-insensitive
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Role-based visibility logic
    if (userRole === UserRole.CANDIDATE) {
      // Candidates can only see PUBLISHED and PUBLIC job postings
      where.status = JobPostingStatus.PUBLISHED;
      where.visibility = JobVisibility.PUBLIC;
      where.AND = [...(where.AND ?? []), ...activeWindowWhere];
    } else if (userRole === UserRole.DEPARTMENT_HEAD) {
      // Department Heads can see their department's postings OR any PUBLIC + PUBLISHED postings
      if (userDeptId) {
        where.OR = [
          { request: { departmentId: userDeptId } },
          {
            AND: [
              { status: JobPostingStatus.PUBLISHED },
              { visibility: JobVisibility.PUBLIC },
              ...activeWindowWhere,
            ],
          },
        ];
      } else {
        // Fallback if departmentId is not set
        where.status = JobPostingStatus.PUBLISHED;
        where.visibility = JobVisibility.PUBLIC;
        where.AND = [...(where.AND ?? []), ...activeWindowWhere];
      }
    }
    // Admin and HR Manager see everything without restrictions (except custom filters)

    return this.prisma.jobPosting.findMany({
      where,
      include: {
        request: {
          include: {
            department: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async get(payload: { id: string; userRole?: string; userDeptId?: string }) {
    await this.closeInactivePostings();

    const { id, userRole, userDeptId } = payload;
    const now = new Date();

    const jobPosting = await this.prisma.jobPosting.findUnique({
      where: { id },
      include: {
        request: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!jobPosting) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Job posting with ID ${id} not found`,
      });
    }

    // Authorize based on roles & visibility
    if (userRole === UserRole.CANDIDATE) {
      const startDate = (jobPosting as any).startDate as Date | null | undefined;
      const expireDate = jobPosting.expireDate;
      if (
        jobPosting.status !== JobPostingStatus.PUBLISHED ||
        jobPosting.visibility !== JobVisibility.PUBLIC ||
        (startDate && startDate > now) ||
        (expireDate && expireDate <= now)
      ) {
        throw new RpcException({
          status: HttpStatus.FORBIDDEN,
          message: 'You are not authorized to view this job posting',
        });
      }
    } else if (userRole === UserRole.DEPARTMENT_HEAD) {
      const isOwnDept = jobPosting.request.departmentId === userDeptId;
      const isPublicPublished =
        jobPosting.status === JobPostingStatus.PUBLISHED &&
        jobPosting.visibility === JobVisibility.PUBLIC &&
        !((jobPosting as any).startDate && (jobPosting as any).startDate > now) &&
        !(jobPosting.expireDate && jobPosting.expireDate <= now);

      if (!isOwnDept && !isPublicPublished) {
        throw new RpcException({
          status: HttpStatus.FORBIDDEN,
          message: 'You are not authorized to view this job posting',
        });
      }
    }

    return jobPosting;
  }

  async update(
    id: string,
    data: UpdateJobPostingInput & { actorUserId?: string; actorRole?: string },
  ) {
    const existing = await this.prisma.jobPosting.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Job posting with ID ${id} not found`,
      });
    }

    await this.assertCanManagePostingForTask(existing, data);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.requirements !== undefined) updateData.requirements = data.requirements as any;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.expireDate !== undefined) {
      updateData.expireDate = data.expireDate ? new Date(data.expireDate) : null;
    }
    if (data.status !== undefined) updateData.status = data.status;

    if (data.startDate !== undefined || data.expireDate !== undefined) {
      const nextStart = data.startDate ?? ((existing as any).startDate?.toISOString() || null);
      const nextEnd = data.expireDate ?? (existing.expireDate?.toISOString() || null);
      this.parseSchedule(nextStart, nextEnd);
    }

    return this.prisma.jobPosting.update({
      where: { id },
      data: updateData as any,
      include: {
        request: true,
      },
    });
  }

  async publish(payload: string | { id: string; actorUserId?: string; actorRole?: string }) {
    const normalized = typeof payload === 'string' ? { id: payload } : payload;
    const existing = await this.prisma.jobPosting.findUnique({
      where: { id: normalized.id },
    });

    if (!existing) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Job posting with ID ${normalized.id} not found`,
      });
    }

    await this.assertCanManagePostingForTask(existing, normalized);

    const now = new Date();
    const startDate = (existing as any).startDate as Date | null | undefined;
    if (!startDate || !existing.expireDate) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Job posting startDate and expireDate are required before publishing',
      });
    }
    if (existing.expireDate <= now) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Cannot publish an expired job posting',
      });
    }

    return this.prisma.jobPosting.update({
      where: { id: normalized.id },
      data: {
        status: JobPostingStatus.PUBLISHED,
      },
      include: {
        request: true,
      },
    });
  }

  async close(payload: string | { id: string; actorUserId?: string; actorRole?: string }) {
    const normalized = typeof payload === 'string' ? { id: payload } : payload;
    const existing = await this.prisma.jobPosting.findUnique({
      where: { id: normalized.id },
    });

    if (!existing) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Job posting with ID ${normalized.id} not found`,
      });
    }

    await this.assertCanManagePostingForTask(existing, normalized);

    return this.prisma.jobPosting.update({
      where: { id: normalized.id },
      data: {
        status: JobPostingStatus.CLOSED,
      },
      include: {
        request: true,
      },
    });
  }
}
