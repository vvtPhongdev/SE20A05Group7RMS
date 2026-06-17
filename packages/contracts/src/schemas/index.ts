import { z } from 'zod';
import {
  UserRole,
  RecruitmentRequestStatus,
  Urgency,
  PlanStatus,
  TaskType,
  TaskStatus,
  InterviewStatus,
  InterviewResult,
  NotificationType,
  EmailStatus,
  JobVisibility,
  JobPostingStatus,
} from '../enums';

// ─── Common / Base Schemas ─────────────────────────────────────────

export const UuidSchema = z.string().uuid();

// ─── User & Auth Schemas ───────────────────────────────────────────

export const CreateUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(255),
  role: z.nativeEnum(UserRole),
  organizationId: z.string().uuid(),
  departmentId: z.string().uuid().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
});

export const RegisterUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(255),
  password: z.string().min(8).max(128),
  role: z.nativeEnum(UserRole),
});

export const LoginSchema = z.object({
  email: z.preprocess(
    (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
    z.string().email(),
  ),
  password: z.string().min(1),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(128),
  newPassword: z.string().min(8).max(128),
});

export const VerifyRegisterSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export const UpdateUserSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  phone: z.string().max(20).optional().nullable(),
  isActive: z.boolean().optional(),
  departmentId: z.string().uuid().optional().nullable(),
});

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

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export type VerifyRegisterInput = z.infer<typeof VerifyRegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type AuthTokenResponse = z.infer<typeof AuthTokenResponseSchema>;

// ─── Organization Schemas ──────────────────────────────────────────

export const CreateOrganizationSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(2)
    .max(63)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric and hyphens'),
  settings: z.record(z.unknown()).optional(),
});

export const UpdateOrganizationSchema = CreateOrganizationSchema.partial();

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;

// ─── Department Schemas ────────────────────────────────────────────

export const CreateDepartmentSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(255),
  code: z
    .string()
    .min(2)
    .max(20)
    .regex(/^[A-Z0-9_]+$/, 'Code must be uppercase letters, numbers, and underscores'),
  headUserId: z.string().uuid().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
});

export const UpdateDepartmentSchema = CreateDepartmentSchema.partial().omit({
  organizationId: true,
});

export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof UpdateDepartmentSchema>;

// ─── Recruitment Request Schemas ───────────────────────────────────

export const CreateRecruitmentRequestSchema = z.object({
  departmentId: z.string().uuid(),
  position: z.string().min(1).max(255),
  headcount: z.number().int().positive().min(1),
  jobDescription: z.string().min(1),
  skillRequirements: z.record(z.unknown()).default({}),
  justification: z.string().min(1),
  urgency: z.nativeEnum(Urgency).default(Urgency.MEDIUM),
});

export const UpdateRecruitmentRequestSchema = CreateRecruitmentRequestSchema.partial().extend({
  status: z.nativeEnum(RecruitmentRequestStatus).optional(),
  reviewedById: z.string().uuid().optional().nullable(),
  approvedById: z.string().uuid().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
});

export const ApproveRejectRequestSchema = z.object({
  decision: z.enum([
    RecruitmentRequestStatus.APPROVED,
    RecruitmentRequestStatus.REJECTED,
    RecruitmentRequestStatus.REVISION_NEEDED,
  ]),
  comments: z.string().max(2000).optional(),
});

export type CreateRecruitmentRequestInput = z.infer<typeof CreateRecruitmentRequestSchema>;
export type UpdateRecruitmentRequestInput = z.infer<typeof UpdateRecruitmentRequestSchema>;
export type ApproveRejectRequestInput = z.infer<typeof ApproveRejectRequestSchema>;

// ─── Planning Schemas ──────────────────────────────────────────────

export const CreateOverallPlanSchema = z.object({
  requestId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const UpdateOverallPlanSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.nativeEnum(PlanStatus).optional(),
  revisionNotes: z.string().optional().nullable(),
  approvedById: z.string().uuid().optional().nullable(),
});

