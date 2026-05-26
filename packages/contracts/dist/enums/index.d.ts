/**
 * Domain enums for the Reasoning-First RMS.
 *
 * Enum values are uppercase string literals per architecture convention.
 * These enums are the single source of truth shared by API, worker, and frontend.
 */
export declare enum UserRole {
    CANDIDATE = "CANDIDATE",
    RECRUITER = "RECRUITER",
    HIRING_MANAGER = "HIRING_MANAGER",
    DEPARTMENT_HEAD = "DEPARTMENT_HEAD",
    ADMIN = "ADMIN"
}
export declare enum HiringRequestStatus {
    DRAFT = "DRAFT",
    PENDING_APPROVAL = "PENDING_APPROVAL",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    REVISION_REQUESTED = "REVISION_REQUESTED"
}
export declare enum ApprovalLevel {
    LEVEL_1 = "LEVEL_1",
    LEVEL_2 = "LEVEL_2",
    LEVEL_3 = "LEVEL_3"
}
export declare enum HiringRequestPriority {
    LOW = "LOW",
    NORMAL = "NORMAL",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare enum ApprovalDecision {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    REVISION_REQUESTED = "REVISION_REQUESTED"
}
export declare enum RecruitmentStatus {
    OPEN = "OPEN",
    PAUSED = "PAUSED",
    CLOSED = "CLOSED",
    FILLED = "FILLED"
}
export declare enum DocumentType {
    CV = "CV",
    JD = "JD"
}
export declare enum DocumentState {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    PARSED = "PARSED",
    FAILED_PARSE = "FAILED_PARSE",
    FAILED_VALIDATION = "FAILED_VALIDATION"
}
export declare enum WorkMode {
    ONSITE = "ONSITE",
    REMOTE = "REMOTE",
    HYBRID = "HYBRID"
}
export declare enum ReadinessLabel {
    READY_NOW = "READY_NOW",
    READY_WITH_SHORT_RAMP_UP = "READY_WITH_SHORT_RAMP_UP",
    DOMAIN_SPECIALIST_WITH_TECH_GAP = "DOMAIN_SPECIALIST_WITH_TECH_GAP",
    STRONG_FUNDAMENTALS_NEEDS_DOMAIN = "STRONG_FUNDAMENTALS_NEEDS_DOMAIN",
    SIGNIFICANT_GAPS = "SIGNIFICANT_GAPS",
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE",
    OUT_OF_SCOPE = "OUT_OF_SCOPE"
}
export declare enum EvaluationState {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    COMPLETED = "COMPLETED",
    FAILED_PROCESSING = "FAILED_PROCESSING",
    FAILED_VALIDATION = "FAILED_VALIDATION"
}
export declare enum GapType {
    HARD_SKILL = "HARD_SKILL",
    SOFT_SKILL = "SOFT_SKILL",
    DOMAIN_KNOWLEDGE = "DOMAIN_KNOWLEDGE",
    CERTIFICATION = "CERTIFICATION",
    EXPERIENCE_LEVEL = "EXPERIENCE_LEVEL",
    TOOL_PROFICIENCY = "TOOL_PROFICIENCY"
}
export declare enum GapSeverity {
    CRITICAL = "CRITICAL",
    MODERATE = "MODERATE",
    MINOR = "MINOR"
}
export declare enum EvidenceType {
    CLAIM = "CLAIM",
    GAP = "GAP",
    HARD_CONSTRAINT = "HARD_CONSTRAINT",
    INTERVIEW_FOCUS = "INTERVIEW_FOCUS"
}
export declare enum ApplicationStatus {
    DRAFT = "DRAFT",
    SUBMITTED = "SUBMITTED",
    UNDER_REVIEW = "UNDER_REVIEW",
    EVALUATED = "EVALUATED",
    REJECTED = "REJECTED",
    SHORTLISTED = "SHORTLISTED",
    WITHDRAWN = "WITHDRAWN"
}
export declare enum InviteStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    DECLINED = "DECLINED",
    EXPIRED = "EXPIRED"
}
export declare enum JobState {
    QUEUED = "QUEUED",
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    RETRYING = "RETRYING"
}
export declare enum CandidateVisibility {
    PUBLIC = "PUBLIC",
    REGISTERED_ONLY = "REGISTERED_ONLY",
    PRIVATE = "PRIVATE"
}
export declare enum SkillCategory {
    LANGUAGE = "LANGUAGE",
    FRAMEWORK = "FRAMEWORK",
    LIBRARY = "LIBRARY",
    DATABASE = "DATABASE",
    CLOUD = "CLOUD",
    DEVOPS = "DEVOPS",
    PARADIGM = "PARADIGM",
    ROLE = "ROLE",
    DOMAIN = "DOMAIN",
    TOOL = "TOOL",
    PLATFORM = "PLATFORM"
}
export declare enum SkillRelationship {
    IS_A = "IS_A",// React IS_A Frontend Framework
    PART_OF = "PART_OF",// Express PART_OF Node.js ecosystem
    RELATED_TO = "RELATED_TO",// React RELATED_TO Angular
    VARIANT_OF = "VARIANT_OF",// ReactJS VARIANT_OF React
    REQUIRES = "REQUIRES"
}
//# sourceMappingURL=index.d.ts.map