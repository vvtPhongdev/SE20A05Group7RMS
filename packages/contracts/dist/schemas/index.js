import { z } from 'zod';
import { DocumentType, WorkMode, CandidateVisibility, ApplicationStatus, ReadinessLabel } from '../enums';
/**
 * Shared Zod schemas for runtime validation.
 * Used across API DTOs and worker payloads.
 */
// ─── Base Schemas ──────────────────────────────────────────────────
export const UuidSchema = z.string().uuid();
export const SourceLocationSchema = z.object({
    sourceDocumentId: z.string().uuid(),
    pageNumber: z.number().int().optional(),
    sectionTitle: z.string().optional(),
    startOffset: z.number().int().optional(),
    endOffset: z.number().int().optional(),
    rawText: z.string().optional(),
});
// ─── User & Auth ───────────────────────────────────────────────────
export const CreateUserSchema = z.object({
    email: z.string().email(),
    displayName: z.string().min(1).max(255),
    role: z.enum(['CANDIDATE', 'RECRUITER', 'HIRING_MANAGER', 'DEPARTMENT_HEAD', 'ADMIN']),
});
// ─── Role / JD ─────────────────────────────────────────────────────
export const CreateRoleSchema = z.object({
    title: z.string().min(1).max(500),
    organizationId: z.string().uuid(),
    workMode: z.nativeEnum(WorkMode).optional(),
    location: z.string().max(255).optional(),
    description: z.string().optional(),
});
// ─── Candidate Profile ─────────────────────────────────────────────
export const UpdateCandidateProfileSchema = z.object({
    headline: z.string().max(500).optional(),
    summary: z.string().optional(),
    visibility: z.nativeEnum(CandidateVisibility).optional(),
    preferredWorkMode: z.nativeEnum(WorkMode).optional(),
    preferredLocations: z.array(z.string()).optional(),
    yearsOfExperience: z.number().int().nonnegative().optional(),
});
// ─── Document Upload ───────────────────────────────────────────────
export const DocumentUploadSchema = z.object({
    documentType: z.nativeEnum(DocumentType),
    fileName: z.string().min(1),
    mimeType: z.enum([
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]),
    fileSizeBytes: z.number().int().positive(),
});
// ─── Application ───────────────────────────────────────────────────
export const CreateApplicationSchema = z.object({
    roleId: z.string().uuid(),
    coverNote: z.string().max(2000).optional(),
});
export const UpdateApplicationStatusSchema = z.object({
    status: z.nativeEnum(ApplicationStatus),
    reason: z.string().max(1000).optional(),
});
// ─── Evidence Record ───────────────────────────────────────────────
export const EvidenceRecordSchema = z.object({
    id: z.string().uuid(),
    evaluationRunId: z.string().uuid(),
    evidenceType: z.enum(['CLAIM', 'GAP', 'HARD_CONSTRAINT', 'INTERVIEW_FOCUS']),
    content: z.string(),
    confidence: z.number().min(0).max(1).optional(),
    sourceLocations: z.array(SourceLocationSchema),
    metadata: z.record(z.unknown()).optional(),
});
// ─── BullMQ Job Payloads ───────────────────────────────────────────
export const BaseJobPayloadSchema = z.object({
    jobId: z.string(),
    idempotencyKey: z.string(),
    actorId: z.string().uuid().optional(),
    resourceId: z.string().uuid(),
    resourceVersion: z.string().optional(),
    requestedAt: z.string().datetime(),
});
export const DocumentParsePayloadSchema = BaseJobPayloadSchema.extend({
    documentType: z.nativeEnum(DocumentType),
    filePath: z.string(),
});
export const EvaluationPayloadSchema = BaseJobPayloadSchema.extend({
    applicationId: z.string().uuid(),
    roleId: z.string().uuid(),
    candidateProfileId: z.string().uuid(),
});
// ─── Talent Search ─────────────────────────────────────────────────
export const TalentSearchSchema = z.object({
    query: z.string().min(1).max(500),
    filters: z
        .object({
        workMode: z.nativeEnum(WorkMode).optional(),
        location: z.string().max(255).optional(),
        minYearsExperience: z.number().int().nonnegative().optional(),
        visibility: z.nativeEnum(CandidateVisibility).optional(),
    })
        .optional(),
    pagination: z
        .object({
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().positive().max(50).default(20),
    })
        .optional(),
});
export const MatchedSkillSchema = z.object({
    skill: z.string(),
    source: z.enum(['exact', 'alias', 'graph_expansion', 'vector_similarity']),
    confidence: z.number().min(0).max(1),
    evidence: z.string().optional(),
});
export const TalentSearchResultSchema = z.object({
    candidateProfileId: z.string().uuid(),
    displayName: z.string(),
    headline: z.string().optional(),
    overallScore: z.number().min(0).max(1),
    vectorScore: z.number().min(0).max(1),
    graphScore: z.number().min(0).max(1),
    coverageScore: z.number().min(0).max(1),
    readinessLabel: z.nativeEnum(ReadinessLabel),
    matchedSkills: z.array(MatchedSkillSchema),
    gaps: z.array(z.object({
        skill: z.string(),
        gapType: z.string(),
        severity: z.string(),
    })),
});
//# sourceMappingURL=index.js.map