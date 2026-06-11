import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditEntityType, TaskStatus, TaskType } from '@wr/contracts';
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
  };

  const auditLog = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const service = new TaskPlanService(prisma as any, auditLog as any);

  beforeEach(() => {
    jest.clearAllMocks();
    auditLog.log.mockResolvedValue(undefined);
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
      ).rejects.toThrow(BadRequestException);
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
      ).rejects.toThrow(NotFoundException);
    });

    it('throws if endDate is not after startDate', async () => {
      prisma.overallPlan.findUnique.mockResolvedValue({ id: 'plan-1' });

      await expect(
        service.create({
          overallPlanId: 'plan-1',
          taskType: TaskType.JOB_POSTING,
          assignedToId: 'user-1',
          startDate: '2026-07-10',
          endDate: '2026-07-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a task and writes a TASK_PLAN_ASSIGNED audit log', async () => {
      prisma.overallPlan.findUnique.mockResolvedValue({ id: 'plan-1' });
      prisma.taskPlan.create.mockResolvedValue({ id: 'task-1', status: TaskStatus.PENDING });

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
      expect(result).toEqual({ id: 'task-1', status: TaskStatus.PENDING });
    });

    it('uses performedById over assignedToId for the audit log when provided', async () => {
      prisma.overallPlan.findUnique.mockResolvedValue({ id: 'plan-1' });
      prisma.taskPlan.create.mockResolvedValue({ id: 'task-1', status: TaskStatus.PENDING });

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
  });

  describe('updateStatus', () => {
    it('throws if status is invalid', async () => {
      await expect(
        service.updateStatus({ id: 'task-1', status: 'INVALID', performedById: 'user-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws if the task does not exist', async () => {
      prisma.taskPlan.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus({ id: 'task-1', status: TaskStatus.IN_PROGRESS, performedById: 'user-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates status and writes a TASK_PLAN_STATUS_CHANGED audit log', async () => {
      prisma.taskPlan.findUnique.mockResolvedValue({ id: 'task-1', status: TaskStatus.PENDING });
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
  });
});
