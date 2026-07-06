import { RpcException } from '@nestjs/microservices';
import { AuditAction, AuditEntityType, PlanStatus, TaskStatus, TaskType } from '@wr/contracts';
import { TaskPlanService } from './task-plan.service';

describe('TaskPlanService', () => {
  const prisma = {
    overallPlan: {
      findUnique: jest.fn(),
    },
    taskPlan: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    taskReminder: {
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const auditLog = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const notificationClient = {
    send: jest.fn().mockReturnValue({
      subscribe: jest.fn(),
    }),
  };

  const service = new TaskPlanService(prisma as any, auditLog as any);

  beforeEach(() => {
    jest.clearAllMocks();
    auditLog.log.mockResolvedValue(undefined);
    notificationClient.send.mockReturnValue({
      subscribe: jest.fn(),
    });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: 'HR_LEADER',
      isActive: true,
    });
    prisma.$transaction.mockImplementation(async (callback) => callback(prisma));
    prisma.taskReminder.upsert.mockResolvedValue({});
    prisma.taskReminder.updateMany.mockResolvedValue({ count: 0 });
  });

  describe('create', () => {
    it('throws if taskType is invalid', async () => {
      await expect(
        service.create({
          overallPlanId: 'plan-1',
          taskType: 'INVALID',
          assignedToId: 'user-1',
          startDate: '2026-07-01',
          endDate: '2026-07-10',
        }),
      ).rejects.toThrow(RpcException);
    });

    it('throws if the overall plan does not exist', async () => {
      prisma.overallPlan.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          overallPlanId: 'plan-1',
          taskType: TaskType.JOB_POSTING,
          assignedToId: 'user-1',
          startDate: '2026-07-01',
          endDate: '2026-07-10',
        }),
      ).rejects.toThrow(RpcException);
    });

    it('throws if endDate is not after startDate', async () => {
      prisma.overallPlan.findUnique.mockResolvedValue({
        id: 'plan-1',
        status: PlanStatus.DRAFT,
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-07-31'),
      });

      await expect(
        service.create({
          overallPlanId: 'plan-1',
          taskType: TaskType.JOB_POSTING,
          assignedToId: 'user-1',
          startDate: '2026-07-10',
          endDate: '2026-07-01',
        }),
      ).rejects.toThrow(RpcException);
    });

    it('throws if task dates fall outside the overall plan timeline', async () => {
      prisma.overallPlan.findUnique.mockResolvedValue({
        id: 'plan-1',
        status: PlanStatus.DRAFT,
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-07-31'),
      });

      await expect(
        service.create({
          overallPlanId: 'plan-1',
          taskType: TaskType.JOB_POSTING,
          assignedToId: 'user-1',
          startDate: '2026-06-30',
          endDate: '2026-07-10',
        }),
      ).rejects.toThrow(RpcException);
    });

    it('creates a task and writes a TASK_PLAN_ASSIGNED audit log', async () => {
      prisma.overallPlan.findUnique.mockResolvedValue({
        id: 'plan-1',
        status: PlanStatus.DRAFT,
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-07-31'),
      });
      prisma.taskPlan.create.mockResolvedValue({
        id: 'task-1',
        status: TaskStatus.PENDING,
        endDate: new Date('2026-07-10'),
      });

      const result = await service.create({
        overallPlanId: 'plan-1',
        taskType: TaskType.JOB_POSTING,
        assignedToId: 'user-1',
        startDate: '2026-07-01',
        endDate: '2026-07-10',
      });

      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: AuditEntityType.TASK_PLAN,
          entityId: 'task-1',
          action: AuditAction.TASK_PLAN_ASSIGNED,
          toStatus: TaskStatus.PENDING,
          performedById: 'user-1',
        }),
      );
      expect(result).toEqual(expect.objectContaining({ id: 'task-1', status: TaskStatus.PENDING }));
      expect(prisma.taskReminder.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            taskPlanId_reminderKey: {
              taskPlanId: 'task-1',
              reminderKey: '24h-before',
            },
          },
        }),
      );
    });

    it('uses performedById over assignedToId for the audit log when provided', async () => {
      prisma.overallPlan.findUnique.mockResolvedValue({
        id: 'plan-1',
        status: PlanStatus.DRAFT,
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-07-31'),
      });
      prisma.taskPlan.create.mockResolvedValue({
        id: 'task-1',
        status: TaskStatus.PENDING,
        endDate: new Date('2026-07-10'),
      });

      await service.create({
        overallPlanId: 'plan-1',
        taskType: TaskType.JOB_POSTING,
        assignedToId: 'user-1',
        startDate: '2026-07-01',
        endDate: '2026-07-10',
        performedById: 'manager-1',
      });

      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({ performedById: 'manager-1' }),
      );
    });

    it('does not send assignment email while the plan is still being drafted', async () => {
      prisma.overallPlan.findUnique.mockResolvedValue({
        id: 'plan-1',
        status: PlanStatus.DRAFT,
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-07-31'),
      });
      prisma.taskPlan.create.mockResolvedValue({
        id: 'task-1',
        status: TaskStatus.PENDING,
        assignedToId: 'user-1',
        endDate: new Date('2026-07-10'),
        assignedTo: { id: 'user-1', displayName: 'Lisa Thompson', email: 'recruiter1@acme.com' },
      });

      await service.create({
        overallPlanId: 'plan-1',
        taskType: TaskType.JOB_POSTING,
        assignedToId: 'user-1',
        startDate: '2026-07-01',
        endDate: '2026-07-10',
      });

      expect(notificationClient.send).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('throws if status is invalid', async () => {
      await expect(
        service.updateStatus({ id: 'task-1', status: 'INVALID', performedById: 'user-1' }),
      ).rejects.toThrow(RpcException);
    });

    it('throws if the task does not exist', async () => {
      prisma.taskPlan.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus({
          id: 'task-1',
          status: TaskStatus.IN_PROGRESS,
          performedById: 'user-1',
        }),
      ).rejects.toThrow(RpcException);
    });

    it('updates status and writes a TASK_PLAN_STATUS_CHANGED audit log', async () => {
      prisma.taskPlan.findUnique.mockResolvedValue({
        id: 'task-1',
        status: TaskStatus.PENDING,
        assignedToId: 'user-1',
      });
      prisma.taskPlan.update.mockResolvedValue({ id: 'task-1', status: TaskStatus.IN_PROGRESS });

      const result = await service.updateStatus({
        id: 'task-1',
        status: TaskStatus.IN_PROGRESS,
        performedById: 'user-1',
      });

      expect(prisma.taskPlan.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'task-1' },
          data: { status: TaskStatus.IN_PROGRESS },
        }),
      );
      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: AuditEntityType.TASK_PLAN,
          entityId: 'task-1',
          action: AuditAction.TASK_PLAN_STATUS_CHANGED,
          fromStatus: TaskStatus.PENDING,
          toStatus: TaskStatus.IN_PROGRESS,
          performedById: 'user-1',
        }),
      );
      expect(result).toEqual({ id: 'task-1', status: TaskStatus.IN_PROGRESS });
    });

    it('allows HR to update tasks assigned to another HR member', async () => {
      prisma.taskPlan.findUnique.mockResolvedValue({
        id: 'task-1',
        status: TaskStatus.PENDING,
        assignedToId: 'other-recruiter',
      });
      prisma.taskPlan.update.mockResolvedValue({ id: 'task-1', status: TaskStatus.IN_PROGRESS });

      await expect(
        service.updateStatus({
          id: 'task-1',
          status: TaskStatus.IN_PROGRESS,
          performedById: 'user-1',
          actorRole: 'HR_LEADER',
        }),
      ).resolves.toEqual({ id: 'task-1', status: TaskStatus.IN_PROGRESS });
      expect(prisma.taskPlan.update).toHaveBeenCalled();
    });
  });
});
