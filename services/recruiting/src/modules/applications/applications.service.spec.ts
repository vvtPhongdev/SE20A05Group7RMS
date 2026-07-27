import { TaskType, UserRole } from '@wr/contracts';
import { ApplicationsService } from './applications.service';
import {
  JobPostingStatus,
  JobVisibility,
  PlanStatus,
  RecruitmentRequestStatus,
} from '@wr/contracts';

describe('ApplicationsService', () => {
  const prisma = {
    recruitmentRequest: {
      findUnique: jest.fn(),
    },
    candidateProfile: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    taskPlan: {
      findFirst: jest.fn(),
    },
    application: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const service = new ApplicationsService(prisma as any);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.recruitmentRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      status: RecruitmentRequestStatus.ACTIVE,
      overallPlan: { status: PlanStatus.APPROVED },
      jobPosting: {
        status: JobPostingStatus.PUBLISHED,
        visibility: JobVisibility.PUBLIC,
        startDate: new Date(Date.now() - 60_000),
        expireDate: new Date(Date.now() + 60_000),
      },
    });
    prisma.candidateProfile.findUnique.mockResolvedValue({
      id: 'candidate-1',
      userId: 'candidate-user-1',
      fullName: 'Candidate One',
      cvDocuments: [{ id: 'cv-1' }],
    });
    prisma.application.findUnique.mockResolvedValue(null);
    prisma.taskPlan.findFirst.mockResolvedValue({
      assignedToId: 'recruiter-1',
      taskType: TaskType.CV_COLLECTION,
    });
    prisma.application.create.mockImplementation((args: any) => ({
      id: 'application-1',
      ...args.data,
      collectedBy: args.data.collectedById
        ? {
            id: args.data.collectedById,
            displayName: 'Recruiter One',
            email: 'recruiter@example.com',
          }
        : null,
    }));
  });

  it('tracks the assigned CV collection recruiter when a candidate applies directly', async () => {
    await service.create({
      requestId: 'request-1',
      userId: 'candidate-user-1',
      actorUserId: 'candidate-user-1',
      actorRole: UserRole.CANDIDATE,
    });

    expect(prisma.taskPlan.findFirst).toHaveBeenCalledWith({
      where: {
        taskType: TaskType.CV_COLLECTION,
        overallPlan: { requestId: 'request-1' },
      },
      orderBy: { createdAt: 'asc' },
      select: { assignedToId: true },
    });
    expect(prisma.application.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requestId: 'request-1',
          candidateId: 'candidate-1',
          collectedById: 'recruiter-1',
        }),
      }),
    );
  });

  it('tracks the acting HR when they shortlist a candidate', async () => {
    await service.create({
      requestId: 'request-1',
      candidateId: 'candidate-1',
      actorUserId: 'recruiter-2',
      actorRole: UserRole.HR_LEADER,
    });

    expect(prisma.taskPlan.findFirst).not.toHaveBeenCalled();
    expect(prisma.application.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requestId: 'request-1',
          candidateId: 'candidate-1',
          collectedById: 'recruiter-2',
        }),
      }),
    );
  });

  it('rejects a candidate application before the campaign is active', async () => {
    prisma.recruitmentRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      status: RecruitmentRequestStatus.PLAN_APPROVED,
      overallPlan: { status: PlanStatus.APPROVED },
      jobPosting: {
        status: JobPostingStatus.PUBLISHED,
        visibility: JobVisibility.PUBLIC,
        startDate: new Date(Date.now() - 60_000),
        expireDate: new Date(Date.now() + 60_000),
      },
    });

    await expect(
      service.create({
        requestId: 'request-1',
        userId: 'candidate-user-1',
        actorRole: UserRole.CANDIDATE,
      }),
    ).rejects.toThrow();
    expect(prisma.application.create).not.toHaveBeenCalled();
  });

  it('rejects a candidate application without a CV', async () => {
    prisma.candidateProfile.findUnique.mockResolvedValue({
      id: 'candidate-1',
      userId: 'candidate-user-1',
      cvDocuments: [],
    });

    await expect(
      service.create({
        requestId: 'request-1',
        userId: 'candidate-user-1',
        actorRole: UserRole.CANDIDATE,
      }),
    ).rejects.toThrow();
    expect(prisma.application.create).not.toHaveBeenCalled();
  });

  it('allows applying after the request advances to screening', async () => {
    prisma.recruitmentRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      status: RecruitmentRequestStatus.SCREENING,
      overallPlan: { status: PlanStatus.APPROVED },
      jobPosting: {
        status: JobPostingStatus.PUBLISHED,
        visibility: JobVisibility.PUBLIC,
        startDate: new Date(Date.now() - 60_000),
        expireDate: new Date(Date.now() + 60_000),
      },
    });

    await service.create({
      requestId: 'request-1',
      userId: 'candidate-user-1',
      actorRole: UserRole.CANDIDATE,
    });

    expect(prisma.application.create).toHaveBeenCalled();
  });
});
