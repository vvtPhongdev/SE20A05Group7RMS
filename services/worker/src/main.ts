import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../../.env') });

import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { wrapWorkerProcessor } from '@wr/logger';
import { JOB_NAMES, QUEUE_NAMES } from '@wr/queue';
import { config as appConfig } from './config';
import { logger } from './logger';
import { processCvEmbeddingJob as embeddingProcessor } from './processors/cv-embedding.processor';
import { processCvParseJob as cvParseProcessor } from './processors/cv-parse.processor';
import { processEmailSendJob as emailProcessor } from './processors/email-send.processor';

async function bootstrap() {
  const redisUrl = appConfig.REDIS_URL;
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
  });

  logger.log(`Worker connecting to Redis at ${redisUrl}`);

  const workerOptions = {
    connection: client,
    stalledInterval: 300000,
    drainDelay: 30,
  };
  const embeddingQueue = new Queue(QUEUE_NAMES.EMBEDDING_GENERATE, {
    connection: client,
  });

  const cvParseWorker = new Worker(
    QUEUE_NAMES.CV_PARSE,
    wrapWorkerProcessor(async (job) => {
      logger.log(`Processing CV parse job: ${job.name} [${job.id}]`);
      const parsed = await cvParseProcessor(job.data);
      if (parsed) {
        await embeddingQueue.add(JOB_NAMES.GENERATE_EMBEDDING, parsed, {
          jobId: `cv-embedding-${parsed.cvDocumentId}`,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        });
      }
      logger.log(`CV parse job ${job.id} completed`);
    }),
    workerOptions,
  );

  const embeddingWorker = new Worker(
    QUEUE_NAMES.EMBEDDING_GENERATE,
    wrapWorkerProcessor(async (job) => {
      logger.log(`Processing embedding job: ${job.name} [${job.id}]`);
      await embeddingProcessor(job.data);
      logger.log(`Embedding job ${job.id} completed`);
    }),
    workerOptions,
  );

  const emailWorker = new Worker(
    QUEUE_NAMES.EMAIL_SEND,
    wrapWorkerProcessor(async (job) => {
      logger.log(`Processing email send job: ${job.name} [${job.id}]`);
      await emailProcessor(job.data);
      logger.log(`Email send job ${job.id} completed`);
    }),
    workerOptions,
  );

  const workers = [cvParseWorker, embeddingWorker, emailWorker];
  const shutdown = async () => {
    logger.log('Shutting down workers...');
    await Promise.all([...workers.map((worker) => worker.close()), embeddingQueue.close()]);
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  logger.log(`Worker started on queues: ${Object.values(QUEUE_NAMES).join(', ')}`);
}

bootstrap().catch((err) => {
  logger.error('Worker failed to start:', err);
  process.exit(1);
});
