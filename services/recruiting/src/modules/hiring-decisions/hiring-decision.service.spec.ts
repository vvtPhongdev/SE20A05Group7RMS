import { HttpStatus } from '@nestjs/common';
import { of } from 'rxjs';
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
    send: jest.fn().mockImplementation((pattern) => {
      if (pattern === 'notification.render_template') {
        return of({
          subject: 'Rendered Rejection Subject',
          body: 'Rendered Rejection Body',
        });
      }
      return of({
        subscribe: jest.fn(),
      });
    }),
  };
  const emailQueue = { add: jest.fn() };
  const service = new HiringDecisionService(prisma as any, notificationClient as any, emailQueue as any);

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

  it('queues a rejection email for candidates with FAIL results or decision REJECT', async () => {
    prisma.recruitmentRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      position: 'Backend Engineer',
      status: RecruitmentRequestStatus.INTERVIEW_COMPLETED,
      interviews: [
        {
          id: 'interview-1',
          candidateId: 'candidate-1',
          status: InterviewStatus.COMPLETED,
          results: [{ result: InterviewResult.FAIL }],
        },
      ],
      applications: [
        {
          id: 'application-1',
          candidateId: 'candidate-1',
          candidate: {
            userId: 'user-1',
            email: 'candidate@example.com',
            fullName: 'Jane Doe',
          },
        },
      ],
    });

    prisma.$transaction.mockResolvedValue([
      { id: 'request-1' },
      { id: 'log-1' },
      { id: 'app-update-1' },
      {
        id: 'email-log-1',
        toEmail: 'candidate@example.com',
        subject: 'Rendered Rejection Subject',
        body: 'Rendered Rejection Body',
      },
    ]);

    const result = await service.decide(
      'request-1',
      HiringDecision.REJECT,
      'Lack of experience',
      'admin-1',
    );

    expect(prisma.recruitmentRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: RecruitmentRequestStatus.REJECTED,
          rejectionReason: 'Lack of experience',
        }),
      }),
    );
    expect(notificationClient.send).toHaveBeenCalledWith(
      'notification.render_template',
      expect.objectContaining({
        templateType: 'REJECTION',
        templateData: expect.objectContaining({
          candidateName: 'Jane Doe',
          position: 'Backend Engineer',
          rejectionReason: 'Lack of experience',
        }),
      }),
    );
    expect(emailQueue.add).toHaveBeenCalledWith(
      'send-email',
      expect.objectContaining({
        emailLogId: 'email-log-1',
        to: 'candidate@example.com',
        subject: 'Rendered Rejection Subject',
        body: 'Rendered Rejection Body',
      }),
      expect.any(Object),
    );
    expect(result.decision).toBe(HiringDecision.REJECT);
  });
});
