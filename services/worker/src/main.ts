import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../../.env') });

import { Worker } from 'bullmq';
import { QUEUE_NAMES } from '@wr/queue';
import Redis from 'ioredis';
import { processCvParseJob as cvParseProcessor } from './processors/cv-parse.processor';
import { processCvEmbeddingJob as embeddingProcessor } from './processors/cv-embedding.processor';
import { processEmailSendJob as emailProcessor } from './processors/email-send.processor';
import { config as appConfig } from './config';
import { wrapWorkerProcessor } from '@wr/logger';
import { logger } from './logger';

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

  // CV Parse Queue Worker
  const cvParseWorker = new Worker(
    QUEUE_NAMES.CV_PARSE,
    wrapWorkerProcessor(async (job) => {
      logger.log(`📄 Processing CV parse job: ${job.name} [${job.id}]`);
      await cvParseProcessor(job.data);
      logger.log(`✅ CV parse job ${job.id} completed`);
    }),
    workerOptions,
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

  // Graceful shutdown
  const workers = [cvParseWorker, embeddingWorker, emailWorker];

  const shutdown = async () => {
    logger.log('\n🛑 Shutting down workers...');
    await Promise.all(workers.map((w) => w.close()));
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
