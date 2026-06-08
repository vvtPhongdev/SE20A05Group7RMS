import { HttpStatus } from '@nestjs/common';
import {
  HiringDecision,
  InterviewResult,
  InterviewStatus,
  RecruitmentRequestStatus,
} from '@wr/contracts';
import { HiringDecisionService } from './hiring-decision.service';

describe('HiringDecisionService', () => {
  const prisma = {
    recruitmentRequest: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    requestLog: { create: jest.fn() },
    application: { update: jest.fn() },
    emailLog: { create: jest.fn() },
    notification: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  const notificationClient = {
    send: jest.fn().mockReturnValue({
      subscribe: jest.fn(),
    }),
  };
  const service = new HiringDecisionService(prisma as any, notificationClient as any);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.recruitmentRequest.update.mockReturnValue({ operation: 'request' });
    prisma.requestLog.create.mockReturnValue({ operation: 'log' });
    prisma.application.update.mockReturnValue({ operation: 'application' });
    prisma.emailLog.create.mockReturnValue({ operation: 'email' });
    prisma.notification.create.mockReturnValue({ operation: 'notification' });
    prisma.$transaction.mockResolvedValue([{ id: 'request-1' }]);
  });

  it('rejects a decision before interviews are completed', async () => {
    prisma.recruitmentRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      status: RecruitmentRequestStatus.INTERVIEWING,
      interviews: [],
      applications: [],
    });

    await expect(
      service.decide('request-1', HiringDecision.REJECT, 'Not selected', 'admin-1'),
    ).rejects.toMatchObject({
      error: expect.objectContaining({ status: HttpStatus.CONFLICT }),
    });
  });

  it('queues an offer for candidates with PASS results', async () => {
    prisma.recruitmentRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      position: 'Backend Engineer',
      status: RecruitmentRequestStatus.INTERVIEW_COMPLETED,
      interviews: [
        {
          id: 'interview-1',
          candidateId: 'candidate-1',
          status: InterviewStatus.COMPLETED,
          results: [{ result: InterviewResult.PASS }],
        },
      ],
      applications: [
        {
          id: 'application-1',
          candidateId: 'candidate-1',
          candidate: {
            userId: 'user-1',
            email: 'candidate@example.com',
          },
        },
      ],
    });

    const result = await service.decide(
      'request-1',
      HiringDecision.HIRE,
      'Strong panel feedback',
      'admin-1',
    );

    expect(prisma.recruitmentRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: RecruitmentRequestStatus.OFFER_EXTENDED,
        }),
      }),
    );
    expect(prisma.requestLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          performedById: 'admin-1',
          action: 'FINAL_HIRING_DECISION',
        }),
      }),
    );
    expect(result.selectedCandidateIds).toEqual(['candidate-1']);
  });
});
