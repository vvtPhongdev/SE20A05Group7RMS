import { RpcException } from '@nestjs/microservices';
import { of } from 'rxjs';
import {
  InterviewStatus,
  RecruitmentRequestStatus,
  UserRole,
} from '@wr/contracts';
import { InterviewResultService } from './interview-result.service';

describe('InterviewResultService', () => {
  const prisma = {
    interviewSchedule: {
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    application: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    recruitmentRequest: {
      update: jest.fn(),
    },
    requestLog: {
      create: jest.fn(),
    },
    interviewResult: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const notificationClient = {
    send: jest.fn().mockReturnValue(of({ success: true })),
  };

  const auditLog = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const service = new InterviewResultService(prisma as any, auditLog as any, notificationClient as any);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (txs) => txs);
    prisma.user.findUnique.mockResolvedValue({ id: 'evaluator-1', displayName: 'Evaluator' });
    prisma.interviewResult.findMany.mockResolvedValue([]);
    prisma.interviewResult.create.mockReturnValue({ id: 'interview-result-1', result: 'PASS' });
    auditLog.log.mockResolvedValue(undefined);
  });

  it('fails if schedule does not exist', async () => {
    prisma.interviewSchedule.findUnique.mockResolvedValue(null);

    await expect(
      service.recordResult({
        interviewId: 'interview-1',
        feedbacks: [{ evaluatorId: 'evaluator-1', decision: 'PASS', technical: 8, communication: 8, culture: 8, notes: 'Great' }],
        finalRecommendation: 'Recommend Hire',
      }),
    ).rejects.toThrow(RpcException);
  });

  it('fails if schedule is cancelled', async () => {
    prisma.interviewSchedule.findUnique.mockResolvedValue({
      id: 'interview-1',
      status: InterviewStatus.CANCELLED,
    });

    await expect(
      service.recordResult({
        interviewId: 'interview-1',
        feedbacks: [{ evaluatorId: 'evaluator-1', decision: 'PASS', technical: 8, communication: 8, culture: 8, notes: 'Great' }],
        finalRecommendation: 'Recommend Hire',
      }),
    ).rejects.toThrow(RpcException);
  });

  it('fails if finalRecommendation is invalid', async () => {
    prisma.interviewSchedule.findUnique.mockResolvedValue({
      id: 'interview-1',
      status: InterviewStatus.SCHEDULED,
    });

    await expect(
      service.recordResult({
        interviewId: 'interview-1',
        feedbacks: [{ evaluatorId: 'evaluator-1', decision: 'PASS', technical: 8, communication: 8, culture: 8, notes: 'Great' }],
        finalRecommendation: 'INVALID_RECOMMENDATION',
      }),
    ).rejects.toThrow(RpcException);
  });

  it('records result and updates pipeline status for Recommend Hire', async () => {
    prisma.interviewSchedule.findUnique.mockResolvedValue({
      id: 'interview-1',
      candidateId: 'candidate-1',
      requestId: 'request-1',
      status: InterviewStatus.SCHEDULED,
      candidate: { fullName: 'John Doe', email: 'john@example.com', userId: 'user-1' },
      request: { id: 'request-1', position: 'Software Engineer', status: 'ACTIVE', createdById: 'dept-head-1' },
    });

    prisma.application.findUnique.mockResolvedValue({
      id: 'application-1',
    });

    prisma.interviewSchedule.count.mockResolvedValue(1); // 1 other active schedule remains

    await service.recordResult({
      interviewId: 'interview-1',
      feedbacks: [{ evaluatorId: 'evaluator-1', decision: 'PASS', technical: 8, communication: 8, culture: 8, notes: 'Strong PASS' }],
      finalRecommendation: 'Recommend Hire',
      evaluatorId: 'evaluator-1',
    });

    expect(prisma.interviewResult.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          result: 'PASS',
          notes: 'Strong PASS',
          evaluatorId: 'evaluator-1',
          technical: 8,
          communication: 8,
          culture: 8,
        }),
      }),
    );

    expect(prisma.application.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'application-1' },
        data: { status: RecruitmentRequestStatus.INTERVIEW_COMPLETED },
      }),
    );
  });

  it('updates request status and notifies admin when last interview completes and candidate recommended for hire', async () => {
    prisma.interviewSchedule.findUnique.mockResolvedValue({
      id: 'interview-1',
      candidateId: 'candidate-1',
      requestId: 'request-1',
      status: InterviewStatus.SCHEDULED,
      candidate: { fullName: 'John Doe', email: 'john@example.com', userId: 'user-1' },
      request: { id: 'request-1', position: 'Software Engineer', status: 'ACTIVE', createdById: 'dept-head-1' },
    });

    prisma.application.findUnique.mockResolvedValue({
      id: 'application-1',
    });

    prisma.interviewSchedule.count.mockResolvedValue(0); // No other active schedules remain

    await service.recordResult({
      interviewId: 'interview-1',
      feedbacks: [{ evaluatorId: 'evaluator-1', decision: 'PASS', technical: 8, communication: 8, culture: 8, notes: 'Final interview PASS' }],
      finalRecommendation: 'Recommend Hire',
      evaluatorId: 'evaluator-1',
    });

    expect(prisma.recruitmentRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'request-1' },
        data: { status: RecruitmentRequestStatus.INTERVIEW_COMPLETED },
      }),
    );

    expect(notificationClient.send).toHaveBeenCalledWith(
      'notification.send_to_role',
      expect.objectContaining({
        role: UserRole.ADMIN,
        title: 'Review Required: Interview Stage Completed',
      }),
    );
  });
});
