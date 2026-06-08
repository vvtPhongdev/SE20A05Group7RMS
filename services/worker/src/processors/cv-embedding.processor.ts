import { PrismaClient } from '@prisma/client';
import { EmbeddingGenerateJobPayload } from '@wr/contracts';

// Singleton Prisma client (same pattern as other services)
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
});

/**
 * Process a CV embedding generation job.
 *   1️⃣ Retrieve the CV record (optional sanity check).
 *   2️⃣ Generate a 384‑dimensional embedding using @xenova/transformers (all‑MiniLM‑L6‑v2).
 *   3️⃣ Upsert CvEmbedding metadata (chunkIndex, chunkText, model).
 *   4️⃣ Store the vector in the pgvector column via raw SQL.
 */
export async function processCvEmbeddingJob(payload: EmbeddingGenerateJobPayload): Promise<void> {
  const { cvDocumentId, rawText } = payload;

  // Verify CV exists
  const cv = await prisma.candidateCV.findUnique({ where: { id: cvDocumentId } });
  if (!cv) {
    throw new Error(`CV document ${cvDocumentId} not found`);
  }

  // Load transformer model lazily
  const { pipeline } = await import('@xenova/transformers' as string);
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  const output = await extractor(rawText, { pooling: 'mean', normalize: true });
  const embedding = Array.from(output.data as Float32Array) as number[];

  // Upsert embedding metadata (excluding pgvector column)
  await prisma.cvEmbedding.upsert({
    where: { cvDocumentId },
    update: { textHash: 'TODO_HASH' }, // placeholder for future hash implementation
    create: {
      cvDocumentId,
      chunkIndex: 0,
      chunkText: rawText,
      model: 'all-MiniLM-L6-v2',
    },
  });

  // Retrieve generated row ID
  const record = await prisma.cvEmbedding.findUnique({
    where: { cvDocumentId },
    select: { id: true },
  });
  if (!record) {
    throw new Error('Failed to create CvEmbedding record');
  }

  // Store vector in pgvector column via raw SQL
  const vectorStr = `[${embedding.join(',')}]`;
  await prisma.$executeRawUnsafe(
    `UPDATE cv_embeddings SET embedding = $1::vector WHERE id = $2`,
    vectorStr,
    record.id,
  );
}
