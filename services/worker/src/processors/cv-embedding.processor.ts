import { PrismaClient } from '@prisma/client';
import { AuditLogService } from '@wr/database';
import { AuditAction, AuditEntityType, EmbeddingGenerateJobPayload } from '@wr/contracts';
import { config } from '../config';

// Singleton Prisma client (same pattern as other services)
const prisma = new PrismaClient({
  log: config.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
});

const auditLog = new AuditLogService(prisma);

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

  // Idempotency check: check if embedding already exists for cvDocumentId
  const existingEmbedding = await prisma.cvEmbedding.findFirst({
    where: { cvDocumentId }
  });

  if (existingEmbedding) {
    console.log(`[Idempotency] CvEmbedding for CV document ${cvDocumentId} already exists. Skipping job.`);
    return;
  }

  // Load transformer model lazily
  const { pipeline } = await import('@xenova/transformers' as string);
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  const output = await extractor(rawText, { pooling: 'mean', normalize: true });
  const embedding = Array.from(output.data as Float32Array) as number[];

  // Delete any existing embeddings for this document to avoid duplication
  await prisma.cvEmbedding.deleteMany({
    where: { cvDocumentId },
  });

  // Create new embedding metadata record
  const record = await prisma.cvEmbedding.create({
    data: {
      cvDocumentId,
      chunkIndex: 0,
      chunkText: rawText,
    },
    select: { id: true },
  });

  // Store vector in pgvector column via raw SQL
  const vectorStr = `[${embedding.join(',')}]`;
  await prisma.$executeRawUnsafe(
    `UPDATE cv_embeddings SET embedding = $1::vector WHERE id = $2`,
    vectorStr,
    record.id,
  );

  await auditLog
    .log({
      entityType: AuditEntityType.CV_EMBEDDING,
      entityId: record.id,
      action: AuditAction.CV_EMBEDDING_GENERATED,
      toStatus: 'GENERATED',
      performedById: 'SYSTEM',
      metadata: { cvDocumentId },
    })
    .catch((err) => console.error('Failed to write audit log for CV_EMBEDDING_GENERATED:', err));
}
