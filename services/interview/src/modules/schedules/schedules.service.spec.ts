import { of } from 'rxjs';
import { InterviewStatus, RecruitmentRequestStatus, UserRole } from '@wr/contracts';
import { SchedulesService } from './schedules.service';

describe('SchedulesService', () => {
  const prisma = {
    interviewSchedule: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    candidateProfile: {
      findUnique: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    recruitmentRequest: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    overallPlan: {
      findUnique: jest.fn(),
    },
    application: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    requestLog: {
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

  const service = new SchedulesService(prisma as any, auditLog as any, notificationClient as any);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (txs) => txs);
    auditLog.log.mockResolvedValue(undefined);
  });

  describe('create', () => {
    it('creates interview schedule and updates request/application status', async () => {
      // Mock plan locked checks
      prisma.recruitmentRequest.findUnique.mockResolvedValue({
        id: 'request-1',
        status: RecruitmentRequestStatus.APPROVED,
        position: 'Software Engineer',
      });
      prisma.overallPlan.findUnique.mockResolvedValue({
        id: 'plan-1',
        status: 'APPROVED',
        tasks: [{ taskType: 'INTERVIEW_COORDINATION' }],
      });
      // Mock application check
      prisma.application.findUnique.mockResolvedValue({
        id: 'application-1',
        status: 'SCREENING',
      });
      // Mock candidate profile and interviewers queries
      prisma.candidateProfile.findUnique.mockResolvedValue({
        userId: 'user-candidate',
        fullName: 'Jane Doe',
        email: 'jane@example.com',
      });
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'interviewer-1',
          displayName: 'Dr. John',
          email: 'john@example.com',
          role: UserRole.HR_LEADER,
          isActive: true,
        },
        {
          id: 'interviewer-2',
          displayName: 'Ms. Linh',
          email: 'linh@example.com',
          role: UserRole.DEPARTMENT_HEAD,
          isActive: true,
        },
      ]);
      // Mock conflict check returns no conflict
      prisma.interviewSchedule.findMany.mockResolvedValue([]);

      prisma.interviewSchedule.create.mockReturnValue({ id: 'schedule-1' });

      const payload = {
        requestId: 'request-1',
        candidateId: 'candidate-1',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(), // future date
        duration: 60,
        location: 'Room A',
        interviewers: ['interviewer-1', 'interviewer-2'],
        scheduledById: 'hr-1',
      };

      await service.create(payload);

      expect(prisma.interviewSchedule.create).toHaveBeenCalled();
      expect(prisma.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: RecruitmentRequestStatus.INTERVIEWING },
        }),
      );
      expect(prisma.recruitmentRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: RecruitmentRequestStatus.INTERVIEWING },
        }),
      );

      // Flush microtasks to allow Promise.all().then() callbacks to execute
      await new Promise((resolve) => setImmediate(resolve));

      // Verify that notification client was invoked with send_templated_email
      expect(notificationClient.send).toHaveBeenCalledWith(
        'notification.send_templated_email',
        expect.objectContaining({
          templateType: 'INTERVIEW_INVITATION',
          toEmail: 'jane@example.com',
        }),
      );
      expect(notificationClient.send).toHaveBeenCalledWith(
        'notification.send_templated_email',
        expect.objectContaining({
          templateType: 'INTERVIEW_INVITATION',
          toEmail: 'john@example.com',
        }),
      );
    });
  });

  describe('cancel', () => {
    it('cancels interview schedule and updates request timeline + notifies via client', async () => {
      const scheduledAt = new Date();
      prisma.interviewSchedule.findUnique.mockResolvedValue({
        id: 'schedule-1',
        candidateId: 'candidate-1',
        requestId: 'request-1',
        scheduledAt,
        location: 'Room A',
        interviewers: ['interviewer-1'],
        status: InterviewStatus.SCHEDULED,
      });

      prisma.candidateProfile.findUnique.mockResolvedValue({
        userId: 'user-candidate',
        fullName: 'Jane Doe',
        email: 'jane@example.com',
      });

      prisma.user.findMany.mockResolvedValue([
        { id: 'user-interviewer', displayName: 'Dr. John', email: 'john@example.com' },
      ]);

      await service.cancel({
        id: 'schedule-1',
        cancelledBy: 'user-hr',
        reason: 'Candidate request',
      });

      expect(prisma.interviewSchedule.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: InterviewStatus.CANCELLED },
        }),
      );

      expect(prisma.requestLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'INTERVIEW_CANCELLED',
          }),
        }),
      );

      // Verify that notification client was invoked
      expect(notificationClient.send).toHaveBeenCalledWith(
        'notification.send_email',
        expect.objectContaining({
          toEmail: 'jane@example.com',
        }),
      );
    });
  });
});
