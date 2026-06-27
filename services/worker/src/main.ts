import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../../.env') });

import { Queue, Worker } from 'bullmq';
import { JOB_NAMES, QUEUE_NAMES } from '@wr/queue';
import Redis from 'ioredis';
import { processCvParseJob as cvParseProcessor } from './processors/cv-parse.processor';
import { processCvEmbeddingJob as embeddingProcessor } from './processors/cv-embedding.processor';
import { processEmailSendJob as emailProcessor } from './processors/email-send.processor';
import { config as appConfig } from './config';
import { wrapWorkerProcessor } from '@wr/logger';
import { logger } from './logger';
import { processTaskReminderJob, scanDueTaskReminders } from './processors/task-reminder.processor';

/**
 * Worker bootstrap — starts BullMQ workers for each queue.
 */
async function bootstrap() {
  const redisUrl = appConfig.REDIS_URL;
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Required by BullMQ for blocking operations
  });

  logger.log(`🔌 Worker connecting to Redis at ${redisUrl}`);

  // Optimized options for Redis connection to prevent rate limiting (especially on Upstash)
  const workerOptions = {
    connection: client,
    stalledInterval: 300000, // Check for stalled jobs every 5 minutes (default 30s)
    drainDelay: 30, // Poll every 30 seconds when queue is empty (default 5s)
  };
  const cvParseWorkerOptions = {
    ...workerOptions,
    drainDelay: 1,
  };
  const embeddingQueue = new Queue(QUEUE_NAMES.EMBEDDING_GENERATE, {
    connection: client,
  });
  const emailQueue = new Queue(QUEUE_NAMES.EMAIL_SEND, { connection: client });
  const taskReminderQueue = new Queue(QUEUE_NAMES.TASK_REMINDER, { connection: client });

  await taskReminderQueue.add(
    JOB_NAMES.SCAN_TASK_REMINDERS,
    {},
    {
      jobId: 'task-reminder-scanner',
      repeat: { every: 5 * 60 * 1000 },
      removeOnComplete: 10,
    },
  );

  // CV Parse Queue Worker
  const cvParseWorker = new Worker(
    QUEUE_NAMES.CV_PARSE,
    wrapWorkerProcessor(async (job) => {
      logger.log(`📄 Processing CV parse job: ${job.name} [${job.id}]`);
      const parsedCv = await cvParseProcessor(job.data);
      if (parsedCv?.rawText) {
        await embeddingQueue.add(
          JOB_NAMES.GENERATE_EMBEDDING,
          {
            cvDocumentId: parsedCv.cvDocumentId,
            rawText: parsedCv.rawText,
          },
          {
            jobId: `cv-embedding-${parsedCv.cvDocumentId}-${Date.now()}`,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
          },
        );
      }
      logger.log(`✅ CV parse job ${job.id} completed`);
    }),
    cvParseWorkerOptions,
  );

  // Embedding Generation Queue Worker
  const embeddingWorker = new Worker(
    QUEUE_NAMES.EMBEDDING_GENERATE,
    wrapWorkerProcessor(async (job) => {
      logger.log(`🧬 Processing embedding job: ${job.name} [${job.id}]`);
      await embeddingProcessor(job.data);
      logger.log(`✅ Embedding job ${job.id} completed`);
    }),
    workerOptions,
  );

  // Email Send Queue Worker
  const emailWorker = new Worker(
    QUEUE_NAMES.EMAIL_SEND,
    wrapWorkerProcessor(async (job) => {
      logger.log(`📧 Processing email send job: ${job.name} [${job.id}]`);
      await emailProcessor(job.data);
      logger.log(`✅ Email send job ${job.id} completed`);
    }),
    workerOptions,
  );

  const taskReminderWorker = new Worker(
    QUEUE_NAMES.TASK_REMINDER,
    wrapWorkerProcessor(async (job) => {
      if (job.name === JOB_NAMES.SCAN_TASK_REMINDERS) {
        const count = await scanDueTaskReminders(taskReminderQueue);
        logger.log(`Task reminder scan queued ${count} due reminder(s)`);
        return;
      }
      if (job.name === JOB_NAMES.SEND_TASK_REMINDER) {
        await processTaskReminderJob(job.data, emailQueue);
      }
    }),
    workerOptions,
  );

  // Graceful shutdown
  const workers = [cvParseWorker, embeddingWorker, emailWorker, taskReminderWorker];

  const shutdown = async () => {
    logger.log('\n🛑 Shutting down workers...');
    await Promise.all(workers.map((w) => w.close()));
    await embeddingQueue.close();
    await emailQueue.close();
    await taskReminderQueue.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  logger.log(`✅ Worker started — listening on ${Object.values(QUEUE_NAMES).length} queues`);
  logger.log(`   Queues: ${Object.values(QUEUE_NAMES).join(', ')}`);
}

bootstrap().catch((err) => {
  logger.error('❌ Worker failed to start:', err);
  process.exit(1);
});
