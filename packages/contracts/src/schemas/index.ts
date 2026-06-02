import { z } from 'zod';
import { DocumentType, WorkMode, CandidateVisibility, ApplicationStatus, ReadinessLabel, TaskPlanType, TaskPlanStatus } from '../enums';

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

export type SourceLocation = z.infer<typeof SourceLocationSchema>;

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

export type EvidenceRecord = z.infer<typeof EvidenceRecordSchema>;

// ─── BullMQ Job Payloads ───────────────────────────────────────────

export const BaseJobPayloadSchema = z.object({
  jobId: z.string(),
  idempotencyKey: z.string(),
  actorId: z.string().uuid().optional(),
  resourceId: z.string().uuid(),
  resourceVersion: z.string().optional(),
  requestedAt: z.string().datetime(),
});

export type BaseJobPayload = z.infer<typeof BaseJobPayloadSchema>;

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

export type TalentSearchInput = z.infer<typeof TalentSearchSchema>;

export const MatchedSkillSchema = z.object({
  skill: z.string(),
  source: z.enum(['exact', 'alias', 'graph_expansion', 'vector_similarity']),
  confidence: z.number().min(0).max(1),
  evidence: z.string().optional(),
});

export type MatchedSkill = z.infer<typeof MatchedSkillSchema>;

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
  gaps: z.array(
    z.object({
      skill: z.string(),
      gapType: z.string(),
      severity: z.string(),
    }),
  ),
});

export type TalentSearchResult = z.infer<typeof TalentSearchResultSchema>;

// ─── Auth ──────────────────────────────────────────────────────────

export const RegisterUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(255),
  password: z.string().min(8).max(128),
  role: z.enum(['CANDIDATE', 'RECRUITER', 'HIRING_MANAGER', 'DEPARTMENT_HEAD', 'ADMIN']),
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(8).max(128),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const AuthTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int().positive(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    displayName: z.string(),
    role: z.string(),
  }),
});

export type AuthTokenResponse = z.infer<typeof AuthTokenResponseSchema>;

// ─── Organization Management ───────────────────────────────────────

export const CreateOrganizationSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(2)
    .max(63)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be lowercase letters, numbers, hyphens'),
});

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;

export const AddOrganizationMemberSchema = z.object({
  userId: z.string().uuid(),
  memberRole: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
});

// ─── Department Management ─────────────────────────────────────────

export const CreateDepartmentSchema = z.object({
  name: z.string().min(1).max(255),
  code: z
    .string()
    .min(2)
    .max(20)
    .regex(/^[A-Z0-9_]+$/, 'Must be uppercase letters, numbers, underscores'),
  headUserId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
});

export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;

export const UpdateDepartmentSchema = CreateDepartmentSchema.partial();

// ─── Approval Chains ───────────────────────────────────────────────

export const CreateApprovalChainSchema = z.object({
  name: z.string().min(1).max(255),
  departmentId: z.string().uuid().optional(),
  isDefault: z.boolean().optional(),
  levels: z
    .array(
      z.object({
        level: z.number().int().positive(),
        approverUserId: z.string().uuid(),
        role: z.enum(['LEVEL_1', 'LEVEL_2', 'LEVEL_3']),
      }),
    )
    .min(1)
    .max(3),
});

export type CreateApprovalChainInput = z.infer<typeof CreateApprovalChainSchema>;

// ─── Hiring Requests ───────────────────────────────────────────────

export const CreateHiringRequestSchema = z.object({
  departmentId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  justification: z.string().max(5000).optional(),
  headcount: z.number().int().positive().max(100).default(1),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  workMode: z.nativeEnum(WorkMode).optional(),
  location: z.string().max(255).optional(),
  budgetRange: z
    .object({
      min: z.number().nonnegative(),
      max: z.number().nonnegative(),
      currency: z.string().length(3),
    })
    .optional(),
  targetStartDate: z.string().datetime().optional(),
});

export type CreateHiringRequestInput = z.infer<typeof CreateHiringRequestSchema>;

export const UpdateHiringRequestSchema = CreateHiringRequestSchema.partial();

export const SubmitHiringRequestSchema = z.object({
  id: z.string().uuid(),
});

export const ApproveRejectRequestSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'REVISION_REQUESTED']),
  comments: z.string().max(2000).optional(),
});

export type ApproveRejectRequestInput = z.infer<typeof ApproveRejectRequestSchema>;

