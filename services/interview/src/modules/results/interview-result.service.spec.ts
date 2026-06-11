import { RpcException } from '@nestjs/microservices';
import { of } from 'rxjs';
import {
  InterviewStatus,
  InterviewResult,
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
    prisma.interviewResult.create.mockReturnValue({ id: 'interview-result-1' });
    auditLog.log.mockResolvedValue(undefined);
  });

  it('fails if schedule does not exist', async () => {
    prisma.interviewSchedule.findUnique.mockResolvedValue(null);

    await expect(
      service.recordResult({
        interviewId: 'interview-1',
        result: InterviewResult.PASS,
        notes: 'Great performance',
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
        result: InterviewResult.PASS,
        notes: 'Great performance',
      }),
    ).rejects.toThrow(RpcException);
  });

  it('fails if notes are missing', async () => {
    prisma.interviewSchedule.findUnique.mockResolvedValue({
      id: 'interview-1',
      status: InterviewStatus.SCHEDULED,
    });

    await expect(
      service.recordResult({
        interviewId: 'interview-1',
        result: InterviewResult.PASS,
        notes: '   ',
      }),
    ).rejects.toThrow(RpcException);
  });

  it('records result and updates pipeline status for PASS', async () => {
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
      result: InterviewResult.PASS,
      notes: 'Strong PASS',
      evaluatorId: 'evaluator-1',
    });

    expect(prisma.interviewResult.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          result: InterviewResult.PASS,
          notes: 'Strong PASS',
          evaluatorId: 'evaluator-1',
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

  it('updates request status and notifies admin when last interview completes', async () => {
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
      result: InterviewResult.PASS,
      notes: 'Final interview PASS',
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
