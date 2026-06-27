import type { Queue } from 'bullmq';
import {
  EmailStatus,
  NotificationType,
  PlanStatus,
  RecruitmentRequestStatus,
  TaskReminderJobPayloadSchema,
  TaskStatus,
} from '@wr/contracts';
import { JOB_NAMES } from '@wr/queue';
import { prisma } from '@wr/database';

export async function scanDueTaskReminders(taskReminderQueue: Queue): Promise<number> {
  const due = await prisma.taskReminder.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: { lte: new Date() },
      taskPlan: {
        status: { not: TaskStatus.COMPLETED },
        overallPlan: {
          status: PlanStatus.APPROVED,
          request: {
            status: {
              in: [
                RecruitmentRequestStatus.ACTIVE,
                RecruitmentRequestStatus.SCREENING,
                RecruitmentRequestStatus.INTERVIEWING,
              ],
            },
          },
        },
      },
    },
    take: 100,
    orderBy: { scheduledFor: 'asc' },
  });

  for (const reminder of due) {
    await taskReminderQueue.add(
      JOB_NAMES.SEND_TASK_REMINDER,
      {
        taskPlanId: reminder.taskPlanId,
        reminderKey: reminder.reminderKey,
        scheduledFor: reminder.scheduledFor.toISOString(),
      },
      {
        jobId: `task-reminder-${reminder.id}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 1000,
        removeOnFail: true,
      },
    );
  }

  return due.length;
}

export async function processTaskReminderJob(payload: unknown, emailQueue: Queue): Promise<void> {
  const parsed = TaskReminderJobPayloadSchema.parse(payload);
  const reminder = await prisma.taskReminder.findUnique({
    where: {
      taskPlanId_reminderKey: {
        taskPlanId: parsed.taskPlanId,
        reminderKey: parsed.reminderKey,
      },
    },
    include: {
      taskPlan: {
        include: {
          assignedTo: true,
          overallPlan: { include: { request: true } },
        },
      },
    },
  });

  if (!reminder || reminder.status !== 'PENDING') return;
  if (reminder.taskPlan.status === TaskStatus.COMPLETED) {
    await prisma.taskReminder.update({
      where: { id: reminder.id },
      data: { status: 'SKIPPED' },
    });
    return;
  }
  if (
    reminder.taskPlan.overallPlan.status !== PlanStatus.APPROVED ||
    ![
      RecruitmentRequestStatus.ACTIVE,
      RecruitmentRequestStatus.SCREENING,
      RecruitmentRequestStatus.INTERVIEWING,
    ].includes(reminder.taskPlan.overallPlan.request.status as RecruitmentRequestStatus)
  ) {
    await prisma.taskReminder.update({
      where: { id: reminder.id },
      data: { status: 'SKIPPED', errorMessage: 'Plan or request is not active and approved' },
    });
    return;
  }

  const claimed = await prisma.taskReminder.updateMany({
    where: { id: reminder.id, status: 'PENDING' },
    data: { status: 'PROCESSING' },
  });
  if (claimed.count === 0) return;

  const assignee = reminder.taskPlan.assignedTo;
  const request = reminder.taskPlan.overallPlan.request;
  const deadline = reminder.taskPlan.endDate.toLocaleString('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'full',
    timeStyle: 'short',
  });
  const timing = parsed.reminderKey === '24h-before' ? 'due within 24 hours' : 'due now';
  const subject = `Task deadline reminder: ${request.position}`;
  const body = [
    `Hello ${assignee.displayName},`,
    '',
    `Your ${reminder.taskPlan.taskType} task for ${request.position} is ${timing}.`,
    `Deadline: ${deadline} (ICT).`,
    '',
    'Please complete the task or update its status in the recruitment system.',
  ].join('\n');

  try {
    let emailLog = reminder.emailLogId
      ? await prisma.emailLog.findUnique({ where: { id: reminder.emailLogId } })
      : null;
    if (!emailLog) {
      emailLog = await prisma.$transaction(async (tx) => {
        const log = await tx.emailLog.create({
          data: {
            userId: assignee.id,
            toEmail: assignee.email,
            subject,
            body,
            status: EmailStatus.PENDING,
          },
        });
        await tx.notification.create({
          data: {
            userId: assignee.id,
            type: NotificationType.TASK_REMINDER,
            title: subject,
            body,
            relatedEntityId: reminder.taskPlanId,
            relatedEntityType: 'TaskPlan',
          },
        });
        await tx.taskReminder.update({
          where: { id: reminder.id },
          data: { emailLogId: log.id, errorMessage: null },
        });
        return log;
      });
    }

    await emailQueue.add(
      JOB_NAMES.SEND_EMAIL,
      {
        emailLogId: emailLog.id,
        to: assignee.email,
        subject,
        body,
      },
      {
        jobId: `email-log-${emailLog.id}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );

    await prisma.taskReminder.update({
      where: { id: reminder.id },
      data: { status: 'SENT', sentAt: new Date(), errorMessage: null },
    });
  } catch (error) {
    await prisma.taskReminder.update({
      where: { id: reminder.id },
      data: {
        status: 'PENDING',
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}
