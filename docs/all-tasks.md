# Works Reruiter — Master Task List

**Created:** 2026-05-23
**Source:** 7 Epics, 45 Stories, 20 UX Screens, Sprint Status YAML
**Architecture:** NestJS Microservices + React SPA (Turborepo)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| `[x]` | Done |
| `[/]` | In progress |
| `[ ]` | Not started |
| `[-]` | Blocked |
| 🔴 P0 | Blocker — nothing else works without this |
| 🟡 P1 | High — core feature |
| 🟢 P2 | Medium — enhancement |
| 🔵 P3 | Low — polish |

---

## Status Summary

| Phase | Total | Done | In Progress | Not Started | Completion |
|-------|:-----:|:----:|:-----------:|:-----------:|:----------:|
| Phase 0 — Foundation | 14 | 7 | 0 | 7 | 50% |
| Phase 1 — Identity Service | 12 | 0 | 0 | 12 | 0% |
| Phase 2 — Enterprise Hiring (Epic 1) | 16 | 0 | 0 | 16 | 0% |
| Phase 3 — Candidate Flow (Epic 2-3) | 16 | 0 | 0 | 16 | 0% |
| Phase 4 — Evaluation & Review (Epic 4-7) | 24 | 0 | 0 | 24 | 0% |
| Phase 5 — Frontend (React SPA) | 28 | 0 | 0 | 28 | 0% |
| Phase 6 — DevOps & QA | 10 | 0 | 0 | 10 | 0% |
| **TOTAL** | **120** | **7** | **0** | **113** | **~6%** |

---

## Phase 0: Foundation 🔴 P0

> Prerequisite for ALL other phases. Must complete first.

### 0.1 Workspace & Build

- [x] `T-001` Initialize Turborepo monorepo structure *(Story 1-1)*
- [x] `T-002` Configure `turbo.json` build pipeline
- [x] `T-003` Set up Docker Compose (PostgreSQL 16 pgvector + Redis 7)
- [x] `T-004` Create shared `packages/` workspace (`@wr/contracts`, `@wr/config`, `@wr/database`, `@wr/queue`, `@wr/ai`, `@wr/ui`)
- [x] `T-005` Bootstrap 5 NestJS services (gateway, identity, recruiting, profiles, review, worker)

### 0.2 Design System

- [x] `T-006` Create "Case Review Ivory" design system in Stitch *(Story 1-2)*
- [x] `T-007` Generate 20 UX screens in Stitch with synced navigation

### 0.3 Database Schema

- [x] `T-008` Define core Prisma models (User, Organization, Role, Application, etc. — 20 models)
- [x] `T-009` Add enterprise models: `Department`, `ApprovalChain`, `ApprovalChainLevel`
- [x] `T-010` Add workflow models: `HiringRequest`, `HiringRequestApproval`
- [x] `T-011` Add missing Zod schemas to `@wr/contracts` (11 new schemas)
- [x] `T-012` Add missing enums (`HiringRequestPriority`, `ApprovalDecision`)
- [ ] `T-013` **Run `prisma migrate dev`** — persist new models to database
- [ ] `T-014` **Run pgvector SQL migrations** (3 files in `packages/database/migrations/sql/`)

### 0.4 Seed Data

- [ ] `T-015` Run `npx prisma db seed` (12 users, 3 departments, approval chain, 45 skill nodes)

### 0.5 Documentation

- [x] `T-016` Write `docs/data-models.md` — 26-model inventory
- [x] `T-017` Write `docs/api-contracts.md` — 50+ endpoints, RBAC matrix
- [x] `T-018` Write `docs/auth-design.md` — JWT strategy, guard architecture
- [x] `T-019` Write `docs/enterprise-hiring-workflow.md` — state machine, approval algorithm
- [x] `T-020` Write `docs/database-migrations.md` — hybrid migration guide
- [x] `T-021` Create pgvector SQL files (001, 002, 003)
- [x] `T-022` Create seed script `packages/database/prisma/seed.ts`

