import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { JobPostingStatus, JobVisibility, RecruitmentRequestStatus } from '@wr/contracts';
import { PrismaService } from '../../common/database/prisma.service';
import { JobPostingsService } from './job-postings.service';

describe('JobPostingsService', () => {
  let service: JobPostingsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    recruitmentRequest: {
      findUnique: jest.fn(),
    },
    jobPosting: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const activeRequest = {
    id: 'request-1',
    position: 'Senior Backend Engineer',
    jobDescription: 'Build and maintain recruiting services.',
    skillRequirements: { skills: ['TypeScript', 'PostgreSQL'] },
    status: RecruitmentRequestStatus.ACTIVE,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobPostingsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get(JobPostingsService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a private draft from an active campaign using request defaults', async () => {
      const createdPosting = { id: 'posting-1', requestId: activeRequest.id };
      mockPrismaService.recruitmentRequest.findUnique.mockResolvedValue(activeRequest);
      mockPrismaService.jobPosting.findUnique.mockResolvedValue(null);
      mockPrismaService.jobPosting.create.mockResolvedValue(createdPosting);

      const result = await service.create({
        requestId: activeRequest.id,
      } as any);

      expect(prisma.recruitmentRequest.findUnique).toHaveBeenCalledWith({
        where: { id: activeRequest.id },
      });
      expect(prisma.jobPosting.create).toHaveBeenCalledWith({
        data: {
          requestId: activeRequest.id,
          title: activeRequest.position,
          description: activeRequest.jobDescription,
          requirements: activeRequest.skillRequirements,
          visibility: JobVisibility.PRIVATE,
          status: JobPostingStatus.DRAFT,
          expireDate: null,
        },
        include: { request: true },
      });
      expect(result).toBe(createdPosting);
    });

    it('persists public visibility, custom content, and the expiration date', async () => {
      const expireDate = '2026-07-31T17:00:00.000Z';
      const requirements = { skills: ['NestJS'], experienceYears: 3 };
      mockPrismaService.recruitmentRequest.findUnique.mockResolvedValue(activeRequest);
      mockPrismaService.jobPosting.findUnique.mockResolvedValue(null);
      mockPrismaService.jobPosting.create.mockResolvedValue({ id: 'posting-1' });

      await service.create({
        requestId: activeRequest.id,
        title: 'Platform Engineer',
        description: 'Own the recruiting platform.',
        requirements,
        visibility: JobVisibility.PUBLIC,
        expireDate,
      });

      expect(prisma.jobPosting.create).toHaveBeenCalledWith({
        data: {
          requestId: activeRequest.id,
          title: 'Platform Engineer',
          description: 'Own the recruiting platform.',
          requirements,
          visibility: JobVisibility.PUBLIC,
          status: JobPostingStatus.DRAFT,
          expireDate: new Date(expireDate),
        },
        include: { request: true },
      });
    });

    it.each([
      RecruitmentRequestStatus.ACTIVE,
      RecruitmentRequestStatus.SCREENING,
      RecruitmentRequestStatus.INTERVIEWING,
      RecruitmentRequestStatus.OFFER_EXTENDED,
      RecruitmentRequestStatus.OFFER_ACCEPTED,
    ])('allows creation for active execution status %s', async (status) => {
      mockPrismaService.recruitmentRequest.findUnique.mockResolvedValue({
        ...activeRequest,
        status,
      });
      mockPrismaService.jobPosting.findUnique.mockResolvedValue(null);
      mockPrismaService.jobPosting.create.mockResolvedValue({ id: 'posting-1' });

      await expect(
        service.create({
          requestId: activeRequest.id,
          requirements: {},
          visibility: JobVisibility.PRIVATE,
        }),
      ).resolves.toEqual({ id: 'posting-1' });
    });

    it('rejects creation when requestId is missing', async () => {
      await expect(
        service.create({
          requestId: '',
          requirements: {},
          visibility: JobVisibility.PRIVATE,
        }),
      ).rejects.toThrow(
        new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'requestId is required',
        }),
      );

      expect(prisma.recruitmentRequest.findUnique).not.toHaveBeenCalled();
    });

    it('rejects creation when the recruitment request does not exist', async () => {
      mockPrismaService.recruitmentRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          requestId: 'missing-request',
          requirements: {},
          visibility: JobVisibility.PRIVATE,
        }),
      ).rejects.toThrow(
        new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'Recruitment request with ID missing-request not found',
        }),
      );

      expect(prisma.jobPosting.findUnique).not.toHaveBeenCalled();
      expect(prisma.jobPosting.create).not.toHaveBeenCalled();
    });

    it.each([
      RecruitmentRequestStatus.DRAFT,
      RecruitmentRequestStatus.APPROVED,
      RecruitmentRequestStatus.PLANNING,
      RecruitmentRequestStatus.PLAN_APPROVED,
      RecruitmentRequestStatus.PENDING_REVIEW,
      RecruitmentRequestStatus.REJECTED,
      RecruitmentRequestStatus.REVISION_NEEDED,
      RecruitmentRequestStatus.CLOSED,
      RecruitmentRequestStatus.CANCELLED,
    ])('rejects unapproved workflow status %s', async (status) => {
      mockPrismaService.recruitmentRequest.findUnique.mockResolvedValue({
        ...activeRequest,
        status,
      });

      await expect(
        service.create({
          requestId: activeRequest.id,
          requirements: {},
          visibility: JobVisibility.PRIVATE,
        }),
      ).rejects.toThrow(
        new RpcException({
          status: HttpStatus.PRECONDITION_FAILED,
          message: `Campaign must be active to create a job posting. Current status: ${status}`,
        }),
      );

      expect(prisma.jobPosting.findUnique).not.toHaveBeenCalled();
      expect(prisma.jobPosting.create).not.toHaveBeenCalled();
    });

    it('rejects a second posting for the same recruitment request', async () => {
      mockPrismaService.recruitmentRequest.findUnique.mockResolvedValue(activeRequest);
      mockPrismaService.jobPosting.findUnique.mockResolvedValue({ id: 'existing-posting' });

      await expect(
        service.create({
          requestId: activeRequest.id,
          requirements: {},
          visibility: JobVisibility.PRIVATE,
        }),
      ).rejects.toThrow(
        new RpcException({
          status: HttpStatus.CONFLICT,
          message: `A job posting already exists for recruitment request ${activeRequest.id}`,
        }),
      );

      expect(prisma.jobPosting.create).not.toHaveBeenCalled();
    });
  });
});
