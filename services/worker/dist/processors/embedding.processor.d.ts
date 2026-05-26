export interface EmbeddingJobPayload {
    evidenceRecordId: string;
    text: string;
}
/**
 * Process an embedding job.
 * Call this from your BullMQ worker setup (e.g., in main.ts).
 *
 * @example
 * ```ts
 * import { Worker } from 'bullmq';
 * import { processEmbeddingJob } from './processors/embedding.processor';
 *
 * new Worker('embedding', async (job) => {
 *   await processEmbeddingJob(job.data, prisma);
 * }, { connection: redis });
 * ```
 */
export declare function processEmbeddingJob(payload: EmbeddingJobPayload, prisma: any): Promise<void>;
//# sourceMappingURL=embedding.processor.d.ts.map