---

## Phase 1: Identity Service 🔴 P0

> **Depends on:** Phase 0 complete
> **Service:** `services/identity/` (TCP :3010) + `services/gateway/` (HTTP :3001)
> **Spec:** [auth-design.md](./auth-design.md)

### 1.1 Authentication

- [ ] `T-023` Install auth deps (`@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`)
- [ ] `T-024` Implement `AuthService.register()` — hash password, create user, issue JWT pair
- [ ] `T-025` Implement `AuthService.login()` — verify credentials, issue JWT pair
- [ ] `T-026` Implement `AuthService.refresh()` — validate refresh token in Redis, rotate
- [ ] `T-027` Implement `AuthService.forgotPassword()` — generate 6-digit code, store in Redis, send email
- [ ] `T-028` Implement `AuthService.resetPassword()` — validate code, update hash, clear all tokens
- [ ] `T-029` Implement `AuthService.logout()` — clear refresh token from Redis

### 1.2 Gateway Guards

- [ ] `T-030` Implement `JwtAuthGuard` — validate Bearer token, attach `request.user`
- [ ] `T-031` Implement `RolesGuard` — check `@Roles()` decorator metadata vs `request.user.role`
- [ ] `T-032` Implement `@Public()` decorator — skip JWT guard for open endpoints
- [ ] `T-033` Implement `@CurrentUser()` param decorator — extract user from request
- [ ] `T-034` Apply global `JwtAuthGuard` in gateway bootstrap

---

## Phase 2: Enterprise Hiring Flow (Epic 1) 🟡 P1

> **Depends on:** Phase 1 complete
> **Service:** `services/identity/` + `services/recruiting/`
> **Spec:** [enterprise-hiring-workflow.md](./enterprise-hiring-workflow.md)

### 2.1 Organization & Department Management *(Stories 1-3)*

- [ ] `T-035` Implement `OrganizationService.create()` + `list()` + `get()` in Identity
- [ ] `T-036` Implement `OrganizationMemberService.add()` + `remove()` in Identity
- [ ] `T-037` Implement `DepartmentService.create()` + `list()` + `get()` + `update()` + `delete()` in Identity
- [ ] `T-038` Wire gateway controllers → TCP patterns for org/dept endpoints
- [ ] `T-039` Apply `@Roles('ADMIN')` guard to org/dept mutation endpoints

### 2.2 Approval Chain Configuration *(Story 1-4)*

- [ ] `T-040` Implement `ApprovalChainService.create()` — chain + levels
- [ ] `T-041` Implement `ApprovalChainService.list()` + `get()` + `delete()`
- [ ] `T-042` Wire gateway controller → TCP patterns for approval-chain endpoints
- [ ] `T-043` Validate: chain must have 1-3 levels, each with a valid approver user

### 2.3 Hiring Request Lifecycle *(Stories 1-5, 1-6, 1-7)*

- [ ] `T-044` Implement `HiringRequestService.create()` — DEPT_HEAD creates DRAFT
- [ ] `T-045` Implement `HiringRequestService.update()` — edit DRAFT fields
- [ ] `T-046` Implement `HiringRequestService.submit()` — DRAFT → PENDING_APPROVAL (create approval records)
- [ ] `T-047` Implement `HiringRequestService.approve()` — advance level or set APPROVED
- [ ] `T-048` Implement `HiringRequestService.reject()` — set REJECTED with reason
- [ ] `T-049` Implement `HiringRequestService.revise()` — set REVISION_REQUESTED with notes
- [ ] `T-050` Implement `HiringRequestService.list()` — role-filtered (DH sees own, HM sees pending)
- [ ] `T-051` Wire gateway controllers → TCP patterns for hiring-request endpoints
- [ ] `T-052` Apply role guards: create/submit = DEPT_HEAD, approve/reject = HM

### 2.4 Role Pipeline *(Stories 1-8 to 1-12)*

