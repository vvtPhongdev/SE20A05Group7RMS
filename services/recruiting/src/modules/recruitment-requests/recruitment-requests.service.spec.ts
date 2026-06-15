import { RecruitmentRequestStatus } from '@wr/contracts';
import { RpcException } from '@nestjs/microservices';
import { RecruitmentRequestsService } from './recruitment-requests.service';

describe('RecruitmentRequestsService', () => {
  const prisma = {
    recruitmentRequest: {
      findUnique: jest.fn(),
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
      status: RecruitmentRequestStatus.PENDING_REVIEW,
    });
    prisma.requestLog.create.mockResolvedValue({ id: 'log-1' });

    const result = await service.submitDraft({
      id: 'request-1',
      userId: 'dept-head-1',
    });

    expect(prisma.recruitmentRequest.update).toHaveBeenCalledWith({
      where: { id: 'request-1' },
      data: {
        status: RecruitmentRequestStatus.PENDING_REVIEW,
        rejectionReason: null,
      },
    });
    expect(prisma.requestLog.create).toHaveBeenCalledWith({
      data: {
        requestId: 'request-1',
        action: 'RESUBMITTED_FOR_REVIEW',
        fromStatus: RecruitmentRequestStatus.REVISION_NEEDED,
        toStatus: RecruitmentRequestStatus.PENDING_REVIEW,
        performedById: 'dept-head-1',
      },
    });
    expect(result.status).toBe(RecruitmentRequestStatus.PENDING_REVIEW);
  });

  it('records when the assigned HR manager forwards a request to Admin', async () => {
    prisma.recruitmentRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      reviewedById: 'hr-1',
      status: RecruitmentRequestStatus.PENDING_REVIEW,
    });
    prisma.requestLog.create.mockResolvedValue({ id: 'log-1' });

    await service.forwardToAdmin({
      id: 'request-1',
      hrManagerId: 'hr-1',
    });

    expect(prisma.requestLog.create).toHaveBeenCalledWith({
      data: {
        requestId: 'request-1',
        action: 'HR_FORWARDED_TO_ADMIN',
        fromStatus: RecruitmentRequestStatus.PENDING_REVIEW,
        toStatus: RecruitmentRequestStatus.PENDING_REVIEW,
        performedById: 'hr-1',
      },
    });
  });

  it('blocks an Admin decision until HR has forwarded the latest submission', async () => {
    prisma.recruitmentRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      reviewedById: 'hr-1',
      status: RecruitmentRequestStatus.PENDING_REVIEW,
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
