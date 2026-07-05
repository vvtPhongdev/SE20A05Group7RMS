import { prisma } from '@wr/database';
import { processTaskReminderJob, scanDueTaskReminders } from './task-reminder.processor';

jest.mock('@wr/database', () => ({
  prisma: {
    taskReminder: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    emailLog: { create: jest.fn(), findUnique: jest.fn() },
    notification: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

describe('task reminder processor', () => {
  const db = prisma as any;
  const queue = { add: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    db.$transaction.mockImplementation(async (callback: any) => callback(db));
  });

  it('queues each due reminder with a stable job id', async () => {
    db.taskReminder.findMany.mockResolvedValue([
      {
        id: 'reminder-1',
        taskPlanId: '9f0d6d75-9c6e-4ad4-a826-8114bc300e47',
        reminderKey: 'deadline',
        scheduledFor: new Date('2026-06-20T09:00:00.000Z'),
      },
    ]);

    await expect(scanDueTaskReminders(queue as any)).resolves.toBe(1);
    expect(queue.add).toHaveBeenCalledWith(
      'send-task-reminder',
      expect.objectContaining({ reminderKey: 'deadline' }),
      expect.objectContaining({ jobId: 'task-reminder-reminder-1', removeOnFail: true }),
    );
  });

  it('creates one email log and notification before queueing delivery', async () => {
    db.taskReminder.findUnique.mockResolvedValue({
      id: 'reminder-1',
      status: 'PENDING',
      taskPlanId: '9f0d6d75-9c6e-4ad4-a826-8114bc300e47',
      emailLogId: null,
      taskPlan: {
        status: 'IN_PROGRESS',
        taskType: 'JOB_POSTING',
        endDate: new Date('2026-06-21T09:00:00.000Z'),
        assignedTo: {
          id: 'user-1',
          email: 'owner@example.com',
          displayName: 'Task Owner',
        },
        overallPlan: {
          status: 'APPROVED',
          request: { position: 'Backend Engineer', status: 'ACTIVE' },
        },
      },
    });
    db.taskReminder.updateMany.mockResolvedValue({ count: 1 });
    db.emailLog.create.mockResolvedValue({ id: 'email-1' });
    db.notification.create.mockResolvedValue({ id: 'notification-1' });
    db.taskReminder.update.mockResolvedValue({});

    await processTaskReminderJob(
      {
        taskPlanId: '9f0d6d75-9c6e-4ad4-a826-8114bc300e47',
        reminderKey: 'deadline',
        scheduledFor: '2026-06-21T09:00:00.000Z',
      },
      queue as any,
    );

    expect(db.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: 'TASK_REMINDER' }) }),
    );
    expect(queue.add).toHaveBeenCalledWith(
      'send-email',
      expect.objectContaining({ emailLogId: 'email-1', to: 'owner@example.com' }),
      expect.objectContaining({ jobId: 'email-log-email-1' }),
    );
    expect(db.taskReminder.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'SENT' }) }),
    );
  });

  it('returns the reminder to PENDING when email queueing fails', async () => {
    db.taskReminder.findUnique.mockResolvedValue({
      id: 'reminder-1',
      status: 'PENDING',
      emailLogId: 'email-1',
      taskPlanId: '9f0d6d75-9c6e-4ad4-a826-8114bc300e47',
      taskPlan: {
        status: 'IN_PROGRESS',
        taskType: 'JOB_POSTING',
        endDate: new Date('2026-06-21T09:00:00.000Z'),
        assignedTo: { id: 'user-1', email: 'owner@example.com', displayName: 'Task Owner' },
        overallPlan: {
          status: 'APPROVED',
          request: { position: 'Backend Engineer', status: 'ACTIVE' },
        },
      },
    });
    db.taskReminder.updateMany.mockResolvedValue({ count: 1 });
    db.emailLog.findUnique.mockResolvedValue({ id: 'email-1' });
    queue.add.mockRejectedValueOnce(new Error('Redis unavailable'));

    await expect(
      processTaskReminderJob(
        {
          taskPlanId: '9f0d6d75-9c6e-4ad4-a826-8114bc300e47',
          reminderKey: 'deadline',
          scheduledFor: '2026-06-21T09:00:00.000Z',
        },
        queue as any,
      ),
    ).rejects.toThrow('Redis unavailable');

    expect(db.emailLog.create).not.toHaveBeenCalled();
    expect(db.notification.create).not.toHaveBeenCalled();
    expect(db.taskReminder.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING' }) }),
    );
  });

  it('skips reminders when the plan is not approved', async () => {
    db.taskReminder.findUnique.mockResolvedValue({
      id: 'reminder-1',
      status: 'PENDING',
      taskPlan: {
        status: 'IN_PROGRESS',
        overallPlan: { status: 'DRAFT', request: { status: 'ACTIVE' } },
      },
    });

    await processTaskReminderJob(
      {
        taskPlanId: '9f0d6d75-9c6e-4ad4-a826-8114bc300e47',
        reminderKey: 'deadline',
        scheduledFor: '2026-06-21T09:00:00.000Z',
      },
      queue as any,
    );

    expect(queue.add).not.toHaveBeenCalled();
    expect(db.taskReminder.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'SKIPPED' }) }),
    );
  });

  it('skips reminders when the task has no deadline', async () => {
    db.taskReminder.findUnique.mockResolvedValue({
      id: 'reminder-1',
      status: 'PENDING',
      taskPlan: {
        status: 'IN_PROGRESS',
        endDate: null,
        overallPlan: {
          status: 'APPROVED',
          request: { status: 'ACTIVE' },
        },
      },
    });

    await processTaskReminderJob(
      {
        taskPlanId: '9f0d6d75-9c6e-4ad4-a826-8114bc300e47',
        reminderKey: 'deadline',
        scheduledFor: '2026-06-21T09:00:00.000Z',
      },
      queue as any,
    );

    expect(queue.add).not.toHaveBeenCalled();
    expect(db.taskReminder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'SKIPPED', errorMessage: 'Task has no deadline' }),
      }),
    );
  });
});
