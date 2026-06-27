import { Prisma, PrismaClient } from '@prisma/client';
import { buildCvSearchText, extractCvWithAi, extractText, isCvAiConfigured } from '@wr/ai';
import { AuditAction, AuditEntityType, CvParseJobPayload } from '@wr/contracts';
import { AuditLogService } from '@wr/database';
import { logger } from '../logger';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

const auditLog = new AuditLogService(prisma);

export async function processCvParseJob(
  payload: CvParseJobPayload,
): Promise<{ cvDocumentId: string; rawText: string } | null> {
  const { cvDocumentId, filePath } = payload;
  const cvRecord = await prisma.candidateCV.findUnique({
    where: { id: cvDocumentId },
    include: { candidate: true },
  });

  if (!cvRecord) throw new Error(`CandidateCV with id ${cvDocumentId} not found`);

  if (cvRecord.processingStatus === 'COMPLETED' && cvRecord.parsedAt) {
    logger.log(`[Idempotency] CandidateCV ${cvDocumentId} has already been parsed. Skipping job.`);
    const resume = (cvRecord.structuredData as any)?.resume;
    return cvRecord.rawText
      ? { cvDocumentId, rawText: buildCvSearchText(cvRecord.rawText, resume) }
      : null;
  }

  await prisma.candidateCV.update({
    where: { id: cvDocumentId },
    data: { processingStatus: 'PROCESSING', processingError: null },
  });

  await auditLog
    .log({
      entityType: AuditEntityType.CV,
      entityId: cvDocumentId,
      action: AuditAction.CV_PARSE_STARTED,
      toStatus: 'PARSING',
      performedById: 'SYSTEM',
    })
    .catch((err) => logger.error('Failed to write audit log for CV_PARSE_STARTED:', err));

  try {
    const ext = filePath.split('.').pop()?.toUpperCase();
    const fileType =
      ext === 'DOCX' || cvRecord.fileType === 'DOCX'
        ? 'DOCX'
        : ext === 'DOC' || cvRecord.fileType === 'DOC'
          ? 'DOC'
          : 'PDF';

    const aiConfigured = isCvAiConfigured();
    let localText = cvRecord.rawText.trim();
    if (!localText) {
      try {
        localText = (await extractText(filePath, fileType)).trim();
      } catch (localError) {
        if (!aiConfigured) throw localError;
        logger.warn(
          `Local CV extraction failed for ${cvDocumentId}; continuing with vision OCR: ${
            localError instanceof Error ? localError.message : String(localError)
          }`,
        );
      }
    }

    const hasReliableLocalText = localText.replace(/\s/g, '').length >= 200;
    const extraction = aiConfigured
      ? await extractCvWithAi({
          fileName: cvRecord.fileName,
          fileType,
          fileUrl: filePath,
          rawText: localText,
        })
      : null;

    if (!extraction && !hasReliableLocalText) {
      throw new Error(
        'No readable text was found. Configure GEMINI_API_KEY to OCR scanned or image-based CV files.',
      );
    }

    const aiText = extraction?.documentText.trim() ?? '';
    const rawText = aiText.length >= localText.length ? aiText : localText;
    const method = extraction?.method ?? 'LOCAL_TEXT';
    const extractedAt = new Date();
    const cvStructuredData = extraction
      ? ({
          resume: extraction.resume,
          confidence: extraction.confidence,
          warnings: extraction.warnings,
          method,
          model: extraction.model ?? null,
        } as Prisma.InputJsonValue)
      : Prisma.JsonNull;

    const existingProfileData =
      cvRecord.candidate.structuredData && typeof cvRecord.candidate.structuredData === 'object'
        ? (cvRecord.candidate.structuredData as Record<string, unknown>)
        : {};
    const nextProfileData = extraction
      ? ({
          ...existingProfileData,
          resume: extraction.resume,
          skills: extraction.resume.skills?.technical ?? [],
          currentRole: extraction.resume.currentRole ?? existingProfileData.currentRole,
          yearsOfExperience:
            extraction.resume.yearsOfExperience ?? existingProfileData.yearsOfExperience,
          experience: extraction.resume.workExperience ?? [],
          education: extraction.resume.education ?? [],
          cvExtraction: {
            cvDocumentId,
            confidence: extraction.confidence,
            warnings: extraction.warnings,
            method,
            model: extraction.model ?? null,
            extractedAt: extractedAt.toISOString(),
          },
        } as Prisma.InputJsonValue)
      : undefined;

    await prisma.$transaction(async (tx) => {
      await tx.candidateCV.update({
        where: { id: cvDocumentId },
        data: {
          rawText,
          parsedAt: extractedAt,
          processingStatus: 'COMPLETED',
          processingMethod: method,
          processingError: null,
          structuredData: cvStructuredData,
          extractedAt: extraction ? extractedAt : null,
        },
      });
      if (nextProfileData) {
        await tx.candidateProfile.update({
          where: { id: cvRecord.candidateId },
          data: {
            structuredData: nextProfileData,
            ...(extraction?.resume.summary && !cvRecord.candidate.summary
              ? { summary: extraction.resume.summary }
              : {}),
            ...(extraction?.resume.personalInfo?.phoneNumber && !cvRecord.candidate.phone
              ? { phone: extraction.resume.personalInfo.phoneNumber }
              : {}),
          },
        });
      }
    });

    await auditLog
      .log({
        entityType: AuditEntityType.CV,
        entityId: cvDocumentId,
        action: AuditAction.CV_PARSE_COMPLETED,
        fromStatus: 'PARSING',
        toStatus: 'PARSED',
        performedById: 'SYSTEM',
        metadata: {
          method,
          model: extraction?.model ?? null,
          confidence: extraction?.confidence ?? null,
        },
      })
      .catch((err) => logger.error('Failed to write audit log for CV_PARSE_COMPLETED:', err));

    logger.log(`CV ${cvDocumentId} parsed and stored (type=${fileType}, method=${method})`);
    return { cvDocumentId, rawText: buildCvSearchText(rawText, extraction?.resume) };
  } catch (err) {
    await prisma.candidateCV
      .update({
        where: { id: cvDocumentId },
        data: {
          processingStatus: 'FAILED',
          processingError: err instanceof Error ? err.message : String(err),
        },
      })
      .catch((updateErr) => logger.error('Failed to persist CV processing failure:', updateErr));

    await auditLog
      .log({
        entityType: AuditEntityType.CV,
        entityId: cvDocumentId,
        action: AuditAction.CV_PARSE_FAILED,
        fromStatus: 'PARSING',
        toStatus: 'FAILED',
        performedById: 'SYSTEM',
        reason: err instanceof Error ? err.message : String(err),
      })
      .catch((logErr) => logger.error('Failed to write audit log for CV_PARSE_FAILED:', logErr));

    throw err;
  }
}
