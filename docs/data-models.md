# Data Models — Works Reruiter

**Updated:** 2026-05-23
**ORM:** Prisma ^6.8.2
**Database:** PostgreSQL 16 (pgvector/pgvector:pg16)
**Schema location:** `packages/database/prisma/schema.prisma` (548 lines)

---

## Entity Overview

26 Prisma models + pgvector columns (managed via raw SQL outside Prisma).

### Entity Relationship Summary

```
Organization ──1:N──→ OrganizationMember ──N:1──→ User
Organization ──1:N──→ Role
Organization ──1:N──→ Department
Organization ──1:N──→ ApprovalChain
Organization ──1:N──→ HiringRequest

Department ──1:N──→ HiringRequest
Department ──N:1──→ Organization
Department ──0:1──→ User (headUser)
Department ──0:N──→ Department (parent/children hierarchy)
Department ──1:N──→ ApprovalChain

ApprovalChain ──1:N──→ ApprovalChainLevel
ApprovalChainLevel ──N:1──→ User (approver)

HiringRequest ──N:1──→ User (requestedBy — Dept Head)
HiringRequest ──N:1──→ Department
HiringRequest ──1:N──→ HiringRequestApproval
HiringRequest ──1:N──→ Role (spawned roles)
HiringRequestApproval ──N:1──→ User (approver)

User ──1:1──→ CandidateProfile
User ──1:N──→ ReviewerFeedback

Role ──0:1──→ HiringRequest (source)
Role ──1:1──→ JobCapabilityModel
Role ──1:N──→ Application
Role ──1:N──→ Invite

CandidateProfile ──1:N──→ Document (CVs)
CandidateProfile ──1:1──→ CandidateCapabilityModel
CandidateProfile ──1:N──→ Application
CandidateProfile ──1:N──→ Invite

Application ──1:N──→ EvaluationRun
EvaluationRun ──1:N──→ EvidenceRecord
EvaluationRun ──1:N──→ GapFinding
EvaluationRun ──1:1──→ ExplanationBox
EvaluationRun ──1:N──→ InterviewFocusItem

Application ──1:1──→ CandidatePacket
CandidatePacket ──1:N──→ ReviewerFeedback

SkillNode ──N:M──→ SkillEdge (Knowledge Graph)
EvidenceEmbedding (pgvector managed)
```

## Model Catalog

### Identity Domain

| Model | Table | Purpose |
|-------|-------|---------|
| `User` | `users` | All system users (5 roles: CANDIDATE, RECRUITER, HIRING_MANAGER, DEPARTMENT_HEAD, ADMIN) |
| `Organization` | `organizations` | Enterprise organization entity |
| `OrganizationMember` | `organization_members` | User ↔ Organization join with role (OWNER, ADMIN, MEMBER) |

### Enterprise Structure Domain (NEW)

| Model | Table | Purpose |
|-------|-------|---------|
| `Department` | `departments` | Organizational department with hierarchy support |
| `ApprovalChain` | `approval_chains` | Named multi-level approval configuration |
| `ApprovalChainLevel` | `approval_chain_levels` | Individual level within an approval chain |

### Enterprise Hiring Workflow Domain (NEW)

| Model | Table | Purpose |
|-------|-------|---------|
| `HiringRequest` | `hiring_requests` | Department Head's request to fill a position |
| `HiringRequestApproval` | `hiring_request_approvals` | Per-level approval/rejection decision |

### Recruiting Domain

| Model | Table | Purpose |
|-------|-------|---------|
| `Role` | `roles` | Job role / position to fill (optionally linked to HiringRequest) |
| `JobCapabilityModel` | `job_capability_models` | Parsed JD requirements (JSONB) |
| `Application` | `applications` | Candidate application to a role |
| `Invite` | `invites` | HR Recruiter invitation to candidate |
| `EvaluationRun` | `evaluation_runs` | Immutable evaluation snapshot |

### Profiles Domain

| Model | Table | Purpose |
|-------|-------|---------|
| `CandidateProfile` | `candidate_profiles` | Candidate-owned profile data |
| `CandidateCapabilityModel` | `candidate_capability_models` | Parsed CV capabilities (JSONB) |
| `Document` | `documents` | CV documents (PDF/DOCX) |

### Evidence & Evaluation Domain

