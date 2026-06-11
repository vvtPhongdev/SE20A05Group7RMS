import { PrismaClient } from '@prisma/client';
import { AuditLogService } from '@wr/database';
import { extractText } from '@wr/ai'; // re‑exports cv‑parser utilities
import { AuditAction, AuditEntityType, CvParseJobPayload } from '@wr/contracts';
import { config } from '../config';

// Singleton Prisma client (same pattern as in other services)
const prisma = new PrismaClient({
  log: config.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
});

const auditLog = new AuditLogService(prisma);

/**
 * Process a CV parse job.
 *   1️⃣ Load the CandidateCV record.
 *   2️⃣ Extract raw text from the stored file (PDF or DOCX).
 *   3️⃣ Update the record with `rawText` and `parsedAt` timestamp.
 */
export async function processCvParseJob(payload: CvParseJobPayload): Promise<void> {
  const { cvDocumentId, filePath } = payload;

  await auditLog.log({
    entityType: AuditEntityType.CV,
    entityId: cvDocumentId,
    action: AuditAction.CV_PARSE_STARTED,
    toStatus: 'PARSING',
    performedById: 'SYSTEM',
  }).catch((err) => console.error('Failed to write audit log for CV_PARSE_STARTED:', err));

  try {
    // 1️⃣ Retrieve the CV record
    const cvRecord = await prisma.candidateCV.findUnique({
      where: { id: cvDocumentId },
    });

    if (!cvRecord) {
      throw new Error(`CandidateCV with id ${cvDocumentId} not found`);
    }

    // 2️⃣ Determine file type from extension (fallback to PDF)
    const ext = filePath.split('.').pop()?.toUpperCase();
    const fileType = ext === 'DOCX' ? 'DOCX' : 'PDF';

    // 3️⃣ Extract raw text using the helper utilities
    const rawText = await extractText(filePath, fileType as 'PDF' | 'DOCX');

    // 4️⃣ Persist the extracted text and mark as parsed
    await prisma.candidateCV.update({
      where: { id: cvDocumentId },
      data: {
        rawText,
        parsedAt: new Date(),
      },
    });

    await auditLog.log({
      entityType: AuditEntityType.CV,
      entityId: cvDocumentId,
      action: AuditAction.CV_PARSE_COMPLETED,
      fromStatus: 'PARSING',
      toStatus: 'PARSED',
      performedById: 'SYSTEM',
    }).catch((err) => console.error('Failed to write audit log for CV_PARSE_COMPLETED:', err));

    console.log(`✅ CV ${cvDocumentId} parsed and stored (type=${fileType})`);
  } catch (err) {
    await auditLog.log({
      entityType: AuditEntityType.CV,
      entityId: cvDocumentId,
      action: AuditAction.CV_PARSE_FAILED,
      fromStatus: 'PARSING',
      toStatus: 'FAILED',
      performedById: 'SYSTEM',
      reason: err instanceof Error ? err.message : String(err),
    }).catch((logErr) => console.error('Failed to write audit log for CV_PARSE_FAILED:', logErr));

    throw err;
  }
}