- [ ] `T-053` Implement `RoleService.createFromRequest()` — create Role linked to approved HiringRequest
- [ ] `T-054` Implement JD document upload → worker parsing trigger
- [ ] `T-055` Implement `JobCapabilityModelService.extract()` — parse JD into capabilities JSONB
- [ ] `T-056` Implement job-family scope enforcement (Backend/Frontend/Fullstack only)
- [ ] `T-057` Implement `RoleService.editCapabilities()` — HR Recruiter edits requirements
- [ ] `T-058` Implement `RoleService.publish()` — set `isActive = true`, visible in marketplace

---

## Phase 3: Candidate Flow (Epics 2-3) 🟡 P1

> **Depends on:** Phase 1 (auth), Phase 2.4 (published roles)
> **Service:** `services/profiles/` (TCP :3012) + `services/recruiting/`

### 3.1 Candidate Profile *(Stories 2-1, 2-5)*

- [ ] `T-059` Implement `CandidateProfileService.create()` — linked to User
- [ ] `T-060` Implement `CandidateProfileService.get()` — own profile
- [ ] `T-061` Implement `CandidateProfileService.update()` — headline, summary, skills, visibility, workMode

### 3.2 CV Upload & Parsing *(Stories 2-2, 2-3, 2-6)*

- [ ] `T-062` Implement `DocumentService.upload()` — accept PDF/DOCX, store file, create Document record
- [ ] `T-063` Implement `DocumentService.get()` — return document + parse status
- [ ] `T-064` Implement `DocumentService.delete()` — soft delete
- [ ] `T-065` Implement BullMQ `parse-cv` job processor — extract text from PDF/DOCX
- [ ] `T-066` Implement parsing status updates (PENDING → PROCESSING → PARSED / FAILED_*)
- [ ] `T-067` Implement retry/replace flow for failed documents

### 3.3 Evidence Extraction *(Stories 2-4)*

- [ ] `T-068` Implement BullMQ `extract-evidence` job processor — parse CV text into `EvidenceRecord` entries
- [ ] `T-069` Implement `CandidateCapabilityModel` creation from extracted evidence
- [ ] `T-070` Implement BullMQ `generate-embeddings` job — MiniLM-L6-v2 vectors into `evidence_embeddings`

### 3.4 Job Marketplace *(Stories 3-1, 3-2, 3-3)*

- [ ] `T-071` Implement `RoleService.listPublished()` — paginated, filterable
- [ ] `T-072` Implement search & filter (title, workMode, location, skills)
- [ ] `T-073` Implement AI-assisted job recommendations for logged-in candidates

### 3.5 Application *(Stories 3-4, 3-5)*

- [ ] `T-074` Implement `ApplicationService.create()` — candidate applies with saved profile
- [ ] `T-075` Implement `ApplicationService.list()` — candidate's own applications
- [ ] `T-076` Implement `ApplicationService.withdraw()` — candidate withdraws application
- [ ] `T-077` Implement saved/bookmarked jobs tracking

---

## Phase 4: Evaluation & Review (Epics 4-7) 🟡 P1

> **Depends on:** Phase 3 (applications exist)
> **Service:** `services/recruiting/` + `services/review/` + `services/worker/`

### 4.1 Talent Search *(Stories 4-1, 4-2, 4-3)*

- [ ] `T-078` Implement hybrid search (Dice + TF-IDF + pgvector cosine) with RRF fusion
- [ ] `T-079` Implement `TalentSearchService.search()` — returns ranked candidates with fit reasons
- [ ] `T-080` Implement candidate fit preview (without creating evaluation)

### 4.2 Invite Management *(Stories 4-4, 4-5)*

- [ ] `T-081` Implement `InviteService.create()` — recruiter invites candidate to apply
- [ ] `T-082` Implement `InviteService.respond()` — candidate accepts/declines
- [ ] `T-083` Implement accepted invite → auto-create application

