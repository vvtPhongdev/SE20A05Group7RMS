import { HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RpcException } from '@nestjs/microservices';
import { PlanStatus, RecruitmentRequestStatus, TaskType, UserRole } from '@wr/contracts';
import { PLAN_LOCKED_KEY } from '../decorators/plan-locked.decorator';
import { PlanLockedGuard } from './plan-locked.guard';

describe('PlanLockedGuard', () => {
  const makeContext = (payload: Record<string, unknown>) =>
    ({
      getHandler: jest.fn(),
      switchToRpc: () => ({
        getData: () => payload,
      }),
    }) as any;

  const makeGuard = (overrides: Record<string, unknown> = {}) => {
    const reflector = {
      get: jest.fn((key: string) => (key === PLAN_LOCKED_KEY ? TaskType.CV_COLLECTION : undefined)),
    } as unknown as Reflector;
    const prisma = {
      recruitmentRequest: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'request-1',
          status: RecruitmentRequestStatus.ACTIVE,
        }),
      },
      overallPlan: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'plan-1',
          status: PlanStatus.APPROVED,
        }),
      },
      taskPlan: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'task-1',
          assignedToId: 'recruiter-1',
          taskType: TaskType.CV_COLLECTION,
        }),
      },
      ...overrides,
    };

    return { guard: new PlanLockedGuard(reflector, prisma as any), prisma };
  };

  it('allows the HR recruiter assigned to the activity task', async () => {
    const { guard } = makeGuard();

    await expect(
      guard.canActivate(
        makeContext({
          requestId: 'request-1',
          actorUserId: 'recruiter-1',
          actorRole: UserRole.HR_RECRUITER,
        }),
      ),
    ).resolves.toBe(true);
  });

  it('blocks an HR recruiter who is not assigned to the activity task', async () => {
    const { guard } = makeGuard();

    await expect(
      guard.canActivate(
        makeContext({
          requestId: 'request-1',
          actorUserId: 'recruiter-2',
          actorRole: UserRole.HR_RECRUITER,
        }),
      ),
    ).rejects.toMatchObject({
      error: {
        status: HttpStatus.FORBIDDEN,
        message: `Only the HR recruiter assigned to ${TaskType.CV_COLLECTION} can perform this action`,
      },
    });
  });

  it('allows candidates to apply when the campaign is active and the task exists', async () => {
    const { guard } = makeGuard();

    await expect(
      guard.canActivate(
        makeContext({
          requestId: 'request-1',
          actorUserId: 'candidate-1',
          actorRole: UserRole.CANDIDATE,
        }),
      ),
    ).resolves.toBe(true);
  });

  it('blocks execution before the campaign is started', async () => {
    const { guard } = makeGuard({
      recruitmentRequest: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'request-1',
          status: RecruitmentRequestStatus.PLAN_APPROVED,
        }),
      },
    });

    await expect(
      guard.canActivate(
        makeContext({
          requestId: 'request-1',
          actorUserId: 'recruiter-1',
          actorRole: UserRole.HR_RECRUITER,
        }),
      ),
    ).rejects.toBeInstanceOf(RpcException);
  });
});
