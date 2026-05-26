// ─── Embedding Processor ───────────────────────────────────────────
// BullMQ processor that generates vector embeddings for evidence records.
// Triggered when new evidence is extracted or updated.
//
// SETUP NOTE: This processor requires the `@xenova/transformers` package
// for self-hosted all-MiniLM-L6-v2 inference. Install it in the worker:
//   npm install @xenova/transformers
//
// The processor:
// 1. Receives evidence text from the queue
// 2. Generates a 384-dimensional embedding vector
// 3. Stores it in the evidence_embeddings table
// 4. The embedding is later used by the TalentSearchService for vector similarity

import { createHash } from 'crypto';

export interface EmbeddingJobPayload {
  evidenceRecordId: string;
  text: string;
}

/**
 * Compute SHA-256 hash of text to detect changes.
 */
function textHash(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 16);
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
export async function processEmbeddingJob(
  payload: EmbeddingJobPayload,
  prisma: any, // PrismaClient — use `any` to avoid tight coupling to prisma package
): Promise<void> {
  const { evidenceRecordId, text } = payload;
  const hash = textHash(text);

  // Check if embedding already exists with same hash (skip if unchanged)
  const existing = await prisma.evidenceEmbedding.findUnique({
    where: { evidenceRecordId },
  });

  if (existing && existing.textHash === hash) {
    return; // Already up-to-date
  }

  // Generate embedding using transformers.js (lazy-loaded)
  // NOTE: The model is loaded on first call and cached in-process.
  const { pipeline } = await import('@xenova/transformers' as string);
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  const embedding = Array.from(output.data as Float32Array) as number[];

  // Upsert the embedding record (metadata only — Prisma-managed columns)
  await prisma.evidenceEmbedding.upsert({
    where: { evidenceRecordId },
    update: { textHash: hash },
    create: {
      evidenceRecordId,
      textHash: hash,
      model: 'all-MiniLM-L6-v2',
    },
  });

  // Store the actual vector via raw SQL (pgvector column not in Prisma schema)
  const embeddingId = (await prisma.evidenceEmbedding.findUnique({
    where: { evidenceRecordId },
    select: { id: true },
  }))!.id;

  const vectorStr = `[${embedding.join(',')}]`;
  await prisma.$executeRawUnsafe(
    `UPDATE evidence_embeddings SET embedding = $1::vector WHERE id = $2`,
    vectorStr,
    embeddingId,
  );
}
