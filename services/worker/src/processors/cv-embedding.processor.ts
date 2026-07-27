import { embeddingToPgVector, getEmbedding } from '@wr/ai';
import { AuditLogService, prisma } from '@wr/database';
import { AuditAction, AuditEntityType, EmbeddingGenerateJobPayload } from '@wr/contracts';
import { logger } from '../logger';

const auditLog = new AuditLogService(prisma);

/**
 * Process a CV embedding generation job.
 *   1️⃣ Retrieve the CV record (optional sanity check).
 *   2️⃣ Generate a 384-dimensional embedding using the local RMS ONNX model.
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

  const embedding = await getEmbedding(rawText);

  // Replace existing embeddings so profile-enriched CV text refreshes vector search.
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
  await prisma.$executeRawUnsafe(
    `UPDATE cv_embeddings SET embedding = $1::vector WHERE id = $2`,
    embeddingToPgVector(embedding),
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
    .catch((err) => logger.error('Failed to write audit log for CV_EMBEDDING_GENERATED:', err));
}
