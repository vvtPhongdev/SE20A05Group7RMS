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
export declare const RegisterUserSchema: z.ZodObject<{
    email: z.ZodString;
    displayName: z.ZodString;
    password: z.ZodString;
    role: z.ZodEnum<["CANDIDATE", "RECRUITER", "HIRING_MANAGER", "DEPARTMENT_HEAD", "ADMIN"]>;
}, "strip", z.ZodTypeAny, {
    email: string;
    displayName: string;
    role: "CANDIDATE" | "RECRUITER" | "HIRING_MANAGER" | "DEPARTMENT_HEAD" | "ADMIN";
    password: string;
}, {
    email: string;
    displayName: string;
    role: "CANDIDATE" | "RECRUITER" | "HIRING_MANAGER" | "DEPARTMENT_HEAD" | "ADMIN";
    password: string;
}>;
export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginInput = z.infer<typeof LoginSchema>;
export declare const RefreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const ForgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const ResetPasswordSchema: z.ZodObject<{
    email: z.ZodString;
    code: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    email: string;
    newPassword: string;
}, {
    code: string;
    email: string;
    newPassword: string;
}>;
export declare const AuthTokenResponseSchema: z.ZodObject<{
    accessToken: z.ZodString;
    refreshToken: z.ZodString;
    expiresIn: z.ZodNumber;
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        displayName: z.ZodString;
        role: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        displayName: string;
        role: string;
        id: string;
    }, {
        email: string;
        displayName: string;
        role: string;
        id: string;
    }>;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
    accessToken: string;
    expiresIn: number;
    user: {
        email: string;
        displayName: string;
        role: string;
        id: string;
    };
}, {
    refreshToken: string;
    accessToken: string;
    expiresIn: number;
    user: {
        email: string;
        displayName: string;
        role: string;
        id: string;
    };
}>;
export type AuthTokenResponse = z.infer<typeof AuthTokenResponseSchema>;
export declare const CreateOrganizationSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug: string;
}, {
    name: string;
    slug: string;
}>;
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export declare const AddOrganizationMemberSchema: z.ZodObject<{
    userId: z.ZodString;
    memberRole: z.ZodEnum<["OWNER", "ADMIN", "MEMBER"]>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    memberRole: "ADMIN" | "OWNER" | "MEMBER";
}, {
    userId: string;
    memberRole: "ADMIN" | "OWNER" | "MEMBER";
}>;
export declare const CreateDepartmentSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
    headUserId: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    headUserId?: string | undefined;
    parentId?: string | undefined;
}, {
    code: string;
    name: string;
    headUserId?: string | undefined;
    parentId?: string | undefined;
}>;
export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;
export declare const UpdateDepartmentSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    code: z.ZodOptional<z.ZodString>;
    headUserId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    parentId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    name?: string | undefined;
    headUserId?: string | undefined;
    parentId?: string | undefined;
}, {
    code?: string | undefined;
    name?: string | undefined;
    headUserId?: string | undefined;
    parentId?: string | undefined;
}>;
export declare const CreateApprovalChainSchema: z.ZodObject<{
    name: z.ZodString;
    departmentId: z.ZodOptional<z.ZodString>;
    isDefault: z.ZodOptional<z.ZodBoolean>;
    levels: z.ZodArray<z.ZodObject<{
        level: z.ZodNumber;
        approverUserId: z.ZodString;
        role: z.ZodEnum<["LEVEL_1", "LEVEL_2", "LEVEL_3"]>;
    }, "strip", z.ZodTypeAny, {
        role: "LEVEL_1" | "LEVEL_2" | "LEVEL_3";
        level: number;
        approverUserId: string;
    }, {
        role: "LEVEL_1" | "LEVEL_2" | "LEVEL_3";
        level: number;
        approverUserId: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    levels: {
        role: "LEVEL_1" | "LEVEL_2" | "LEVEL_3";
        level: number;
        approverUserId: string;
    }[];
    departmentId?: string | undefined;
    isDefault?: boolean | undefined;
}, {
    name: string;
    levels: {
        role: "LEVEL_1" | "LEVEL_2" | "LEVEL_3";
        level: number;
        approverUserId: string;
    }[];
    departmentId?: string | undefined;
    isDefault?: boolean | undefined;
}>;
export type CreateApprovalChainInput = z.infer<typeof CreateApprovalChainSchema>;
export declare const CreateHiringRequestSchema: z.ZodObject<{
    departmentId: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    justification: z.ZodOptional<z.ZodString>;
    headcount: z.ZodDefault<z.ZodNumber>;
    priority: z.ZodDefault<z.ZodEnum<["LOW", "NORMAL", "HIGH", "URGENT"]>>;
    workMode: z.ZodOptional<z.ZodNativeEnum<typeof WorkMode>>;
    location: z.ZodOptional<z.ZodString>;
    budgetRange: z.ZodOptional<z.ZodObject<{
        min: z.ZodNumber;
        max: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        min: number;
        max: number;
        currency: string;
    }, {
        min: number;
        max: number;
        currency: string;
    }>>;
    targetStartDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    departmentId: string;
    headcount: number;
    priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    workMode?: WorkMode | undefined;
    location?: string | undefined;
    description?: string | undefined;
    justification?: string | undefined;
    budgetRange?: {
        min: number;
        max: number;
        currency: string;
    } | undefined;
    targetStartDate?: string | undefined;
}, {
    title: string;
    departmentId: string;
    workMode?: WorkMode | undefined;
    location?: string | undefined;
    description?: string | undefined;
    justification?: string | undefined;
    headcount?: number | undefined;
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT" | undefined;
    budgetRange?: {
        min: number;
        max: number;
        currency: string;
    } | undefined;
    targetStartDate?: string | undefined;
}>;
export type CreateHiringRequestInput = z.infer<typeof CreateHiringRequestSchema>;
export declare const UpdateHiringRequestSchema: z.ZodObject<{
    departmentId: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    justification: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    headcount: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    priority: z.ZodOptional<z.ZodDefault<z.ZodEnum<["LOW", "NORMAL", "HIGH", "URGENT"]>>>;
    workMode: z.ZodOptional<z.ZodOptional<z.ZodNativeEnum<typeof WorkMode>>>;
    location: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    budgetRange: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        min: z.ZodNumber;
        max: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        min: number;
        max: number;
        currency: string;
    }, {
        min: number;
        max: number;
        currency: string;
    }>>>;
    targetStartDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    workMode?: WorkMode | undefined;
    location?: string | undefined;
    description?: string | undefined;
    departmentId?: string | undefined;
    justification?: string | undefined;
    headcount?: number | undefined;
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT" | undefined;
    budgetRange?: {
        min: number;
        max: number;
        currency: string;
    } | undefined;
    targetStartDate?: string | undefined;
}, {
    title?: string | undefined;
    workMode?: WorkMode | undefined;
    location?: string | undefined;
    description?: string | undefined;
    departmentId?: string | undefined;
    justification?: string | undefined;
    headcount?: number | undefined;
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT" | undefined;
    budgetRange?: {
        min: number;
        max: number;
        currency: string;
    } | undefined;
    targetStartDate?: string | undefined;
}>;
export declare const SubmitHiringRequestSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const ApproveRejectRequestSchema: z.ZodObject<{
    decision: z.ZodEnum<["APPROVED", "REJECTED", "REVISION_REQUESTED"]>;
    comments: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    decision: "APPROVED" | "REJECTED" | "REVISION_REQUESTED";
    comments?: string | undefined;
}, {
    decision: "APPROVED" | "REJECTED" | "REVISION_REQUESTED";
    comments?: string | undefined;
}>;
export type ApproveRejectRequestInput = z.infer<typeof ApproveRejectRequestSchema>;
export declare const CreateInviteSchema: z.ZodObject<{
    roleId: z.ZodString;
    candidateId: z.ZodString;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    roleId: string;
    candidateId: string;
    message?: string | undefined;
}, {
    roleId: string;
    candidateId: string;
    message?: string | undefined;
}>;
export type CreateInviteInput = z.infer<typeof CreateInviteSchema>;
export declare const RespondToInviteSchema: z.ZodObject<{
    decision: z.ZodEnum<["ACCEPTED", "DECLINED"]>;
}, "strip", z.ZodTypeAny, {
    decision: "ACCEPTED" | "DECLINED";
}, {
    decision: "ACCEPTED" | "DECLINED";
}>;
export declare const CreateReviewerFeedbackSchema: z.ZodObject<{
    evaluationRunId: z.ZodString;
    sectionTag: z.ZodString;
    comment: z.ZodString;
    isChallenge: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    evaluationRunId: string;
    sectionTag: string;
    comment: string;
    isChallenge: boolean;
}, {
    evaluationRunId: string;
    sectionTag: string;
    comment: string;
    isChallenge?: boolean | undefined;
}>;
export type CreateReviewerFeedbackInput = z.infer<typeof CreateReviewerFeedbackSchema>;
export declare const ExplanationBoxSchema: z.ZodObject<{
    evaluationRunId: z.ZodString;
    headline: z.ZodString;
    sections: z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        body: z.ZodString;
        evidenceIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        body: string;
        evidenceIds?: string[] | undefined;
    }, {
        title: string;
        body: string;
        evidenceIds?: string[] | undefined;
    }>, "many">;
    confidence: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    headline: string;
    evaluationRunId: string;
    confidence: number;
    sections: {
        title: string;
        body: string;
        evidenceIds?: string[] | undefined;
    }[];
}, {
    headline: string;
    evaluationRunId: string;
    confidence: number;
    sections: {
        title: string;
        body: string;
        evidenceIds?: string[] | undefined;
    }[];
}>;
export type ExplanationBox = z.infer<typeof ExplanationBoxSchema>;
export declare const InterviewFocusItemSchema: z.ZodObject<{
    evaluationRunId: z.ZodString;
    topic: z.ZodString;
    rationale: z.ZodString;
    suggestedQuestions: z.ZodArray<z.ZodString, "many">;
    linkedGapId: z.ZodOptional<z.ZodString>;
    linkedEvidenceIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    priority: z.ZodEnum<["HIGH", "MEDIUM", "LOW"]>;
}, "strip", z.ZodTypeAny, {
    evaluationRunId: string;
    priority: "LOW" | "HIGH" | "MEDIUM";
    topic: string;
    rationale: string;
    suggestedQuestions: string[];
    linkedGapId?: string | undefined;
    linkedEvidenceIds?: string[] | undefined;
}, {
    evaluationRunId: string;
    priority: "LOW" | "HIGH" | "MEDIUM";
    topic: string;
    rationale: string;
    suggestedQuestions: string[];
    linkedGapId?: string | undefined;
    linkedEvidenceIds?: string[] | undefined;
}>;
export type InterviewFocusItem = z.infer<typeof InterviewFocusItemSchema>;
export declare const GeneratePacketSchema: z.ZodObject<{
    applicationId: z.ZodString;
    evaluationRunId: z.ZodString;
    sections: z.ZodArray<z.ZodEnum<["READINESS", "EVIDENCE", "GAPS", "INTERVIEW_FOCUS", "EXPLANATION", "REVIEWER_FEEDBACK"]>, "many">;
}, "strip", z.ZodTypeAny, {
    evaluationRunId: string;
    applicationId: string;
    sections: ("INTERVIEW_FOCUS" | "READINESS" | "EVIDENCE" | "GAPS" | "EXPLANATION" | "REVIEWER_FEEDBACK")[];
}, {
    evaluationRunId: string;
    applicationId: string;
    sections: ("INTERVIEW_FOCUS" | "READINESS" | "EVIDENCE" | "GAPS" | "EXPLANATION" | "REVIEWER_FEEDBACK")[];
}>;
export type GeneratePacketInput = z.infer<typeof GeneratePacketSchema>;
export declare const SharePacketSchema: z.ZodObject<{
    packetId: z.ZodString;
    recipientUserIds: z.ZodArray<z.ZodString, "many">;
    expiresInHours: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    packetId: string;
    recipientUserIds: string[];
    expiresInHours?: number | undefined;
}, {
    packetId: string;
    recipientUserIds: string[];
    expiresInHours?: number | undefined;
}>;
export type SharePacketInput = z.infer<typeof SharePacketSchema>;
export declare const SkillNodeSchema: z.ZodObject<{
    canonicalName: z.ZodString;
    category: z.ZodEnum<["LANGUAGE", "FRAMEWORK", "LIBRARY", "DATABASE", "CLOUD", "DEVOPS", "PARADIGM", "ROLE", "DOMAIN", "TOOL", "PLATFORM"]>;
    aliases: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    canonicalName: string;
    category: "LANGUAGE" | "FRAMEWORK" | "LIBRARY" | "DATABASE" | "CLOUD" | "DEVOPS" | "PARADIGM" | "ROLE" | "DOMAIN" | "TOOL" | "PLATFORM";
    aliases?: string[] | undefined;
}, {
    canonicalName: string;
    category: "LANGUAGE" | "FRAMEWORK" | "LIBRARY" | "DATABASE" | "CLOUD" | "DEVOPS" | "PARADIGM" | "ROLE" | "DOMAIN" | "TOOL" | "PLATFORM";
    aliases?: string[] | undefined;
}>;
export type SkillNode = z.infer<typeof SkillNodeSchema>;
//# sourceMappingURL=index.d.ts.map