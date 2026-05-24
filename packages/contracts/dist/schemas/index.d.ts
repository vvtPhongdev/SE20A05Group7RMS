import { z } from 'zod';
import { DocumentType, WorkMode, CandidateVisibility, ApplicationStatus, ReadinessLabel } from '../enums';
/**
 * Shared Zod schemas for runtime validation.
 * Used across API DTOs and worker payloads.
 */
export declare const UuidSchema: z.ZodString;
export declare const SourceLocationSchema: z.ZodObject<{
    sourceDocumentId: z.ZodString;
    pageNumber: z.ZodOptional<z.ZodNumber>;
    sectionTitle: z.ZodOptional<z.ZodString>;
    startOffset: z.ZodOptional<z.ZodNumber>;
    endOffset: z.ZodOptional<z.ZodNumber>;
    rawText: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sourceDocumentId: string;
    pageNumber?: number | undefined;
    sectionTitle?: string | undefined;
    startOffset?: number | undefined;
    endOffset?: number | undefined;
    rawText?: string | undefined;
}, {
    sourceDocumentId: string;
    pageNumber?: number | undefined;
    sectionTitle?: string | undefined;
    startOffset?: number | undefined;
    endOffset?: number | undefined;
    rawText?: string | undefined;
}>;
export type SourceLocation = z.infer<typeof SourceLocationSchema>;
export declare const CreateUserSchema: z.ZodObject<{
    email: z.ZodString;
    displayName: z.ZodString;
    role: z.ZodEnum<["CANDIDATE", "RECRUITER", "HIRING_MANAGER", "DEPARTMENT_HEAD", "ADMIN"]>;
}, "strip", z.ZodTypeAny, {
    email: string;
    displayName: string;
    role: "CANDIDATE" | "RECRUITER" | "HIRING_MANAGER" | "DEPARTMENT_HEAD" | "ADMIN";
}, {
    email: string;
    displayName: string;
    role: "CANDIDATE" | "RECRUITER" | "HIRING_MANAGER" | "DEPARTMENT_HEAD" | "ADMIN";
}>;
export declare const CreateRoleSchema: z.ZodObject<{
    title: z.ZodString;
    organizationId: z.ZodString;
    workMode: z.ZodOptional<z.ZodNativeEnum<typeof WorkMode>>;
    location: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    organizationId: string;
    workMode?: WorkMode | undefined;
    location?: string | undefined;
    description?: string | undefined;
}, {
    title: string;
    organizationId: string;
    workMode?: WorkMode | undefined;
    location?: string | undefined;
    description?: string | undefined;
}>;
export declare const UpdateCandidateProfileSchema: z.ZodObject<{
    headline: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
    visibility: z.ZodOptional<z.ZodNativeEnum<typeof CandidateVisibility>>;
    preferredWorkMode: z.ZodOptional<z.ZodNativeEnum<typeof WorkMode>>;
    preferredLocations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    yearsOfExperience: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    headline?: string | undefined;
    summary?: string | undefined;
    visibility?: CandidateVisibility | undefined;
    preferredWorkMode?: WorkMode | undefined;
    preferredLocations?: string[] | undefined;
    yearsOfExperience?: number | undefined;
}, {
    headline?: string | undefined;
    summary?: string | undefined;
    visibility?: CandidateVisibility | undefined;
    preferredWorkMode?: WorkMode | undefined;
    preferredLocations?: string[] | undefined;
    yearsOfExperience?: number | undefined;
}>;
export declare const DocumentUploadSchema: z.ZodObject<{
    documentType: z.ZodNativeEnum<typeof DocumentType>;
    fileName: z.ZodString;
    mimeType: z.ZodEnum<["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]>;
    fileSizeBytes: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    documentType: DocumentType;
    fileName: string;
    mimeType: "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    fileSizeBytes: number;
}, {
    documentType: DocumentType;
    fileName: string;
    mimeType: "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    fileSizeBytes: number;
}>;
export declare const CreateApplicationSchema: z.ZodObject<{
    roleId: z.ZodString;
    coverNote: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    roleId: string;
    coverNote?: string | undefined;
}, {
    roleId: string;
    coverNote?: string | undefined;
}>;
export declare const UpdateApplicationStatusSchema: z.ZodObject<{
    status: z.ZodNativeEnum<typeof ApplicationStatus>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: ApplicationStatus;
    reason?: string | undefined;
}, {
    status: ApplicationStatus;
    reason?: string | undefined;
}>;
export declare const EvidenceRecordSchema: z.ZodObject<{
    id: z.ZodString;
    evaluationRunId: z.ZodString;
    evidenceType: z.ZodEnum<["CLAIM", "GAP", "HARD_CONSTRAINT", "INTERVIEW_FOCUS"]>;
    content: z.ZodString;
    confidence: z.ZodOptional<z.ZodNumber>;
    sourceLocations: z.ZodArray<z.ZodObject<{
        sourceDocumentId: z.ZodString;
        pageNumber: z.ZodOptional<z.ZodNumber>;
        sectionTitle: z.ZodOptional<z.ZodString>;
        startOffset: z.ZodOptional<z.ZodNumber>;
        endOffset: z.ZodOptional<z.ZodNumber>;
        rawText: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        sourceDocumentId: string;
        pageNumber?: number | undefined;
        sectionTitle?: string | undefined;
        startOffset?: number | undefined;
        endOffset?: number | undefined;
        rawText?: string | undefined;
    }, {
        sourceDocumentId: string;
        pageNumber?: number | undefined;
        sectionTitle?: string | undefined;
        startOffset?: number | undefined;
        endOffset?: number | undefined;
        rawText?: string | undefined;
    }>, "many">;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    evaluationRunId: string;
    evidenceType: "CLAIM" | "GAP" | "HARD_CONSTRAINT" | "INTERVIEW_FOCUS";
    content: string;
    sourceLocations: {
        sourceDocumentId: string;
        pageNumber?: number | undefined;
        sectionTitle?: string | undefined;
        startOffset?: number | undefined;
        endOffset?: number | undefined;
        rawText?: string | undefined;
    }[];
    confidence?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    id: string;
    evaluationRunId: string;
    evidenceType: "CLAIM" | "GAP" | "HARD_CONSTRAINT" | "INTERVIEW_FOCUS";
    content: string;
    sourceLocations: {
        sourceDocumentId: string;
        pageNumber?: number | undefined;
        sectionTitle?: string | undefined;
        startOffset?: number | undefined;
        endOffset?: number | undefined;
        rawText?: string | undefined;
    }[];
    confidence?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export type EvidenceRecord = z.infer<typeof EvidenceRecordSchema>;
export declare const BaseJobPayloadSchema: z.ZodObject<{
    jobId: z.ZodString;
    idempotencyKey: z.ZodString;
    actorId: z.ZodOptional<z.ZodString>;
    resourceId: z.ZodString;
    resourceVersion: z.ZodOptional<z.ZodString>;
    requestedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    jobId: string;
    idempotencyKey: string;
    resourceId: string;
    requestedAt: string;
    actorId?: string | undefined;
    resourceVersion?: string | undefined;
}, {
    jobId: string;
    idempotencyKey: string;
    resourceId: string;
    requestedAt: string;
    actorId?: string | undefined;
    resourceVersion?: string | undefined;
}>;
export type BaseJobPayload = z.infer<typeof BaseJobPayloadSchema>;
export declare const DocumentParsePayloadSchema: z.ZodObject<{
    jobId: z.ZodString;
    idempotencyKey: z.ZodString;
    actorId: z.ZodOptional<z.ZodString>;
    resourceId: z.ZodString;
    resourceVersion: z.ZodOptional<z.ZodString>;
    requestedAt: z.ZodString;
} & {
    documentType: z.ZodNativeEnum<typeof DocumentType>;
    filePath: z.ZodString;
}, "strip", z.ZodTypeAny, {
    documentType: DocumentType;
    jobId: string;
    idempotencyKey: string;
    resourceId: string;
    requestedAt: string;
    filePath: string;
    actorId?: string | undefined;
    resourceVersion?: string | undefined;
}, {
    documentType: DocumentType;
    jobId: string;
    idempotencyKey: string;
    resourceId: string;
    requestedAt: string;
    filePath: string;
    actorId?: string | undefined;
    resourceVersion?: string | undefined;
}>;
export declare const EvaluationPayloadSchema: z.ZodObject<{
    jobId: z.ZodString;
    idempotencyKey: z.ZodString;
    actorId: z.ZodOptional<z.ZodString>;
    resourceId: z.ZodString;
    resourceVersion: z.ZodOptional<z.ZodString>;
    requestedAt: z.ZodString;
} & {
    applicationId: z.ZodString;
    roleId: z.ZodString;
    candidateProfileId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    roleId: string;
    jobId: string;
    idempotencyKey: string;
    resourceId: string;
    requestedAt: string;
    applicationId: string;
    candidateProfileId: string;
    actorId?: string | undefined;
    resourceVersion?: string | undefined;
}, {
    roleId: string;
    jobId: string;
    idempotencyKey: string;
    resourceId: string;
    requestedAt: string;
    applicationId: string;
    candidateProfileId: string;
    actorId?: string | undefined;
    resourceVersion?: string | undefined;
}>;
export declare const TalentSearchSchema: z.ZodObject<{
    query: z.ZodString;
    filters: z.ZodOptional<z.ZodObject<{
        workMode: z.ZodOptional<z.ZodNativeEnum<typeof WorkMode>>;
        location: z.ZodOptional<z.ZodString>;
        minYearsExperience: z.ZodOptional<z.ZodNumber>;
        visibility: z.ZodOptional<z.ZodNativeEnum<typeof CandidateVisibility>>;
    }, "strip", z.ZodTypeAny, {
        workMode?: WorkMode | undefined;
        location?: string | undefined;
        visibility?: CandidateVisibility | undefined;
        minYearsExperience?: number | undefined;
    }, {
        workMode?: WorkMode | undefined;
        location?: string | undefined;
        visibility?: CandidateVisibility | undefined;
        minYearsExperience?: number | undefined;
    }>>;
    pagination: z.ZodOptional<z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        pageSize: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        pageSize: number;
    }, {
        page?: number | undefined;
        pageSize?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    query: string;
    filters?: {
        workMode?: WorkMode | undefined;
        location?: string | undefined;
        visibility?: CandidateVisibility | undefined;
        minYearsExperience?: number | undefined;
    } | undefined;
    pagination?: {
        page: number;
        pageSize: number;
    } | undefined;
}, {
    query: string;
    filters?: {
        workMode?: WorkMode | undefined;
        location?: string | undefined;
        visibility?: CandidateVisibility | undefined;
        minYearsExperience?: number | undefined;
    } | undefined;
    pagination?: {
        page?: number | undefined;
        pageSize?: number | undefined;
    } | undefined;
}>;
export type TalentSearchInput = z.infer<typeof TalentSearchSchema>;
export declare const MatchedSkillSchema: z.ZodObject<{
    skill: z.ZodString;
    source: z.ZodEnum<["exact", "alias", "graph_expansion", "vector_similarity"]>;
    confidence: z.ZodNumber;
    evidence: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    confidence: number;
    skill: string;
    source: "exact" | "alias" | "graph_expansion" | "vector_similarity";
    evidence?: string | undefined;
}, {
    confidence: number;
    skill: string;
    source: "exact" | "alias" | "graph_expansion" | "vector_similarity";
    evidence?: string | undefined;
}>;
export type MatchedSkill = z.infer<typeof MatchedSkillSchema>;
export declare const TalentSearchResultSchema: z.ZodObject<{
    candidateProfileId: z.ZodString;
    displayName: z.ZodString;
    headline: z.ZodOptional<z.ZodString>;
    overallScore: z.ZodNumber;
    vectorScore: z.ZodNumber;
    graphScore: z.ZodNumber;
    coverageScore: z.ZodNumber;
    readinessLabel: z.ZodNativeEnum<typeof ReadinessLabel>;
    matchedSkills: z.ZodArray<z.ZodObject<{
        skill: z.ZodString;
        source: z.ZodEnum<["exact", "alias", "graph_expansion", "vector_similarity"]>;
        confidence: z.ZodNumber;
        evidence: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        confidence: number;
        skill: string;
        source: "exact" | "alias" | "graph_expansion" | "vector_similarity";
        evidence?: string | undefined;
    }, {
        confidence: number;
        skill: string;
        source: "exact" | "alias" | "graph_expansion" | "vector_similarity";
        evidence?: string | undefined;
    }>, "many">;
    gaps: z.ZodArray<z.ZodObject<{
        skill: z.ZodString;
        gapType: z.ZodString;
        severity: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        skill: string;
        gapType: string;
        severity: string;
    }, {
        skill: string;
        gapType: string;
        severity: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    displayName: string;
    candidateProfileId: string;
    overallScore: number;
    vectorScore: number;
    graphScore: number;
    coverageScore: number;
    readinessLabel: ReadinessLabel;
    matchedSkills: {
        confidence: number;
        skill: string;
        source: "exact" | "alias" | "graph_expansion" | "vector_similarity";
        evidence?: string | undefined;
    }[];
    gaps: {
        skill: string;
        gapType: string;
        severity: string;
    }[];
    headline?: string | undefined;
}, {
    displayName: string;
    candidateProfileId: string;
    overallScore: number;
    vectorScore: number;
    graphScore: number;
    coverageScore: number;
    readinessLabel: ReadinessLabel;
    matchedSkills: {
        confidence: number;
        skill: string;
        source: "exact" | "alias" | "graph_expansion" | "vector_similarity";
        evidence?: string | undefined;
    }[];
    gaps: {
        skill: string;
        gapType: string;
        severity: string;
    }[];
    headline?: string | undefined;
}>;
export type TalentSearchResult = z.infer<typeof TalentSearchResultSchema>;
//# sourceMappingURL=index.d.ts.map