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
    emailLog: { create: jest.fn(), update: jest.fn() },
    notification: { create: jest.fn() },
    offerLetter: { create: jest.fn() },
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
  const service = new HiringDecisionService(
    prisma as any,
    notificationClient as any,
    emailQueue as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.recruitmentRequest.update.mockReturnValue({ operation: 'request' });
    prisma.requestLog.create.mockReturnValue({ operation: 'log' });
    prisma.application.update.mockReturnValue({ operation: 'application' });
    prisma.emailLog.create.mockReturnValue({ operation: 'email' });
    prisma.notification.create.mockReturnValue({ operation: 'notification' });
    prisma.offerLetter.create.mockReturnValue({ operation: 'offer' });
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
      department: { name: 'Engineering' },
      interviews: [
        {
          id: 'interview-1',
          candidateId: 'candidate-1',
          status: InterviewStatus.COMPLETED,
          interviewers: ['interviewer-1', 'interviewer-2'],
          results: [{ result: InterviewResult.PASS }, { result: InterviewResult.PASS }],
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

    const result = await service.decide(
      'request-1',
      HiringDecision.HIRE,
      'Strong panel feedback',
      'admin-1',
      {
        candidateId: 'candidate-1',
        compensation: '45,000,000 VND gross per month',
        startDate: '2026-07-15T00:00:00.000Z',
      },
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
          action: 'HIRING_DECISION_HIRE',
        }),
      }),
    );
    expect(result.selectedCandidateIds).toEqual(['candidate-1']);
    expect(prisma.offerLetter.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          candidateId: 'candidate-1',
          status: 'SENT',
          compensation: '45,000,000 VND gross per month',
        }),
      }),
    );
    expect(emailQueue.add).toHaveBeenCalledWith(
      'send-email',
      expect.objectContaining({ to: 'candidate@example.com' }),
      expect.objectContaining({ jobId: expect.stringMatching(/^email-log-/) }),
    );
  });

  it('allows HIRE when the selected candidate has 2 feedback results even if another candidate interview is pending', async () => {
    prisma.recruitmentRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      position: 'Backend Engineer',
      status: RecruitmentRequestStatus.INTERVIEW_COMPLETED,
      department: { name: 'Engineering' },
      interviews: [
        {
          id: 'interview-1',
          candidateId: 'candidate-1',
          status: InterviewStatus.COMPLETED,
          interviewers: ['interviewer-1', 'interviewer-2'],
          results: [{ result: InterviewResult.PASS }, { result: InterviewResult.PASS }],
        },
        {
          id: 'interview-2',
          candidateId: 'candidate-2',
          status: InterviewStatus.COMPLETED,
          interviewers: ['interviewer-1', 'interviewer-2'],
          results: [],
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
        {
          id: 'application-2',
          candidateId: 'candidate-2',
          candidate: {
            userId: 'user-2',
            email: 'other@example.com',
            fullName: 'John Smith',
          },
        },
      ],
    });

    const result = await service.decide(
      'request-1',
      HiringDecision.HIRE,
      'Strong panel feedback',
      'admin-1',
      {
        candidateId: 'candidate-1',
        compensation: '45,000,000 VND gross per month',
        startDate: '2026-07-15T00:00:00.000Z',
      },
    );

    expect(result.selectedCandidateIds).toEqual(['candidate-1']);
    expect(prisma.recruitmentRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: RecruitmentRequestStatus.OFFER_EXTENDED,
        }),
      }),
    );
  });

  it('rejects HIRE when the selected candidate has fewer than 2 feedback results', async () => {
    prisma.recruitmentRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      position: 'Backend Engineer',
      status: RecruitmentRequestStatus.INTERVIEW_COMPLETED,
      department: { name: 'Engineering' },
      interviews: [
        {
          id: 'interview-1',
          candidateId: 'candidate-1',
          status: InterviewStatus.COMPLETED,
          interviewers: ['interviewer-1', 'interviewer-2'],
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
            fullName: 'Jane Doe',
          },
        },
      ],
    });

    await expect(
      service.decide('request-1', HiringDecision.HIRE, 'Strong panel feedback', 'admin-1', {
        candidateId: 'candidate-1',
        compensation: '45,000,000 VND gross per month',
        startDate: '2026-07-15T00:00:00.000Z',
      }),
    ).rejects.toMatchObject({
      error: expect.objectContaining({
        status: HttpStatus.PRECONDITION_FAILED,
        message: 'The selected candidate must have feedback from at least 2 interviewers before hire',
      }),
    });
  });

  it('rejects HIRE when offer details are missing', async () => {
    await expect(
      service.decide(
        'request-1',
        HiringDecision.HIRE,
        'Strong panel feedback',
        'admin-1',
      ),
    ).rejects.toMatchObject({
      error: expect.objectContaining({ status: HttpStatus.BAD_REQUEST }),
    });
    expect(prisma.recruitmentRequest.findUnique).not.toHaveBeenCalled();
  });

  it('queues a rejection email for candidates with FAIL results or decision REJECT', async () => {
    prisma.recruitmentRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      position: 'Backend Engineer',
      status: RecruitmentRequestStatus.INTERVIEW_COMPLETED,
      department: { name: 'Engineering' },
      interviews: [
        {
          id: 'interview-1',
          candidateId: 'candidate-1',
          status: InterviewStatus.COMPLETED,
          interviewers: ['interviewer-1', 'interviewer-2'],
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
          status: RecruitmentRequestStatus.NOT_HIRED,
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
        emailLogId: expect.any(String),
        to: 'candidate@example.com',
        subject: 'Rendered Rejection Subject',
        body: 'Rendered Rejection Body',
      }),
      expect.objectContaining({ jobId: expect.stringMatching(/^email-log-/) }),
    );
    expect(result.decision).toBe(HiringDecision.REJECT);
  });
});