### 4.3 Evaluation Runs *(Stories 5-1 to 5-6)*

- [ ] `T-084` Implement `EvaluationService.run()` — create immutable evaluation snapshot
- [ ] `T-085` Implement BullMQ `run-evaluation` job processor — hybrid match + score
- [ ] `T-086` Implement readiness label computation (7 levels: READY_NOW → OUT_OF_SCOPE)
- [ ] `T-087` Implement gap classification (`GapFinding` — type + severity + evidence)
- [ ] `T-088` Implement hard constraint enforcement (deterministic, no LLM)
- [ ] `T-089` Implement evaluation state tracking (PENDING → RUNNING → COMPLETED / FAILED_*)
- [ ] `T-090` Implement immutable evaluation history (no mutations after completion)

### 4.4 Explanation & Interview Prep *(Stories 6-1 to 6-6)*

- [ ] `T-091` Implement `ExplanationBoxService.generate()` — LLM-generated explanation per evaluation
- [ ] `T-092` Implement `InterviewFocusService.generate()` — gap-based interview questions
- [ ] `T-093` Implement applicant comparison view data (multiple candidates per role)
- [ ] `T-094` Implement evidence provenance drawer data (source location + parsed signal)

### 4.5 Reviewer Feedback *(Stories 7-1, 7-2)*

- [ ] `T-095` Implement `FeedbackService.submit()` — agree/challenge/comment (additive only, no mutation)
- [ ] `T-096` Implement `FeedbackService.list()` — per application feedback timeline

### 4.6 Candidate Packets *(Stories 7-3 to 7-6)*

- [ ] `T-097` Implement `PacketService.generate()` — snapshot of readiness + evidence + gaps + focus
- [ ] `T-098` Implement `PacketService.share()` — share with team members (HM, DH)
- [ ] `T-099` Implement packet timeline view
- [ ] `T-100` Implement packet export (printable HTML / PDF)
- [ ] `T-101` Implement packet access protection (only authorized team members)

---

## Phase 5: Frontend (React SPA) 🟡 P1

> **Depends on:** Phase 1 (auth) — can start in parallel with Phases 2-4
> **App:** `webapp/` (React 19 + Vite 6, :3000)
> **Design:** Stitch Project `15473172897573724568`

### 5.1 App Foundation

- [ ] `T-102` Set up React Router v7 with role-based routing
- [ ] `T-103` Create auth context + `AuthProvider` (store JWT in memory, refresh in httpOnly cookie)
- [ ] `T-104` Create API client module (fetch wrapper with JWT injection + refresh logic)
- [ ] `T-105` Set up React Query (TanStack Query) for server state management
- [ ] `T-106` Create shared layout shell (sidebar + topbar) per role group
- [ ] `T-107` Implement role-based sidebar navigation (4 variations)

### 5.2 Auth Pages (4 screens)

- [ ] `T-108` Build Landing Page → Stitch: `cde43eab49ca47d6802cb7c917821b7c`
- [ ] `T-109` Build Sign Up page (5-role selector) → Stitch: `fe0c2dfe83e145dbb6c0dbe8d4fdd6bc`
- [ ] `T-110` Build Sign In page → Stitch: `392e3bf2ff9a429da9148373c43dd734`
- [ ] `T-111` Build Forgot Password page → Stitch: `5ebd0a544c39483b9d3caacd6eefbf90`

### 5.3 Dashboard Pages (4 screens)

- [ ] `T-112` Build Candidate Dashboard → Stitch: `2ab1f7ad14834db088c697d50bcf7fd3`
- [ ] `T-113` Build HR Recruiter Dashboard → Stitch: `eb07603affed45ada5ff91f73f7babfd`
- [ ] `T-114` Build Department Head Dashboard → Stitch: `9e9940097c3d4f92b00bc20a30b578f4`
- [ ] `T-115` Build Hiring Manager Dashboard → Stitch: `5e75752c4958479c8978441e021efe89`

### 5.4 Candidate Pages (5 screens)

