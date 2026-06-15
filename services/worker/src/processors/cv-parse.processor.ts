import { Prisma, PrismaClient } from '@prisma/client';
import { extractStructuredCvData, extractText } from '@wr/ai';
import {
  AuditAction,
  AuditEntityType,
  CvParseJobPayload,
  ResumeDraftSchema,
  type ResumeDraftData,
} from '@wr/contracts';
import { AuditLogService } from '@wr/database';
import { config } from '../config';
import { logger } from '../logger';

const prisma = new PrismaClient({
  log: config.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
});

const auditLog = new AuditLogService(prisma);

const populatedArray = <Item>(current: Item[] | undefined, extracted: Item[] | undefined) =>
  current && current.length > 0 ? current : extracted ?? [];

const populatedText = (current: string | undefined, extracted: string | undefined) =>
  current?.trim() || extracted?.trim() || undefined;

const limitedText = (value: string | undefined, maxLength: number, minLength = 1) => {
  const normalized = value?.trim();
  if (!normalized || normalized.length < minLength) return undefined;
  return normalized.slice(0, maxLength);
};

const httpUrl = (value: string | undefined) => {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

const toExtractedResume = (
  extracted: ReturnType<typeof extractStructuredCvData>,
): ResumeDraftData => {
  const linkedinUrl = httpUrl(extracted.linkedinUrl);
  return ResumeDraftSchema.parse({
    personalInfo: {
      fullName: limitedText(extracted.fullName, 100, 2),
      email: extracted.email,
      phoneNumber:
        extracted.phone && extracted.phone.trim().length <= 20 ? extracted.phone.trim() : undefined,
      address: limitedText(extracted.location, 200),
      links: linkedinUrl ? [{ type: 'LINKEDIN', url: linkedinUrl }] : [],
    },
    currentRole: limitedText(extracted.currentRole, 150),
    summary: limitedText(extracted.summary, 2000),
    skills: {
      technical: extracted.skills,
      softSkills: [],
      languages: [],
    },
    workExperience: extracted.experience.map((item) => ({
      company: limitedText(item.company, 200),
      position: limitedText(item.title, 200),
      achievements: item.description
        .split('\n')
        .map((achievement) => achievement.trim())
        .filter(Boolean)
        .slice(0, 50)
        .map((achievement) => achievement.slice(0, 500)),
    })),
    education: extracted.education.map((item) => ({
      school: limitedText(item.school, 200),
      degree: limitedText(item.degree, 100),
    })),
  });
};

const mergeResume = (
  current: ResumeDraftData,
  extracted: ResumeDraftData,
): ResumeDraftData =>
  ResumeDraftSchema.parse({
    personalInfo: {
      fullName: populatedText(current.personalInfo?.fullName, extracted.personalInfo?.fullName),
      email: populatedText(current.personalInfo?.email, extracted.personalInfo?.email),
      phoneNumber: populatedText(
        current.personalInfo?.phoneNumber,
        extracted.personalInfo?.phoneNumber,
      ),
      address: populatedText(current.personalInfo?.address, extracted.personalInfo?.address),
      links: populatedArray(current.personalInfo?.links, extracted.personalInfo?.links),
    },
    currentRole: populatedText(current.currentRole, extracted.currentRole),
    summary: populatedText(current.summary, extracted.summary),
    skills: {
      technical: populatedArray(current.skills?.technical, extracted.skills?.technical),
      softSkills: populatedArray(current.skills?.softSkills, extracted.skills?.softSkills),
      languages: populatedArray(current.skills?.languages, extracted.skills?.languages),
    },
    workExperience: populatedArray(current.workExperience, extracted.workExperience),
    education: populatedArray(current.education, extracted.education),
  });

export async function processCvParseJob(
  payload: CvParseJobPayload,
): Promise<{ cvDocumentId: string; rawText: string } | null> {
  const { cvDocumentId, filePath } = payload;
  const cvRecord = await prisma.candidateCV.findUnique({
    where: { id: cvDocumentId },
    include: {
      candidate: true,
    },
  });

  if (!cvRecord) {
    throw new Error(`CandidateCV with id ${cvDocumentId} not found`);
  }

  if (cvRecord.parsedAt || cvRecord.rawText) {
    logger.log(`[Idempotency] CandidateCV ${cvDocumentId} has already been parsed. Skipping job.`);
    return null;
  }

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
    const fileType = ext === 'DOCX' ? 'DOCX' : 'PDF';
    const rawText = await extractText(filePath, fileType);
    const extracted = extractStructuredCvData(rawText);
    const parsedAt = new Date();
    const currentStructuredData =
      cvRecord.candidate.structuredData &&
      typeof cvRecord.candidate.structuredData === 'object' &&
      !Array.isArray(cvRecord.candidate.structuredData)
        ? (cvRecord.candidate.structuredData as Record<string, any>)
        : {};
    const useExtractedArray = (current: unknown, parsed: unknown[]) =>
      Array.isArray(current) && current.length > 0 ? current : parsed;
    const currentResumeResult = ResumeDraftSchema.safeParse(currentStructuredData.resume);
    const currentResume = currentResumeResult.success ? currentResumeResult.data : {};
    const resume = mergeResume(currentResume, toExtractedResume(extracted));

    await prisma.$transaction([
      prisma.candidateCV.update({
        where: { id: cvDocumentId },
        data: {
          rawText,
          parsedAt,
        },
      }),
      prisma.candidateProfile.update({
        where: { id: cvRecord.candidateId },
        data: {
          ...(cvRecord.candidate.phone || !extracted.phone ? {} : { phone: extracted.phone }),
          ...(cvRecord.candidate.summary || !extracted.summary
            ? {}
            : { summary: extracted.summary }),
          structuredData: {
            ...currentStructuredData,
            resume,
            currentRole: currentStructuredData.currentRole || extracted.currentRole || '',
            location: currentStructuredData.location || extracted.location || '',
            linkedinUrl: currentStructuredData.linkedinUrl || extracted.linkedinUrl || '',
            skills: useExtractedArray(currentStructuredData.skills, extracted.skills),
            experience: useExtractedArray(currentStructuredData.experience, extracted.experience),
            education: useExtractedArray(currentStructuredData.education, extracted.education),
            latestCvExtraction: {
              ...extracted,
              cvDocumentId,
              parsedAt: parsedAt.toISOString(),
            },
          } as unknown as Prisma.InputJsonValue,
        },
      }),
    ]);

    await auditLog
      .log({
        entityType: AuditEntityType.CV,
        entityId: cvDocumentId,
        action: AuditAction.CV_PARSE_COMPLETED,
        fromStatus: 'PARSING',
        toStatus: 'PARSED',
        performedById: 'SYSTEM',
      })
      .catch((err) => logger.error('Failed to write audit log for CV_PARSE_COMPLETED:', err));

    logger.log(`CV ${cvDocumentId} parsed and stored (type=${fileType})`);
    return { cvDocumentId, rawText };
  } catch (err) {
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