// ─── Invites ───────────────────────────────────────────────────────

export const CreateInviteSchema = z.object({
  roleId: z.string().uuid(),
  candidateId: z.string().uuid(),
  message: z.string().max(2000).optional(),
});

export type CreateInviteInput = z.infer<typeof CreateInviteSchema>;

export const RespondToInviteSchema = z.object({
  decision: z.enum(['ACCEPTED', 'DECLINED']),
});

// ─── Reviewer Feedback ─────────────────────────────────────────────

export const CreateReviewerFeedbackSchema = z.object({
  evaluationRunId: z.string().uuid(),
  sectionTag: z.string().max(100),
  comment: z.string().max(5000),
  isChallenge: z.boolean().default(false),
});

export type CreateReviewerFeedbackInput = z.infer<typeof CreateReviewerFeedbackSchema>;

// ─── Explanation Box ───────────────────────────────────────────────

export const ExplanationBoxSchema = z.object({
  evaluationRunId: z.string().uuid(),
  headline: z.string(),
  sections: z.array(
    z.object({
      title: z.string(),
      body: z.string(),
      evidenceIds: z.array(z.string().uuid()).optional(),
    }),
  ),
  confidence: z.number().min(0).max(1),
});

export type ExplanationBox = z.infer<typeof ExplanationBoxSchema>;

// ─── Interview Focus ───────────────────────────────────────────────

export const InterviewFocusItemSchema = z.object({
  evaluationRunId: z.string().uuid(),
  topic: z.string(),
  rationale: z.string(),
  suggestedQuestions: z.array(z.string()),
  linkedGapId: z.string().uuid().optional(),
  linkedEvidenceIds: z.array(z.string().uuid()).optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

export type InterviewFocusItem = z.infer<typeof InterviewFocusItemSchema>;

// ─── Candidate Packet ──────────────────────────────────────────────

export const GeneratePacketSchema = z.object({
  applicationId: z.string().uuid(),
  evaluationRunId: z.string().uuid(),
  sections: z
    .array(
      z.enum([
        'READINESS',
        'EVIDENCE',
        'GAPS',
        'INTERVIEW_FOCUS',
        'EXPLANATION',
        'REVIEWER_FEEDBACK',
      ]),
    )
    .min(1),
});

export type GeneratePacketInput = z.infer<typeof GeneratePacketSchema>;

export const SharePacketSchema = z.object({
  packetId: z.string().uuid(),
  recipientUserIds: z.array(z.string().uuid()).min(1),
  expiresInHours: z.number().int().positive().max(720).optional(),
});

export type SharePacketInput = z.infer<typeof SharePacketSchema>;

// ─── Overall Plan ─────────────────────────────────────────────────

export const CreateOverallPlanSchema = z.object({
  hiringRequestId: z.string().uuid(),
  createdById: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export type CreateOverallPlanInput = z.infer<typeof CreateOverallPlanSchema>;

export const ApproveRejectPlanSchema = z.object({
  hiringRequestId: z.string().uuid(),
  approverId: z.string().uuid(),
  reason: z.string().max(2000).optional(),
});

export type ApproveRejectPlanInput = z.infer<typeof ApproveRejectPlanSchema>;

// ─── Task Plan ────────────────────────────────────────────────────

export const CreateTaskPlanSchema = z.object({
  hiringRequestId: z.string().uuid(),
  taskType: z.nativeEnum(TaskPlanType),
  assignedToId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  notes: z.string().max(2000).optional(),
});

export type CreateTaskPlanInput = z.infer<typeof CreateTaskPlanSchema>;

export const UpdateTaskPlanSchema = z.object({
  taskType: z.nativeEnum(TaskPlanType).optional(),
  assignedToId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
});

export const UpdateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskPlanStatus),
});

// ─── Skill Knowledge Graph ────────────────────────────────────────

export const SkillNodeSchema = z.object({
  canonicalName: z.string(),
  category: z.enum([
    'LANGUAGE', 'FRAMEWORK', 'LIBRARY', 'DATABASE', 'CLOUD',
    'DEVOPS', 'PARADIGM', 'ROLE', 'DOMAIN', 'TOOL', 'PLATFORM',
  ]),
  aliases: z.array(z.string()).optional(),
});

export type SkillNode = z.infer<typeof SkillNodeSchema>;