export const CreateTaskPlanSchema = z.object({
  overallPlanId: z.string().uuid(),
  taskType: z.nativeEnum(TaskType),
  assignedToId: z.string().uuid().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const UpdateTaskPlanSchema = CreateTaskPlanSchema.partial().extend({
  status: z.nativeEnum(TaskStatus).optional(),
});

export type CreateOverallPlanInput = z.infer<typeof CreateOverallPlanSchema>;
export type UpdateOverallPlanInput = z.infer<typeof UpdateOverallPlanSchema>;
export type CreateTaskPlanInput = z.infer<typeof CreateTaskPlanSchema>;
export type UpdateTaskPlanInput = z.infer<typeof UpdateTaskPlanSchema>;

// ─── Candidate Profile & CV Schemas ────────────────────────────────

export const CreateCandidateProfileSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().max(20).optional().nullable(),
  summary: z.string().optional().nullable(),
  structuredData: z.record(z.unknown()).optional().nullable(),
});

export const UpdateCandidateProfileSchema = CreateCandidateProfileSchema.partial().omit({
  userId: true,
});

export const CreateCandidateCVSchema = z.object({
  candidateId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  fileType: z.enum(['PDF', 'DOCX']),
  filePath: z.string().min(1),
  rawText: z.string().min(1),
});

export const UpdateCandidateCVSchema = CreateCandidateCVSchema.partial().extend({
  parsedAt: z.string().datetime().optional().nullable(),
});

export const ResumeLinkSchema = z.object({
  type: z.enum(['LINKEDIN', 'GITHUB', 'PORTFOLIO', 'OTHER']),
  url: z.string().min(1).max(500),
});

export const ResumeLanguageSchema = z.object({
  name: z.string().min(1).max(100),
  proficiency: z.string().max(100).optional(),
});

export const ResumePersonalInfoDraftSchema = z
  .object({
    fullName: z.string().min(1).max(255).optional(),
    email: z.string().email().optional(),
    phoneNumber: z.string().max(30).optional(),
    address: z.string().max(500).optional(),
    links: z.array(ResumeLinkSchema).optional(),
  })
  .passthrough();

export const ResumeSkillsDraftSchema = z
  .object({
    technical: z.array(z.string().min(1).max(100)).optional(),
    softSkills: z.array(z.string().min(1).max(100)).optional(),
    languages: z.array(ResumeLanguageSchema).optional(),
  })
  .passthrough();

export const ResumeWorkExperienceDraftSchema = z
  .object({
    company: z.string().min(1).max(255).optional(),
    position: z.string().min(1).max(255).optional(),
    startDate: z.string().max(50).optional(),
    endDate: z.string().max(50).optional().nullable(),
    isCurrent: z.boolean().optional(),
    achievements: z.array(z.string().min(1).max(1000)).optional(),
  })
  .passthrough();

export const ResumeEducationDraftSchema = z
  .object({
    school: z.string().min(1).max(255).optional(),
    major: z.string().max(255).optional(),
    degree: z.string().max(255).optional(),
    startDate: z.string().max(50).optional(),
    endDate: z.string().max(50).optional().nullable(),
  })
  .passthrough();

export const ResumeDraftSchema = z
  .object({
    personalInfo: ResumePersonalInfoDraftSchema.optional(),
    currentRole: z.string().max(255).optional(),
    summary: z.string().max(5000).optional(),
    skills: ResumeSkillsDraftSchema.optional(),
    workExperience: z.array(ResumeWorkExperienceDraftSchema).optional(),
    education: z.array(ResumeEducationDraftSchema).optional(),
  })
  .passthrough();

export const ResumeSchema = ResumeDraftSchema.extend({
  personalInfo: ResumePersonalInfoDraftSchema.extend({
    fullName: z.string().min(1).max(255),
    email: z.string().email(),
  }),
});

