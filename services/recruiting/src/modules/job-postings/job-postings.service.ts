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

  async create(payload: CreateJobPostingInput) {
    const { requestId, title, description, requirements, visibility, expireDate } = payload;

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

    return this.prisma.jobPosting.create({
      data: {
        requestId,
        title: mappedTitle,
        description: mappedDescription,
        requirements: mappedRequirements,
        visibility: visibility || JobVisibility.PRIVATE,
        status: JobPostingStatus.DRAFT,
        expireDate: expireDate ? new Date(expireDate) : null,
      },
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
    const { status, visibility, search, userRole, userDeptId } = query;
    const where: any = {};

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
    } else if (userRole === UserRole.DEPARTMENT_HEAD) {
      // Department Heads can see their department's postings OR any PUBLIC + PUBLISHED postings
      if (userDeptId) {
        where.OR = [
          { request: { departmentId: userDeptId } },
          {
            AND: [{ status: JobPostingStatus.PUBLISHED }, { visibility: JobVisibility.PUBLIC }],
          },
        ];
      } else {
        // Fallback if departmentId is not set
        where.status = JobPostingStatus.PUBLISHED;
        where.visibility = JobVisibility.PUBLIC;
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
    const { id, userRole, userDeptId } = payload;

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
      if (
        jobPosting.status !== JobPostingStatus.PUBLISHED ||
        jobPosting.visibility !== JobVisibility.PUBLIC
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
        jobPosting.visibility === JobVisibility.PUBLIC;

      if (!isOwnDept && !isPublicPublished) {
        throw new RpcException({
          status: HttpStatus.FORBIDDEN,
          message: 'You are not authorized to view this job posting',
        });
      }
    }

    return jobPosting;
  }

  async update(id: string, data: UpdateJobPostingInput) {
    const existing = await this.prisma.jobPosting.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Job posting with ID ${id} not found`,
      });
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.requirements !== undefined) updateData.requirements = data.requirements as any;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.expireDate !== undefined) {
      updateData.expireDate = data.expireDate ? new Date(data.expireDate) : null;
    }
    if (data.status !== undefined) updateData.status = data.status;

    return this.prisma.jobPosting.update({
      where: { id },
      data: updateData,
      include: {
        request: true,
      },
    });
  }

  async publish(id: string) {
    const existing = await this.prisma.jobPosting.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Job posting with ID ${id} not found`,
      });
    }

    return this.prisma.jobPosting.update({
      where: { id },
      data: {
        status: JobPostingStatus.PUBLISHED,
      },
      include: {
        request: true,
      },
    });
  }

  async close(id: string) {
    const existing = await this.prisma.jobPosting.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Job posting with ID ${id} not found`,
      });
    }

    return this.prisma.jobPosting.update({
      where: { id },
      data: {
        status: JobPostingStatus.CLOSED,
      },
      include: {
        request: true,
      },
    });
  }
}