- [ ] `T-116` Build Profile Builder Wizard → Stitch: `2e8bd5dc5b3648babbac605f8dfbf017`
- [ ] `T-117` Build Profile Dashboard → Stitch: `5dc6e1718aa94a1487a0dc36bfb75658`
- [ ] `T-118` Build Job Marketplace → Stitch: `7dcfd00354ea42ee97fef367e3fe3810`
- [ ] `T-119` Build Application Tracker → Stitch: `f3d18c7be83c462fa54a99815979983b`
- [ ] `T-120` Build Invite Management (Candidate) → Stitch: `2c3f08767aa944709aee1bff3eafc7cf`

### 5.5 HR Recruiter Pages (5 screens)

- [ ] `T-121` Build JD Wizard / Role Creation → Stitch: `96d2e6c319cb4e1e90c9ef5389188608`
- [ ] `T-122` Build Talent Search & Review → Stitch: `17aefeaa3bb04f488edcae942429b128`
- [ ] `T-123` Build Pipeline Board (Kanban) → Stitch: `c7955e853d3f4f88a49007bf777399c8`
- [ ] `T-124` Build Packet Builder & Share → Stitch: `6efa774b3d2b498ab791bcd7057b9d9e`
- [ ] `T-125` Build Invite Management (HR) → Stitch: `b07af33acd304f1880454710e0bc40da`

### 5.6 Department Head Pages (1 screen)

- [ ] `T-126` Build Hiring Request Dashboard → Stitch: `a5b28dadb8ae499ab1c24fc14496e9c7`

### 5.7 Hiring Manager Pages (1 screen)

- [ ] `T-127` Build Approval Dashboard → Stitch: `9cb2971d59a74a4589c7e4d624121462`

### 5.8 Settings & Admin

- [ ] `T-128` Build Settings page (profile edit, password change, notifications)
- [ ] `T-129` Build Admin panel (user management, org settings)

---

## Phase 6: DevOps & QA 🟢 P2

> Can start in parallel with Phase 2+

### 6.1 Testing

- [ ] `T-130` Write unit tests for `AuthService` (register, login, refresh, reset)
- [ ] `T-131` Write unit tests for `HiringRequestService` (full state machine)
- [ ] `T-132` Write unit tests for hybrid search (RRF, Dice, TF-IDF)
- [ ] `T-133` Write E2E tests for critical flows (auth → hiring request → role → application)
- [ ] `T-134` Write contract tests (`@wr/contracts` Zod schemas round-trip)

### 6.2 CI/CD

- [ ] `T-135` Create GitHub Actions workflow: lint + typecheck + test
- [ ] `T-136` Create GitHub Actions workflow: build + Docker images
- [ ] `T-137` Create production Docker Compose (multi-service)

### 6.3 Observability

- [ ] `T-138` Add structured logging to all services (pino)
- [ ] `T-139` Add health check endpoints to all microservices

---

## Cross-Reference: Epic → Task Mapping

| Epic | Stories | Tasks | Phase |
|------|:-------:|:-----:|:-----:|
| **Epic 1:** Enterprise Recruitment | 1-1 to 1-12 | T-001 to T-058 | Phase 0, 1, 2 |
| **Epic 2:** Candidate Profile & CV | 2-1 to 2-6 | T-059 to T-070 | Phase 3 |
| **Epic 3:** Job Discovery & Apply | 3-1 to 3-5 | T-071 to T-077 | Phase 3 |
| **Epic 4:** Talent Search & Invite | 4-1 to 4-5 | T-078 to T-083 | Phase 4 |
| **Epic 5:** Evidence-Backed Evaluation | 5-1 to 5-6 | T-084 to T-090 | Phase 4 |
| **Epic 6:** Explanations & Interview Prep | 6-1 to 6-6 | T-091 to T-094 | Phase 4 |
| **Epic 7:** Feedback & Packets | 7-1 to 7-6 | T-095 to T-101 | Phase 4 |
| — (Frontend) | — | T-102 to T-129 | Phase 5 |
| — (DevOps/QA) | — | T-130 to T-139 | Phase 6 |

