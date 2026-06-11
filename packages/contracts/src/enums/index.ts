/**
 * Domain enums for the Recruitment Workflow Management System (RMS).
 *
 * Enum values are uppercase string literals per architecture convention.
 * These enums are the single source of truth shared by API, worker, and frontend.
 */

// ─── User & Organization ───────────────────────────────────────────

export enum UserRole {
  ADMIN = 'ADMIN',
  DEPARTMENT_HEAD = 'DEPARTMENT_HEAD',
  HR_MANAGER = 'HR_MANAGER',
  CANDIDATE = 'CANDIDATE',
}

// ─── Recruitment Request Lifecycle ─────────────────────────────────

export enum RecruitmentRequestStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVISION_NEEDED = 'REVISION_NEEDED',
  PLANNING = 'PLANNING',
  PLAN_APPROVED = 'PLAN_APPROVED',
  SCREENING = 'SCREENING',
  INTERVIEWING = 'INTERVIEWING',
  INTERVIEW_COMPLETED = 'INTERVIEW_COMPLETED',
  OFFER_EXTENDED = 'OFFER_EXTENDED',
  OFFER_ACCEPTED = 'OFFER_ACCEPTED',
  OFFER_DECLINED = 'OFFER_DECLINED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum Urgency {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// ─── Planning ──────────────────────────────────────────────────────

export enum PlanStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum TaskType {
  JOB_POSTING = 'JOB_POSTING',
  CV_COLLECTION = 'CV_COLLECTION',
  CV_SCREENING = 'CV_SCREENING',
  INTERVIEW_COORDINATION = 'INTERVIEW_COORDINATION',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

// ─── Interview ─────────────────────────────────────────────────────

export enum InterviewStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED',
}

export enum InterviewResult {
  PASS = 'PASS',
  FAIL = 'FAIL',
}

export enum HiringDecision {
  HIRE = 'HIRE',
  REJECT = 'REJECT',
}

export enum OfferStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

export enum OfferResponse {
  ACCEPT = 'ACCEPT',
  DECLINE = 'DECLINE',
}
// ─── Job Posting ───────────────────────────────────────────────────

export enum JobVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export enum JobPostingStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
}

// ─── Notifications & Communication ─────────────────────────────────

export enum NotificationType {
  REQUEST_UPDATE = 'REQUEST_UPDATE',
  INTERVIEW_INVITE = 'INTERVIEW_INVITE',
  OFFER = 'OFFER',
  REJECTION = 'REJECTION',
  PLAN_UPDATE = 'PLAN_UPDATE',
  SYSTEM = 'SYSTEM',
}

export enum EmailTemplateType {
  INTERVIEW_INVITATION = 'INTERVIEW_INVITATION',
  OFFER_LETTER = 'OFFER_LETTER',
  REJECTION = 'REJECTION',
}

// ─── Document Processing (BullMQ) ──────────────────────────────────

export enum DocumentState {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PARSED = 'PARSED',
  FAILED = 'FAILED',
}

export enum EmailStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

// ─── Audit Logging (T-107, NFR-3) ──────────────────────────────────

export enum AuditEntityType {
  PLAN = 'PLAN',
  TASK_PLAN = 'TASK_PLAN',
  INTERVIEW_SCHEDULE = 'INTERVIEW_SCHEDULE',
  INTERVIEW_RESULT = 'INTERVIEW_RESULT',
  CV = 'CV',
  CV_EMBEDDING = 'CV_EMBEDDING',
}

export enum AuditAction {
  PLAN_CREATED = 'PLAN_CREATED',
  PLAN_APPROVED = 'PLAN_APPROVED',
  PLAN_REJECTED = 'PLAN_REJECTED',
  TASK_PLAN_ASSIGNED = 'TASK_PLAN_ASSIGNED',
  TASK_PLAN_STATUS_CHANGED = 'TASK_PLAN_STATUS_CHANGED',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  INTERVIEW_RESCHEDULED = 'INTERVIEW_RESCHEDULED',
  INTERVIEW_CANCELLED = 'INTERVIEW_CANCELLED',
  INTERVIEW_RESULT_RECORDED = 'INTERVIEW_RESULT_RECORDED',
  CV_UPLOADED = 'CV_UPLOADED',
  CV_PARSE_STARTED = 'CV_PARSE_STARTED',
  CV_PARSE_COMPLETED = 'CV_PARSE_COMPLETED',
  CV_PARSE_FAILED = 'CV_PARSE_FAILED',
  CV_EMBEDDING_GENERATED = 'CV_EMBEDDING_GENERATED',
  CV_SCREENING_STATUS_CHANGED = 'CV_SCREENING_STATUS_CHANGED',
}
