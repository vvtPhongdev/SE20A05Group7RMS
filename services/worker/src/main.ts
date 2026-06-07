import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../../.env') });

import { Worker } from 'bullmq';
import { QUEUE_NAMES } from '@wr/queue';
import Redis from 'ioredis';

/**
 * Worker bootstrap — starts BullMQ workers for each queue.
 */
async function bootstrap() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Required by BullMQ for blocking operations
  });

  console.log(`🔌 Worker connecting to Redis at ${redisUrl}`);
  
  // Optimized options for Redis connection to prevent rate limiting (especially on Upstash)
  const workerOptions = {
    connection: client,
    stalledInterval: 300000, // Check for stalled jobs every 5 minutes (default 30s)
    drainDelay: 30,          // Poll every 30 seconds when queue is empty (default 5s)
  };

  // CV Parse Queue Worker
  const cvParseWorker = new Worker(
    QUEUE_NAMES.CV_PARSE,
    async (job) => {
      console.log(`📄 Processing CV parse job: ${job.name} [${job.id}]`);
      // TODO: implement CV parsing logic
      console.log(`✅ CV parse job ${job.id} completed (stub)`);
    },
    workerOptions,
  );

  // Embedding Generation Queue Worker
  const embeddingWorker = new Worker(
    QUEUE_NAMES.EMBEDDING_GENERATE,
    async (job) => {
      console.log(`🧬 Processing embedding job: ${job.name} [${job.id}]`);
      // TODO: implement embedding generation logic
      console.log(`✅ Embedding job ${job.id} completed (stub)`);
    },
    workerOptions,
  );

  // Email Send Queue Worker
  const emailWorker = new Worker(
    QUEUE_NAMES.EMAIL_SEND,
    async (job) => {
      console.log(`📧 Processing email send job: ${job.name} [${job.id}]`);
      // TODO: implement email sending logic
      console.log(`✅ Email send job ${job.id} completed (stub)`);
    },
    workerOptions,
  );

  // Graceful shutdown
  const workers = [cvParseWorker, embeddingWorker, emailWorker];

  const shutdown = async () => {
    console.log('\n🛑 Shutting down workers...');
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  console.log(`✅ Worker started — listening on ${Object.values(QUEUE_NAMES).length} queues`);
  console.log(`   Queues: ${Object.values(QUEUE_NAMES).join(', ')}`);
}

bootstrap().catch((err) => {
  console.error('❌ Worker failed to start:', err);
  process.exit(1);
});
