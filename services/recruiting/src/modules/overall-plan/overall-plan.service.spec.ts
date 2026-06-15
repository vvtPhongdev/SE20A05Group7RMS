import { BadRequestException, NotFoundException } from '@nestjs/common';
import { of } from 'rxjs';
import {
  AuditAction,
  AuditEntityType,
  PlanStatus,
  RecruitmentRequestStatus,
} from '@wr/contracts';
import { OverallPlanService } from './overall-plan.service';

describe('OverallPlanService', () => {
  const prisma = {
    overallPlan: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    recruitmentRequest: {
      update: jest.fn(),
    },
    requestLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const auditLog = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const notificationClient = {
    send: jest.fn().mockReturnValue(of({ success: true })),
  };

  const service = new OverallPlanService(prisma as any, auditLog as any, notificationClient as any);

  beforeEach(() => {
    jest.clearAllMocks();
    auditLog.log.mockResolvedValue(undefined);
    prisma.$transaction.mockImplementation(async (operations) => Promise.all(operations));
  });

  describe('approve', () => {
    it('throws if plan does not exist', async () => {
      prisma.overallPlan.findUnique.mockResolvedValue(null);

      await expect(service.approve({ id: 'plan-1', approvedById: 'approver-1' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws if plan is not PENDING_APPROVAL', async () => {
      prisma.overallPlan.findUnique.mockResolvedValue({
        id: 'plan-1',
        status: PlanStatus.APPROVED,
      });

      await expect(service.approve({ id: 'plan-1', approvedById: 'approver-1' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('approves a pending plan and writes an audit log', async () => {
      prisma.overallPlan.findUnique.mockResolvedValue({
        id: 'plan-1',
        requestId: 'request-1',
        status: PlanStatus.PENDING_APPROVAL,
        request: {
          id: 'request-1',
          position: 'Backend Engineer',
          status: RecruitmentRequestStatus.PLANNING,
          createdById: 'dept-head-1',
        },
      });
      prisma.overallPlan.update.mockResolvedValue({ id: 'plan-1', status: PlanStatus.APPROVED });
      prisma.recruitmentRequest.update.mockResolvedValue({
        id: 'request-1',
        status: RecruitmentRequestStatus.PLAN_APPROVED,
      });
      prisma.requestLog.create.mockResolvedValue({ id: 'log-1' });

      const result = await service.approve({ id: 'plan-1', approvedById: 'approver-1' });

      expect(prisma.overallPlan.update).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
        data: { status: PlanStatus.APPROVED, approvedById: 'approver-1' },
      });
      expect(prisma.recruitmentRequest.update).toHaveBeenCalledWith({
        where: { id: 'request-1' },
        data: { status: RecruitmentRequestStatus.PLAN_APPROVED },
      });
      expect(prisma.requestLog.create).toHaveBeenCalledWith({
        data: {
          requestId: 'request-1',
          action: 'OVERALL_PLAN_APPROVED',
          fromStatus: RecruitmentRequestStatus.PLANNING,
          toStatus: RecruitmentRequestStatus.PLAN_APPROVED,
          performedById: 'approver-1',
          metadata: { overallPlanId: 'plan-1' },
        },
      });
      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: AuditEntityType.PLAN,
          entityId: 'plan-1',
          action: AuditAction.PLAN_APPROVED,
          fromStatus: PlanStatus.PENDING_APPROVAL,
          toStatus: PlanStatus.APPROVED,
          performedById: 'approver-1',
        }),
      );
      expect(result).toEqual({ id: 'plan-1', status: PlanStatus.APPROVED });
      expect(notificationClient.send).toHaveBeenCalledWith(
        'notification.create_notification',
        expect.objectContaining({
          userId: 'dept-head-1',
          relatedEntityId: 'request-1',
        }),
      );
    });
  });

  describe('reject', () => {
    it('throws if revisionNotes are missing', async () => {
      prisma.overallPlan.findUnique.mockResolvedValue({
        id: 'plan-1',
        status: PlanStatus.PENDING_APPROVAL,
      });

      await expect(
        service.reject({ id: 'plan-1', approvedById: 'approver-1', revisionNotes: '   ' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a pending plan and writes an audit log with reason', async () => {
      prisma.overallPlan.findUnique.mockResolvedValue({
        id: 'plan-1',
        status: PlanStatus.PENDING_APPROVAL,
      });
      prisma.overallPlan.update.mockResolvedValue({ id: 'plan-1', status: PlanStatus.REJECTED });

      await service.reject({
        id: 'plan-1',
        approvedById: 'approver-1',
        revisionNotes: 'Needs more detail',
      });

      expect(prisma.overallPlan.update).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
        data: {
          status: PlanStatus.REJECTED,
          approvedById: 'approver-1',
          revisionNotes: 'Needs more detail',
        },
      });
      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: AuditEntityType.PLAN,
          entityId: 'plan-1',
          action: AuditAction.PLAN_REJECTED,
          fromStatus: PlanStatus.PENDING_APPROVAL,
          toStatus: PlanStatus.REJECTED,
          performedById: 'approver-1',
          reason: 'Needs more detail',
        }),
      );
    });
  });
});
