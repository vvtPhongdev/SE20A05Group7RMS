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
  invitationCode: z.string().trim().min(1).max(128).optional(),
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
  redirectPath: z.enum(['/reset-password', '/account-settings']).optional(),
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

export const SupabaseLoginSchema = z.object({
  accessToken: z.string().min(1),
});

export const SupabaseRegisterSchema = SupabaseLoginSchema.extend({
  displayName: z.string().min(1).max(255),
  invitationCode: z.string().trim().min(1).max(128).optional(),
});

export const CreateOrganizationInvitationSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(255),
  role: z.nativeEnum(UserRole),
  organizationId: z.string().uuid(),
  departmentId: z.string().uuid().optional().nullable(),
});

export const ValidateOrganizationInvitationSchema = z.object({
  code: z.string().trim().min(1).max(128),
  email: z.string().email().optional(),
});

export const ListOrganizationInvitationsSchema = z.object({
  organizationId: z.string().uuid(),
});

export const ManageOrganizationInvitationSchema = z.object({
  invitationId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

export const UpdateUserSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  phone: z.string().max(20).optional().nullable(),
  isActive: z.boolean().optional(),
  departmentId: z.string().uuid().optional().nullable(),
});

export const UpdateAccountSchema = z.object({
  displayName: z.string().trim().min(1).max(255).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  phone: z.string().trim().max(20).optional().nullable(),
  supabaseAccessToken: z.string().min(1).optional(),
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
export type SupabaseLoginInput = z.infer<typeof SupabaseLoginSchema>;
export type SupabaseRegisterInput = z.infer<typeof SupabaseRegisterSchema>;
export type CreateOrganizationInvitationInput = z.infer<typeof CreateOrganizationInvitationSchema>;
export type ValidateOrganizationInvitationInput = z.infer<typeof ValidateOrganizationInvitationSchema>;
export type ListOrganizationInvitationsInput = z.infer<typeof ListOrganizationInvitationsSchema>;
export type ManageOrganizationInvitationInput = z.infer<typeof ManageOrganizationInvitationSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>;
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
  skills: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
  bachelorRequirements: z.array(z.string().trim().min(1).max(255)).max(50).optional(),
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
  fileType: z.enum(['PDF', 'DOCX', 'DOC']),
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
    durationMonths: z.number().int().min(0).max(1200).optional(),
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
    yearsOfExperience: z.number().min(0).max(100).optional(),
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

export const CvExtractionSchema = z.object({
  documentText: z.string(),
  resume: ResumeDraftSchema,
  confidence: z.number().min(0).max(1),
  warnings: z.array(z.string()),
  method: z.enum(['LOCAL_TEXT', 'AI_TEXT', 'AI_VISION']),
  model: z.string().optional(),
});

export type CreateCandidateProfileInput = z.infer<typeof CreateCandidateProfileSchema>;
export type UpdateCandidateProfileInput = z.infer<typeof UpdateCandidateProfileSchema>;
export type CreateCandidateCVInput = z.infer<typeof CreateCandidateCVSchema>;
export type UpdateCandidateCVInput = z.infer<typeof UpdateCandidateCVSchema>;
export type ResumeDraftData = z.infer<typeof ResumeDraftSchema>;
export type ResumeData = z.infer<typeof ResumeSchema>;
export type CvExtractionData = z.infer<typeof CvExtractionSchema>;

// ─── Interview Schemas ─────────────────────────────────────────────

export const CreateInterviewScheduleSchema = z.object({
  requestId: z.string().uuid(),
  candidateId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  duration: z.number().int().positive(), // in minutes
  location: z.string().min(1).max(500),
  interviewers: z.array(z.string().uuid()).min(2),
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

export const OfferResponseSchema = z.object({
  response: z.enum(['ACCEPT', 'DECLINE']),
  note: z.string().max(2000).optional().nullable(),
});

export type OfferResponseInput = z.infer<typeof OfferResponseSchema>;

// ─── Job Posting Schemas ───────────────────────────────────────────

export const CreateJobPostingSchema = z.object({
  requestId: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  requirements: z.record(z.unknown()).default({}),
  visibility: z.nativeEnum(JobVisibility).default(JobVisibility.PRIVATE),
  startDate: z.string().datetime(),
  expireDate: z.string().datetime(),
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
  parserPreference: z.enum(['MODEL_VECTOR', 'GEMINI_API']).optional(),
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

export const TaskReminderJobPayloadSchema = z.object({
  taskPlanId: z.string().uuid(),
  reminderKey: z.enum(['24h-before', 'deadline']),
  scheduledFor: z.string().datetime(),
});

export type CvParseJobPayload = z.infer<typeof CvParseJobPayloadSchema>;
export type EmbeddingGenerateJobPayload = z.infer<typeof EmbeddingGenerateJobPayloadSchema>;
export type EmailSendJobPayload = z.infer<typeof EmailSendJobPayloadSchema>;
export type TaskReminderJobPayload = z.infer<typeof TaskReminderJobPayloadSchema>;