---

## Cross-Reference: Service → Task Mapping

| Service | Port | Tasks |
|---------|------|-------|
| `services/gateway/` | HTTP :3001 | T-030 to T-034, T-038, T-042, T-051 |
| `services/identity/` | TCP :3010 | T-023 to T-029, T-035 to T-043 |
| `services/recruiting/` | TCP :3011 | T-044 to T-058, T-078 to T-090 |
| `services/profiles/` | TCP :3012 | T-059 to T-070 |
| `services/review/` | TCP :3013 | T-091 to T-101 |
| `services/worker/` | BullMQ | T-065, T-068, T-070, T-085 |
| `webapp/` | :3000 | T-102 to T-129 |
| `packages/database/` | — | T-008 to T-015, T-021, T-022 |
| `packages/contracts/` | — | T-011, T-012, T-134 |

---

## Cross-Reference: UX Screen → Task Mapping

| Screen | Stitch ID | Task |
|--------|-----------|------|
| Landing Page | `cde43eab...` | T-108 |
| Sign Up | `fe0c2dfe...` | T-109 |
| Sign In | `392e3bf2...` | T-110 |
| Forgot Password | `5ebd0a54...` | T-111 |
| Candidate Dashboard | `2ab1f7ad...` | T-112 |
| HR Dashboard | `eb07603a...` | T-113 |
| DH Dashboard | `9e994009...` | T-114 |
| HM Dashboard | `5e75752c...` | T-115 |
| Profile Builder | `2e8bd5dc...` | T-116 |
| Profile Dashboard | `5dc6e171...` | T-117 |
| Job Marketplace | `7dcfd003...` | T-118 |
| Application Tracker | `f3d18c7b...` | T-119 |
| Candidate Invites | `2c3f0876...` | T-120 |
| JD Wizard | `96d2e6c3...` | T-121 |
| Talent Search | `17aefeaa...` | T-122 |
| Pipeline Kanban | `c7955e85...` | T-123 |
| Packet Builder | `6efa774b...` | T-124 |
| HR Invites | `b07af33a...` | T-125 |
| Hiring Requests (DH) | `a5b28dad...` | T-126 |
| Approvals (HM) | `9cb2971d...` | T-127 |

---

## Dependency Graph

```
Phase 0 (Foundation)
  ├── T-013 prisma migrate ──→ ALL Phase 1+
  ├── T-014 pgvector SQL ──→ T-070, T-078
  └── T-015 seed ──→ dev testing

Phase 1 (Identity/Auth)
  ├── T-024..T-029 AuthService ──→ ALL authenticated endpoints
  ├── T-030..T-034 Guards ──→ ALL gateway controllers
  └── T-035..T-043 Org/Dept/Chain ──→ Phase 2

Phase 2 (Enterprise Hiring)
  ├── T-044..T-052 HiringRequest ──→ T-053 (Role creation)
  └── T-053..T-058 Role Pipeline ──→ Phase 3 (marketplace)

Phase 3 (Candidate)
  ├── T-059..T-061 Profile ──→ T-074 (Applications)
  ├── T-062..T-067 CV Parse ──→ T-068 (Evidence)
  ├── T-068..T-070 Evidence ──→ T-078 (Talent Search)
  └── T-074..T-077 Applications ──→ Phase 4 (Evaluations)

Phase 4 (Evaluation & Review)
  ├── T-084..T-090 Evaluations ──→ T-091 (Explanations)
  ├── T-091..T-094 Explanations ──→ T-097 (Packets)
  └── T-095..T-101 Feedback/Packets ──→ done

Phase 5 (Frontend) — can start after Phase 1
  ├── T-102..T-107 Foundation ──→ T-108+ (pages)
  └── T-108..T-129 Pages ──→ parallel with backend
```
