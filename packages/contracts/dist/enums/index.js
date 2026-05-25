/**
 * Domain enums for the Reasoning-First RMS.
 *
 * Enum values are uppercase string literals per architecture convention.
 * These enums are the single source of truth shared by API, worker, and frontend.
 */
// ─── User & Organization ───────────────────────────────────────────
export var UserRole;
(function (UserRole) {
    UserRole["CANDIDATE"] = "CANDIDATE";
    UserRole["RECRUITER"] = "RECRUITER";
    UserRole["HIRING_MANAGER"] = "HIRING_MANAGER";
    UserRole["DEPARTMENT_HEAD"] = "DEPARTMENT_HEAD";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (UserRole = {}));
// ─── Enterprise Hiring Workflow ────────────────────────────────────
export var HiringRequestStatus;
(function (HiringRequestStatus) {
    HiringRequestStatus["DRAFT"] = "DRAFT";
    HiringRequestStatus["PENDING_APPROVAL"] = "PENDING_APPROVAL";
    HiringRequestStatus["APPROVED"] = "APPROVED";
    HiringRequestStatus["REJECTED"] = "REJECTED";
    HiringRequestStatus["REVISION_REQUESTED"] = "REVISION_REQUESTED";
})(HiringRequestStatus || (HiringRequestStatus = {}));
export var ApprovalLevel;
(function (ApprovalLevel) {
    ApprovalLevel["LEVEL_1"] = "LEVEL_1";
    ApprovalLevel["LEVEL_2"] = "LEVEL_2";
    ApprovalLevel["LEVEL_3"] = "LEVEL_3";
})(ApprovalLevel || (ApprovalLevel = {}));
export var RecruitmentStatus;
(function (RecruitmentStatus) {
    RecruitmentStatus["OPEN"] = "OPEN";
    RecruitmentStatus["PAUSED"] = "PAUSED";
    RecruitmentStatus["CLOSED"] = "CLOSED";
    RecruitmentStatus["FILLED"] = "FILLED";
})(RecruitmentStatus || (RecruitmentStatus = {}));
// ─── Document Processing ───────────────────────────────────────────
export var DocumentType;
(function (DocumentType) {
    DocumentType["CV"] = "CV";
    DocumentType["JD"] = "JD";
})(DocumentType || (DocumentType = {}));
export var DocumentState;
(function (DocumentState) {
    DocumentState["PENDING"] = "PENDING";
    DocumentState["PROCESSING"] = "PROCESSING";
    DocumentState["PARSED"] = "PARSED";
    DocumentState["FAILED_PARSE"] = "FAILED_PARSE";
    DocumentState["FAILED_VALIDATION"] = "FAILED_VALIDATION";
})(DocumentState || (DocumentState = {}));
// ─── Work Mode ─────────────────────────────────────────────────────
export var WorkMode;
(function (WorkMode) {
    WorkMode["ONSITE"] = "ONSITE";
    WorkMode["REMOTE"] = "REMOTE";
    WorkMode["HYBRID"] = "HYBRID";
})(WorkMode || (WorkMode = {}));
// ─── Readiness Labels ──────────────────────────────────────────────
// These are deterministic labels — never assigned by LLM.
export var ReadinessLabel;
(function (ReadinessLabel) {
    ReadinessLabel["READY_NOW"] = "READY_NOW";
    ReadinessLabel["READY_WITH_SHORT_RAMP_UP"] = "READY_WITH_SHORT_RAMP_UP";
    ReadinessLabel["DOMAIN_SPECIALIST_WITH_TECH_GAP"] = "DOMAIN_SPECIALIST_WITH_TECH_GAP";
    ReadinessLabel["STRONG_FUNDAMENTALS_NEEDS_DOMAIN"] = "STRONG_FUNDAMENTALS_NEEDS_DOMAIN";
    ReadinessLabel["SIGNIFICANT_GAPS"] = "SIGNIFICANT_GAPS";
    ReadinessLabel["INSUFFICIENT_EVIDENCE"] = "INSUFFICIENT_EVIDENCE";
    ReadinessLabel["OUT_OF_SCOPE"] = "OUT_OF_SCOPE";
})(ReadinessLabel || (ReadinessLabel = {}));
// ─── Evaluation ────────────────────────────────────────────────────
export var EvaluationState;
(function (EvaluationState) {
    EvaluationState["PENDING"] = "PENDING";
    EvaluationState["RUNNING"] = "RUNNING";
    EvaluationState["COMPLETED"] = "COMPLETED";
    EvaluationState["FAILED_PROCESSING"] = "FAILED_PROCESSING";
    EvaluationState["FAILED_VALIDATION"] = "FAILED_VALIDATION";
})(EvaluationState || (EvaluationState = {}));
export var GapType;
(function (GapType) {
    GapType["HARD_SKILL"] = "HARD_SKILL";
    GapType["SOFT_SKILL"] = "SOFT_SKILL";
    GapType["DOMAIN_KNOWLEDGE"] = "DOMAIN_KNOWLEDGE";
    GapType["CERTIFICATION"] = "CERTIFICATION";
    GapType["EXPERIENCE_LEVEL"] = "EXPERIENCE_LEVEL";
    GapType["TOOL_PROFICIENCY"] = "TOOL_PROFICIENCY";
})(GapType || (GapType = {}));
export var GapSeverity;
(function (GapSeverity) {
    GapSeverity["CRITICAL"] = "CRITICAL";
    GapSeverity["MODERATE"] = "MODERATE";
    GapSeverity["MINOR"] = "MINOR";
})(GapSeverity || (GapSeverity = {}));
// ─── Evidence ──────────────────────────────────────────────────────
export var EvidenceType;
(function (EvidenceType) {
    EvidenceType["CLAIM"] = "CLAIM";
    EvidenceType["GAP"] = "GAP";
    EvidenceType["HARD_CONSTRAINT"] = "HARD_CONSTRAINT";
    EvidenceType["INTERVIEW_FOCUS"] = "INTERVIEW_FOCUS";
})(EvidenceType || (EvidenceType = {}));
// ─── Application & Invite ──────────────────────────────────────────
export var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus["DRAFT"] = "DRAFT";
    ApplicationStatus["SUBMITTED"] = "SUBMITTED";
    ApplicationStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    ApplicationStatus["EVALUATED"] = "EVALUATED";
    ApplicationStatus["REJECTED"] = "REJECTED";
    ApplicationStatus["SHORTLISTED"] = "SHORTLISTED";
    ApplicationStatus["WITHDRAWN"] = "WITHDRAWN";
})(ApplicationStatus || (ApplicationStatus = {}));
export var InviteStatus;
(function (InviteStatus) {
    InviteStatus["PENDING"] = "PENDING";
    InviteStatus["ACCEPTED"] = "ACCEPTED";
    InviteStatus["DECLINED"] = "DECLINED";
    InviteStatus["EXPIRED"] = "EXPIRED";
})(InviteStatus || (InviteStatus = {}));
// ─── Job State (BullMQ) ───────────────────────────────────────────
export var JobState;
(function (JobState) {
    JobState["QUEUED"] = "QUEUED";
    JobState["ACTIVE"] = "ACTIVE";
    JobState["COMPLETED"] = "COMPLETED";
    JobState["FAILED"] = "FAILED";
    JobState["RETRYING"] = "RETRYING";
})(JobState || (JobState = {}));
// ─── Candidate Visibility ──────────────────────────────────────────
export var CandidateVisibility;
(function (CandidateVisibility) {
    CandidateVisibility["PUBLIC"] = "PUBLIC";
    CandidateVisibility["REGISTERED_ONLY"] = "REGISTERED_ONLY";
    CandidateVisibility["PRIVATE"] = "PRIVATE";
})(CandidateVisibility || (CandidateVisibility = {}));
// ─── Skill Knowledge Graph ────────────────────────────────────────
export var SkillCategory;
(function (SkillCategory) {
    SkillCategory["LANGUAGE"] = "LANGUAGE";
    SkillCategory["FRAMEWORK"] = "FRAMEWORK";
    SkillCategory["LIBRARY"] = "LIBRARY";
    SkillCategory["DATABASE"] = "DATABASE";
    SkillCategory["CLOUD"] = "CLOUD";
    SkillCategory["DEVOPS"] = "DEVOPS";
    SkillCategory["PARADIGM"] = "PARADIGM";
    SkillCategory["ROLE"] = "ROLE";
    SkillCategory["DOMAIN"] = "DOMAIN";
    SkillCategory["TOOL"] = "TOOL";
    SkillCategory["PLATFORM"] = "PLATFORM";
})(SkillCategory || (SkillCategory = {}));
export var SkillRelationship;
(function (SkillRelationship) {
    SkillRelationship["IS_A"] = "IS_A";
    SkillRelationship["PART_OF"] = "PART_OF";
    SkillRelationship["RELATED_TO"] = "RELATED_TO";
    SkillRelationship["VARIANT_OF"] = "VARIANT_OF";
    SkillRelationship["REQUIRES"] = "REQUIRES";
})(SkillRelationship || (SkillRelationship = {}));
//# sourceMappingURL=index.js.map