import { RecruitmentRequestStatus, UserRole } from '@wr/contracts';
import { RpcException } from '@nestjs/microservices';
import { RecruitmentRequestsService } from './recruitment-requests.service';

describe('RecruitmentRequestsService', () => {
  const prisma = {
    recruitmentRequest: {
      count: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    requestLog: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const service = new RecruitmentRequestsService(prisma as any);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (operations) => Promise.all(operations));
  });

  it('marks requests as forwarded only when HR forwarded after the latest submission', async () => {
    const baseRequest = {
      position: 'Frontend Engineer',
      department: { id: 'dept-1', name: 'Engineering', code: 'ENG' },
      createdBy: { id: 'dept-head-1', displayName: 'Dept Head' },
      reviewedBy: { id: 'hr-1', displayName: 'HR Leader' },
      status: RecruitmentRequestStatus.PENDING_HR_REVIEW,
      urgency: 'MEDIUM',
      headcount: 1,
      applications: [],
      jobDescription: 'Build web apps',
      skillRequirements: { skills: ['React'] },
      justification: 'Team growth',
      overallPlan: null,
      createdAt: new Date('2026-06-15T08:00:00.000Z'),
      updatedAt: new Date('2026-06-15T08:00:00.000Z'),
    };
    prisma.recruitmentRequest.count.mockResolvedValue(2);
    prisma.recruitmentRequest.findMany.mockResolvedValue([
      {
        ...baseRequest,
        id: 'forwarded-request',
        logs: [
          { action: 'HR_FORWARDED_TO_ADMIN', createdAt: new Date('2026-06-15T10:00:00.000Z') },
          { action: 'SUBMITTED_FOR_REVIEW', createdAt: new Date('2026-06-15T09:00:00.000Z') },
        ],
      },
      {
        ...baseRequest,
        id: 'resubmitted-request',
        logs: [
          { action: 'RESUBMITTED_FOR_REVIEW', createdAt: new Date('2026-06-15T11:00:00.000Z') },
          { action: 'HR_FORWARDED_TO_ADMIN', createdAt: new Date('2026-06-15T10:00:00.000Z') },
        ],
      },
    ]);

    const result = await service.listForAdmin({});

    expect(result.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'forwarded-request', forwardedToAdmin: true }),
        expect.objectContaining({ id: 'resubmitted-request', forwardedToAdmin: false }),
      ]),
    );
  });

  it('does not restrict HR requests to assigned campaigns', async () => {
    prisma.recruitmentRequest.count.mockResolvedValue(0);
    prisma.recruitmentRequest.findMany.mockResolvedValue([]);

    await service.listForAdmin({
      role: UserRole.HR_LEADER,
      userId: 'recruiter-1',
    });

    expect(prisma.recruitmentRequest.count).toHaveBeenCalledWith({ where: {} });
  });

  it('allows HR to view requests without an assigned task', async () => {
    prisma.recruitmentRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      createdById: 'dept-head-1',
      reviewedById: 'hr-leader-1',
      overallPlan: {
        tasks: [{ assignedToId: 'other-recruiter' }],
      },
      logs: [],
    });

    await expect(
      service.getByIdForActor({
        id: 'request-1',
        role: UserRole.HR_LEADER,
        userId: 'recruiter-1',
      }),
    ).resolves.toEqual(expect.objectContaining({ id: 'request-1' }));
  });

  it('updates a revision-needed request without changing its status', async () => {
    prisma.recruitmentRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      createdById: 'dept-head-1',
      status: RecruitmentRequestStatus.REVISION_NEEDED,
    });
    prisma.recruitmentRequest.update.mockResolvedValue({
      id: 'request-1',
      status: RecruitmentRequestStatus.REVISION_NEEDED,
    });
    prisma.requestLog.create.mockResolvedValue({ id: 'log-1' });

    await service.updateForDepartmentHead({
      id: 'request-1',
      userId: 'dept-head-1',
      positionTitle: 'Senior Backend Engineer',
      headcount: 2,
      jobDescription: 'Updated description',
      justification: 'Updated justification',
      urgency: 'HIGH',
      skillRequirements: { skills: ['NestJS'] },
    });

    expect(prisma.recruitmentRequest.update).toHaveBeenCalledWith({
      where: { id: 'request-1' },
      data: {
        position: 'Senior Backend Engineer',
        headcount: 2,
        jobDescription: 'Updated description',
        justification: 'Updated justification',
        urgency: 'HIGH',
        skillRequirements: { skills: ['NestJS'] },
      },
    });
    expect(prisma.requestLog.create).toHaveBeenCalledWith({
      data: {
        requestId: 'request-1',
        action: 'UPDATED',
        performedById: 'dept-head-1',
      },
    });
  });

  it('resubmits a revision-needed request and clears the revision feedback', async () => {
    prisma.recruitmentRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      createdById: 'dept-head-1',
      status: RecruitmentRequestStatus.REVISION_NEEDED,
    });
    prisma.recruitmentRequest.update.mockResolvedValue({
      id: 'request-1',
      status: RecruitmentRequestStatus.PENDING_HR_REVIEW,
    });
    prisma.requestLog.create.mockResolvedValue({ id: 'log-1' });

    const result = await service.submitDraft({
      id: 'request-1',
      userId: 'dept-head-1',
    });

    expect(prisma.recruitmentRequest.update).toHaveBeenCalledWith({
      where: { id: 'request-1' },
      data: {
        status: RecruitmentRequestStatus.PENDING_HR_REVIEW,
        rejectionReason: null,
      },
    });
    expect(prisma.requestLog.create).toHaveBeenCalledWith({
      data: {
        requestId: 'request-1',
        action: 'RESUBMITTED_FOR_REVIEW',
        fromStatus: RecruitmentRequestStatus.REVISION_NEEDED,
        toStatus: RecruitmentRequestStatus.PENDING_HR_REVIEW,
        performedById: 'dept-head-1',
      },
    });
    expect(result.status).toBe(RecruitmentRequestStatus.PENDING_HR_REVIEW);
  });

  it('records when the assigned HR manager forwards a request to Admin', async () => {
    prisma.recruitmentRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      reviewedById: 'hr-1',
      status: RecruitmentRequestStatus.PENDING_HR_REVIEW,
    });
    prisma.recruitmentRequest.update.mockResolvedValue({
      id: 'request-1',
      status: RecruitmentRequestStatus.PENDING_BOSS_APPROVAL,
    });
    prisma.requestLog.create.mockResolvedValue({ id: 'log-1' });

    await service.forwardToAdmin({
      id: 'request-1',
      hrManagerId: 'hr-1',
    });

    expect(prisma.recruitmentRequest.update).toHaveBeenCalledWith({
      where: { id: 'request-1' },
      data: { status: RecruitmentRequestStatus.PENDING_BOSS_APPROVAL },
    });
    expect(prisma.requestLog.create).toHaveBeenCalledWith({
      data: {
        requestId: 'request-1',
        action: 'HR_FORWARDED_TO_ADMIN',
        fromStatus: RecruitmentRequestStatus.PENDING_HR_REVIEW,
        toStatus: RecruitmentRequestStatus.PENDING_BOSS_APPROVAL,
        performedById: 'hr-1',
      },
    });
  });

  it('blocks an Admin decision until HR has forwarded the latest submission', async () => {
    prisma.recruitmentRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      reviewedById: 'hr-1',
      status: RecruitmentRequestStatus.PENDING_HR_REVIEW,
    });
    prisma.requestLog.findFirst
      .mockResolvedValueOnce({ createdAt: new Date('2026-06-15T08:00:00.000Z') })
      .mockResolvedValueOnce(null);

    await expect(
      service.decide({
        id: 'request-1',
        decision: 'APPROVED',
        adminId: 'admin-1',
      }),
    ).rejects.toBeInstanceOf(RpcException);
  });
});