| Model | Table | Purpose |
|-------|-------|---------|
| `EvidenceRecord` | `evidence_records` | Provenance-linked evidence |
| `GapFinding` | `gap_findings` | Skill gap analysis results |
| `ExplanationBox` | `explanation_boxes` | LLM-generated explanation |
| `InterviewFocusItem` | `interview_focus_items` | Gap-based interview questions |

### Review Domain

| Model | Table | Purpose |
|-------|-------|---------|
| `ReviewerFeedback` | `reviewer_feedback` | Agree/challenge/comment |
| `CandidatePacket` | `candidate_packets` | Shareable review packet |

### AI Domain

| Model | Table | Purpose |
|-------|-------|---------|
| `SkillNode` | `skill_nodes` | Knowledge graph nodes (~200) |
| `SkillEdge` | `skill_edges` | Knowledge graph edges (~180) |
| `EvidenceEmbedding` | `evidence_embeddings` | pgvector embeddings (raw SQL) |

## Prisma Schema Conventions

- Every model has `@@map("snake_case_table_name")`
- Every non-camelCase column has `@map("snake_case_column_name")`
- Relations always specify `onDelete` behavior
- Indexes use descriptive names: `@@index([field], map: "idx_table_field")`
- Unique constraints: `@@unique([...], map: "uq_table_fields")`
- JSONB fields typed as `Json` or `Json?` with shape documented in comments
- **pgvector columns are NOT in Prisma schema** — managed via raw SQL migrations
- Preview features: `postgresqlExtensions` for pgvector extension support

## Key JSONB Fields

| Model | Field | Shape |
|-------|-------|-------|
| `JobCapabilityModel` | `capabilities` | `{ required: Capability[], preferred: Capability[] }` |
| `CandidateCapabilityModel` | `capabilities` | `{ skills: Skill[], experience: Experience[] }` |
| `EvidenceRecord` | `metadata` | `{ source_location, parsed_signal, confidence }` |
| `HiringRequest` | `budgetRange` | `{ min: number, max: number, currency: string }` |

## pgvector (Outside Prisma)

- **Column type:** `vector(384)` — matches MiniLM-L6-v2 output dimensions
- **Index type:** `ivfflat` for approximate nearest neighbor search
- **Managed via:** raw SQL in `$executeRawUnsafe()` calls
- **Docker image:** `pgvector/pgvector:pg16` (includes extension)

## Enum Reference

All domain enums live in `@wr/contracts` (`packages/contracts/src/enums/index.ts`).

| Enum | Values | Used By |
|------|--------|---------|
| `UserRole` | CANDIDATE, RECRUITER, HIRING_MANAGER, DEPARTMENT_HEAD, ADMIN | `User.role` |
| `HiringRequestStatus` | DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, REVISION_REQUESTED | `HiringRequest.status` |
| `HiringRequestPriority` | LOW, NORMAL, HIGH, URGENT | `HiringRequest.priority` |
| `ApprovalLevel` | LEVEL_1, LEVEL_2, LEVEL_3 | `ApprovalChainLevel.role` |
| `ApprovalDecision` | PENDING, APPROVED, REJECTED, REVISION_REQUESTED | `HiringRequestApproval.decision` |
| `RecruitmentStatus` | OPEN, PAUSED, CLOSED, FILLED | Role lifecycle |
| `DocumentType` | CV, JD | `Document.documentType` |
| `DocumentState` | PENDING → PROCESSING → PARSED / FAILED_* | `Document.state` |
| `WorkMode` | ONSITE, REMOTE, HYBRID | Role + HiringRequest |
| `ReadinessLabel` | 7 levels: READY_NOW → OUT_OF_SCOPE | `EvaluationRun.readinessLabel` |
| `EvaluationState` | PENDING → RUNNING → COMPLETED / FAILED_* | `EvaluationRun.state` |
| `GapType` | HARD_SKILL, SOFT_SKILL, DOMAIN_KNOWLEDGE, etc. | `GapFinding.gapType` |
| `GapSeverity` | CRITICAL, MODERATE, MINOR | `GapFinding.severity` |
| `ApplicationStatus` | DRAFT → SUBMITTED → EVALUATED → SHORTLISTED/REJECTED | `Application.status` |
| `InviteStatus` | PENDING, ACCEPTED, DECLINED, EXPIRED | `Invite.status` |
| `CandidateVisibility` | PUBLIC, REGISTERED_ONLY, PRIVATE | `CandidateProfile.visibility` |
