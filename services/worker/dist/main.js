"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const queue_1 = require("@wr/queue");
/**
 * Worker bootstrap — starts BullMQ workers for each queue.
 */
async function bootstrap() {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    const connection = new ioredis_1.default({
        host: redisHost,
        port: redisPort,
        maxRetriesPerRequest: null,
    });
    console.log(`🔌 Worker connecting to Redis at ${redisHost}:${redisPort}`);
    // Document Processing Queue
    const documentWorker = new bullmq_1.Worker(queue_1.QUEUE_NAMES.DOCUMENT_PROCESSING, async (job) => {
        console.log(`📄 Processing document job: ${job.name} [${job.id}]`);
        // TODO: implement cv.parse, jd.parse, evidence.extract processors
        console.log(`✅ Document job ${job.id} completed (stub)`);
    }, { connection });
    // Embedding Generation Queue
    const embeddingWorker = new bullmq_1.Worker(queue_1.QUEUE_NAMES.EMBEDDING_GENERATION, async (job) => {
        console.log(`🧬 Processing embedding job: ${job.name} [${job.id}]`);
        // TODO: implement embedding.generate processor
        console.log(`✅ Embedding job ${job.id} completed (stub)`);
    }, { connection });
    // Evaluation Queue
    const evaluationWorker = new bullmq_1.Worker(queue_1.QUEUE_NAMES.EVALUATION, async (job) => {
        console.log(`🎯 Processing evaluation job: ${job.name} [${job.id}]`);
        // TODO: implement application.evaluate processor
        console.log(`✅ Evaluation job ${job.id} completed (stub)`);
    }, { connection });
    // Packet Export Queue
    const packetWorker = new bullmq_1.Worker(queue_1.QUEUE_NAMES.PACKET_EXPORT, async (job) => {
        console.log(`📦 Processing packet job: ${job.name} [${job.id}]`);
        // TODO: implement packet.export processor
        console.log(`✅ Packet job ${job.id} completed (stub)`);
    }, { connection });
    // Graceful shutdown
    const workers = [documentWorker, embeddingWorker, evaluationWorker, packetWorker];
    const shutdown = async () => {
        console.log('\n🛑 Shutting down workers...');
        await Promise.all(workers.map((w) => w.close()));
        await connection.quit();
        process.exit(0);
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    console.log(`✅ Worker started — listening on ${Object.values(queue_1.QUEUE_NAMES).length} queues`);
    console.log(`   Queues: ${Object.values(queue_1.QUEUE_NAMES).join(', ')}`);
}
bootstrap().catch((err) => {
    console.error('❌ Worker failed to start:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map