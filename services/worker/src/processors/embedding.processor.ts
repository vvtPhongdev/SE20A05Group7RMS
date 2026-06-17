// ─── Embedding Processor ───────────────────────────────────────────
// BullMQ processor that generates vector embeddings for evidence records.
// Triggered when new evidence is extracted or updated.
//
// SETUP NOTE: This processor uses the local RMS ONNX embedding model
// exported into packages/ai-models/rms-embedding-model.
//
// The processor:
// 1. Receives evidence text from the queue
// 2. Generates a 384-dimensional embedding vector
// 3. Stores it in the evidence_embeddings table
// 4. The embedding is later used by the TalentSearchService for vector similarity

import { createHash } from 'crypto';
import { EMBEDDING_MODEL_VERSION, embeddingToPgVector, getEmbedding } from '@wr/ai';

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

  const embedding = await getEmbedding(text);

  // Upsert the embedding record (metadata only — Prisma-managed columns)
  await prisma.evidenceEmbedding.upsert({
    where: { evidenceRecordId },
    update: { textHash: hash, model: EMBEDDING_MODEL_VERSION },
    create: {
      evidenceRecordId,
      textHash: hash,
      model: EMBEDDING_MODEL_VERSION,
    },
  });

  // Store the actual vector via raw SQL (pgvector column not in Prisma schema)
  const embeddingId = (await prisma.evidenceEmbedding.findUnique({
    where: { evidenceRecordId },
    select: { id: true },
  }))!.id;

  await prisma.$executeRawUnsafe(
    `UPDATE evidence_embeddings SET embedding = $1::vector WHERE id = $2`,
    embeddingToPgVector(embedding),
    embeddingId,
  );
}