export type CreateCandidateProfileInput = z.infer<typeof CreateCandidateProfileSchema>;
export type UpdateCandidateProfileInput = z.infer<typeof UpdateCandidateProfileSchema>;
export type CreateCandidateCVInput = z.infer<typeof CreateCandidateCVSchema>;
export type UpdateCandidateCVInput = z.infer<typeof UpdateCandidateCVSchema>;
export type ResumeDraftData = z.infer<typeof ResumeDraftSchema>;
export type ResumeData = z.infer<typeof ResumeSchema>;

// ─── Interview Schemas ─────────────────────────────────────────────

export const CreateInterviewScheduleSchema = z.object({
  requestId: z.string().uuid(),
  candidateId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  duration: z.number().int().positive(), // in minutes
  location: z.string().min(1).max(500),
  interviewers: z.array(z.string().uuid()).min(1),
});

export const UpdateInterviewScheduleSchema = CreateInterviewScheduleSchema.partial().extend({
  status: z.nativeEnum(InterviewStatus).optional(),
});

export const CreateInterviewResultSchema = z.object({
  interviewId: z.string().uuid(),
  result: z.nativeEnum(InterviewResult),
  notes: z.string().optional().nullable(),
  evaluatorId: z.string().uuid().optional().nullable(),
});

export const UpdateInterviewResultSchema = CreateInterviewResultSchema.partial().omit({
  interviewId: true,
});

export type CreateInterviewScheduleInput = z.infer<typeof CreateInterviewScheduleSchema>;
export type UpdateInterviewScheduleInput = z.infer<typeof UpdateInterviewScheduleSchema>;
export type CreateInterviewResultInput = z.infer<typeof CreateInterviewResultSchema>;
export type UpdateInterviewResultInput = z.infer<typeof UpdateInterviewResultSchema>;

// ─── Job Posting Schemas ───────────────────────────────────────────

export const CreateJobPostingSchema = z.object({
  requestId: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  requirements: z.record(z.unknown()).default({}),
  visibility: z.nativeEnum(JobVisibility).default(JobVisibility.PRIVATE),
  expireDate: z.string().datetime().optional().nullable(),
});

export const UpdateJobPostingSchema = CreateJobPostingSchema.partial().extend({
  status: z.nativeEnum(JobPostingStatus).optional(),
});

export type CreateJobPostingInput = z.infer<typeof CreateJobPostingSchema>;
export type UpdateJobPostingInput = z.infer<typeof UpdateJobPostingSchema>;

// ─── Notification & Email Schemas ──────────────────────────────────

export const CreateNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.nativeEnum(NotificationType),
  title: z.string().min(1).max(255),
  body: z.string().min(1),
  relatedEntityId: z.string().uuid().optional().nullable(),
  relatedEntityType: z.string().max(100).optional().nullable(),
});

export const CreateEmailLogSchema = z.object({
  userId: z.string().uuid().optional().nullable(),
  toEmail: z.string().email(),
  subject: z.string().min(1).max(255),
  body: z.string().min(1),
  status: z.nativeEnum(EmailStatus).default(EmailStatus.PENDING),
  errorMessage: z.string().optional().nullable(),
});

export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;
export type CreateEmailLogInput = z.infer<typeof CreateEmailLogSchema>;

// ─── BullMQ Job Payload Schemas ────────────────────────────────────

export const CvParseJobPayloadSchema = z.object({
  cvDocumentId: z.string().uuid(),
  filePath: z.string().min(1),
});

export const EmbeddingGenerateJobPayloadSchema = z.object({
  cvDocumentId: z.string().uuid(),
  rawText: z.string().min(1),
});

export const EmailSendJobPayloadSchema = z.object({
  emailLogId: z.string().uuid(),
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export type CvParseJobPayload = z.infer<typeof CvParseJobPayloadSchema>;
export type EmbeddingGenerateJobPayload = z.infer<typeof EmbeddingGenerateJobPayloadSchema>;
export type EmailSendJobPayload = z.infer<typeof EmailSendJobPayloadSchema>;
