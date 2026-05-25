/**
 * Domain enums for the Reasoning-First RMS.
 *
 * Enum values are uppercase string literals per architecture convention.
 * These enums are the single source of truth shared by API, worker, and frontend.
 */

// ─── User & Organization ───────────────────────────────────────────

export enum UserRole {
  CANDIDATE = 'CANDIDATE',
  RECRUITER = 'RECRUITER',
  HIRING_MANAGER = 'HIRING_MANAGER',
  DEPARTMENT_HEAD = 'DEPARTMENT_HEAD',
  ADMIN = 'ADMIN',
}

// ─── Enterprise Hiring Workflow ────────────────────────────────────

export enum HiringRequestStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVISION_REQUESTED = 'REVISION_REQUESTED',
}

export enum ApprovalLevel {
  LEVEL_1 = 'LEVEL_1',
  LEVEL_2 = 'LEVEL_2',
  LEVEL_3 = 'LEVEL_3',
}

export enum HiringRequestPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum ApprovalDecision {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVISION_REQUESTED = 'REVISION_REQUESTED',
}

export enum RecruitmentStatus {
  OPEN = 'OPEN',
  PAUSED = 'PAUSED',
  CLOSED = 'CLOSED',
  FILLED = 'FILLED',
}

// ─── Document Processing ───────────────────────────────────────────

export enum DocumentType {
  CV = 'CV',
  JD = 'JD',
}

export enum DocumentState {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PARSED = 'PARSED',
  FAILED_PARSE = 'FAILED_PARSE',
  FAILED_VALIDATION = 'FAILED_VALIDATION',
}

// ─── Work Mode ─────────────────────────────────────────────────────

export enum WorkMode {
  ONSITE = 'ONSITE',
  REMOTE = 'REMOTE',
  HYBRID = 'HYBRID',
}

// ─── Readiness Labels ──────────────────────────────────────────────
// These are deterministic labels — never assigned by LLM.

export enum ReadinessLabel {
  READY_NOW = 'READY_NOW',
  READY_WITH_SHORT_RAMP_UP = 'READY_WITH_SHORT_RAMP_UP',
  DOMAIN_SPECIALIST_WITH_TECH_GAP = 'DOMAIN_SPECIALIST_WITH_TECH_GAP',
  STRONG_FUNDAMENTALS_NEEDS_DOMAIN = 'STRONG_FUNDAMENTALS_NEEDS_DOMAIN',
  SIGNIFICANT_GAPS = 'SIGNIFICANT_GAPS',
  INSUFFICIENT_EVIDENCE = 'INSUFFICIENT_EVIDENCE',
  OUT_OF_SCOPE = 'OUT_OF_SCOPE',
}

// ─── Evaluation ────────────────────────────────────────────────────

export enum EvaluationState {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED_PROCESSING = 'FAILED_PROCESSING',
  FAILED_VALIDATION = 'FAILED_VALIDATION',
}

export enum GapType {
  HARD_SKILL = 'HARD_SKILL',
  SOFT_SKILL = 'SOFT_SKILL',
  DOMAIN_KNOWLEDGE = 'DOMAIN_KNOWLEDGE',
  CERTIFICATION = 'CERTIFICATION',
  EXPERIENCE_LEVEL = 'EXPERIENCE_LEVEL',
  TOOL_PROFICIENCY = 'TOOL_PROFICIENCY',
}

export enum GapSeverity {
  CRITICAL = 'CRITICAL',
  MODERATE = 'MODERATE',
  MINOR = 'MINOR',
}

// ─── Evidence ──────────────────────────────────────────────────────

export enum EvidenceType {
  CLAIM = 'CLAIM',
  GAP = 'GAP',
  HARD_CONSTRAINT = 'HARD_CONSTRAINT',
  INTERVIEW_FOCUS = 'INTERVIEW_FOCUS',
}

// ─── Application & Invite ──────────────────────────────────────────

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  EVALUATED = 'EVALUATED',
  REJECTED = 'REJECTED',
  SHORTLISTED = 'SHORTLISTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum InviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
}

// ─── Job State (BullMQ) ───────────────────────────────────────────

export enum JobState {
  QUEUED = 'QUEUED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}

// ─── Candidate Visibility ──────────────────────────────────────────

export enum CandidateVisibility {
  PUBLIC = 'PUBLIC',
  REGISTERED_ONLY = 'REGISTERED_ONLY',
  PRIVATE = 'PRIVATE',
}

// ─── Skill Knowledge Graph ────────────────────────────────────────

export enum SkillCategory {
  LANGUAGE = 'LANGUAGE',
  FRAMEWORK = 'FRAMEWORK',
  LIBRARY = 'LIBRARY',
  DATABASE = 'DATABASE',
  CLOUD = 'CLOUD',
  DEVOPS = 'DEVOPS',
  PARADIGM = 'PARADIGM',
  ROLE = 'ROLE',
  DOMAIN = 'DOMAIN',
  TOOL = 'TOOL',
  PLATFORM = 'PLATFORM',
}

export enum SkillRelationship {
  IS_A = 'IS_A',           // React IS_A Frontend Framework
  PART_OF = 'PART_OF',     // Express PART_OF Node.js ecosystem
  RELATED_TO = 'RELATED_TO', // React RELATED_TO Angular
  VARIANT_OF = 'VARIANT_OF', // ReactJS VARIANT_OF React
  REQUIRES = 'REQUIRES',   // React REQUIRES JavaScript
}
