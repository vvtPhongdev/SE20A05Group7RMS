import { RecruitmentRequestStatus, UserRole } from '@wr/contracts';
import { RpcException } from '@nestjs/microservices';
import { RecruitmentRequestsService } from './recruitment-requests.service';

describe('RecruitmentRequestsService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
    department: {
      findFirst: jest.fn(),
    },
    recruitmentRequest: {
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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

  it('creates a request for a department managed by the active department head', async () => {
    prisma.user.findUnique.mockResolvedValue({
      organizationId: 'org-1',
      role: UserRole.DEPARTMENT_HEAD,
      isActive: true,
    });
    prisma.department.findFirst.mockResolvedValue({ id: 'dept-marketing' });
    prisma.recruitmentRequest.create.mockResolvedValue({ id: 'request-1' });
    prisma.requestLog.create.mockResolvedValue({ id: 'log-1' });

    await service.createForDepartmentHead({
      departmentId: 'dept-marketing',
      positionTitle: 'Growth Marketing Specialist',
      headcount: 1,
      jobDescription: 'Run growth campaigns',
      justification: 'Marketing expansion',
      urgency: 'MEDIUM',
      createdById: 'dept-head-1',
    });

    expect(prisma.department.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'dept-marketing',
        organizationId: 'org-1',
        headUserId: 'dept-head-1',
      },
      select: { id: true },
    });
    expect(prisma.recruitmentRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ departmentId: 'dept-marketing' }),
      }),
    );
  });

  it('rejects a department that is not managed by the department head', async () => {
    prisma.user.findUnique.mockResolvedValue({
      organizationId: 'org-1',
      role: UserRole.DEPARTMENT_HEAD,
      isActive: true,
    });
    prisma.department.findFirst.mockResolvedValue(null);

    await expect(
      service.createForDepartmentHead({
        departmentId: 'foreign-dept',
        positionTitle: 'Sales Executive',
        headcount: 1,
        jobDescription: 'Grow sales',
        justification: 'Sales expansion',
        urgency: 'HIGH',
        createdById: 'dept-head-1',
      }),
    ).rejects.toBeInstanceOf(RpcException);

    expect(prisma.recruitmentRequest.create).not.toHaveBeenCalled();
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

  it('deletes a pending request owned by the department head', async () => {
    prisma.recruitmentRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      createdById: 'dept-head-1',
      status: RecruitmentRequestStatus.PENDING_HR_REVIEW,
    });
    prisma.recruitmentRequest.delete.mockResolvedValue({ id: 'request-1' });

    await expect(
      service.deletePending({
        id: 'request-1',
        userId: 'dept-head-1',
      }),
    ).resolves.toEqual({ success: true, id: 'request-1' });

    expect(prisma.recruitmentRequest.delete).toHaveBeenCalledWith({
      where: { id: 'request-1' },
    });
  });

  it('blocks deleting an approved request', async () => {
    prisma.recruitmentRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      createdById: 'dept-head-1',
      status: RecruitmentRequestStatus.APPROVED,
    });

    await expect(
      service.deletePending({
        id: 'request-1',
        userId: 'dept-head-1',
      }),
    ).rejects.toBeInstanceOf(RpcException);

    expect(prisma.recruitmentRequest.delete).not.toHaveBeenCalled();
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
