---
project_name: 'works-reruiter'
user_name: 'Minh_dev'
date: '2026-05-28'
scope: 'Recruitment Workflow Management System (RMS)'
sections_completed: ['technology_stack', 'architecture_rules', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules']
existing_patterns_found: 16
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

> **SCOPE PIVOT (2026-05-28):** This project has pivoted from a "Reasoning-First RMS" (two-sided talent marketplace with AI scoring) to an **internal enterprise Recruitment Workflow Management System**. The codebase is in transition — the Prisma schema and contracts enums still contain legacy marketplace entities (EvaluationRun, ReadinessLabel, SkillNode, etc.) that will be replaced. All **new code** must follow the workflow-first architecture described in this document.

---

## Technology Stack & Versions

### Core

| Technology | Version | Package / Notes |
|-----------|---------|-----------------|
| **Node.js** | 22+ | `@types/node: ^22.15.0` across all packages |
| **TypeScript** | ^5.8.3 | Strict mode enforced everywhere |
| **Turborepo** | latest | Monorepo orchestrator — `turbo run build/dev/lint/typecheck` |

### Backend (`services/`)

| Technology | Version | Notes |
|-----------|---------|-------|
| **NestJS** | ^11.1.0 | `@nestjs/common`, `@nestjs/core`, `@nestjs/microservices` |
| **NestJS Swagger** | ^11.2.0 | Gateway only |
| **NestJS JWT** | ^11.0.0 | Identity service + Gateway guards |
| **NestJS BullMQ** | ^11.0.0 | Worker service |
| **PostgreSQL** | 16 | Docker image: `pgvector/pgvector:pg16` |
| **Prisma** | ^6.8.2 | ORM + `postgresqlExtensions` preview feature |
| **pgvector** | built-in | `vector(384)` columns, `ivfflat` indexes |
| **BullMQ** | ^5.52.0 | Async job queue |
| **Redis** | 7-alpine | BullMQ backend |
| **IORedis** | ^5.6.1 | Redis client |
| **Zod** | ^3.25.1 | Schema validation (contracts + ai packages) |

### Frontend (`webapp/`)

| Technology | Version | Notes |
|-----------|---------|-------|
| **React** | ^19.1.0 | SPA, no SSR |
| **React DOM** | ^19.1.0 | |
| **React Router** | ^7.6.0 | `react-router-dom` v7 |
| **Vite** | ^6.3.0 | Dev server on `:3000`, proxy `/api` → `:3001` |
| **@vitejs/plugin-react** | ^4.4.0 | |

### Dev Tooling

| Tool | Config |
|------|--------|
| **Prettier** | `prettier.config.mjs` — semi, singleQuote, trailing commas, 100 printWidth, 2 tab |
| **TypeScript** | strict, noUnusedLocals, noUnusedParameters, noFallthroughCasesInSwitch |

---

## Domain: Recruitment Workflow Management

### System Purpose

An internal enterprise system that digitizes and automates the recruitment workflow:
**Trưởng Phòng Ban → Trưởng Phòng Nhân Sự / Phòng Tuyển Dụng → Admin (Sếp/Giám Đốc)**

### 4 Actors (Roles)

| Role | Enum Value | Responsibilities |
|------|-----------|-----------------|
| **Admin / Boss** | `ADMIN` | Final approval authority, strategic reporting, system configuration |
| **Trưởng Phòng Ban** | `DEPARTMENT_HEAD` | Creates recruitment requests, tracks progress, reviews candidates |
| **Trưởng Phòng Nhân Sự** | `HR_MANAGER` | Reviews requests, creates campaign plans, manages interviews, screens CVs |
| **Ứng Viên** | `CANDIDATE` | Submits CV, receives interview invitations, views results |

### 13-State Recruitment Request Lifecycle

```
DRAFT → PENDING_HR_REVIEW → PENDING_BOSS_APPROVAL → APPROVED → PLANNING
→ PLAN_PENDING_APPROVAL → ACTIVE → INTERVIEWING → DECISION_PENDING
→ HIRED / NOT_HIRED → COMPLETED
                       ↗ REJECTED (from PENDING_HR_REVIEW or PENDING_BOSS_APPROVAL)
```

### Plan-Locked Execution Rule

> **CRITICAL:** No recruitment activity (CV screening, interview scheduling, candidate communication) is permitted until an `OverallPlan` linked to an `APPROVED` request has been approved by Admin. This is the system's core enforcement mechanism.

### Core Entities (Target Schema)

| Entity | Description |
|--------|-------------|
| `User` | All system actors (4 roles) |
| `Organization` | Company / enterprise |
| `Department` | Org unit, each has a head (DEPARTMENT_HEAD) |
| `RecruitmentRequest` | The 13-state workflow entity, created by DEPARTMENT_HEAD |
| `OverallPlan` | Campaign plan created by HR_MANAGER, requires ADMIN approval |
| `TaskPlan` | Individual tasks within an OverallPlan (JOB_POSTING, CV_COLLECTION, etc.) |
| `Interview` | Scheduled interview, linked to a request + candidate |
| `InterviewResult` | PASS/FAIL outcome of an interview |
| `CandidateProfile` | Candidate's profile (linked to User with CANDIDATE role) |
| `CvDocument` | Uploaded CV file (PDF/DOCX) |
| `CvEmbedding` | Vector embedding chunks from parsed CV (pgvector) |
| `RequestLog` | Audit trail — every status change auto-logged |
| `Notification` | In-app and email notifications |

### Key Enums (Target)

```typescript
enum UserRole { ADMIN, DEPARTMENT_HEAD, HR_MANAGER, CANDIDATE }
enum RecruitmentRequestStatus {
  DRAFT, PENDING_HR_REVIEW, PENDING_BOSS_APPROVAL,
  APPROVED, REJECTED, PLANNING, PLAN_PENDING_APPROVAL,
  ACTIVE, INTERVIEWING, DECISION_PENDING,
  HIRED, NOT_HIRED, COMPLETED
}
enum PlanStatus { DRAFT, PENDING_APPROVAL, APPROVED, REVISION_REQUIRED }
enum TaskType { JOB_POSTING, CV_COLLECTION, CV_SCREENING, INTERVIEW_COORDINATION }
enum TaskStatus { PENDING, IN_PROGRESS, COMPLETED }
enum InterviewStatus { SCHEDULED, COMPLETED, CANCELLED, RESCHEDULED }
enum InterviewResult { PENDING, PASS, FAIL }
enum Urgency { LOW, MEDIUM, HIGH, CRITICAL }
enum NotificationType { REQUEST_UPDATE, INTERVIEW_INVITE, OFFER, REJECTION, PLAN_UPDATE, SYSTEM }
```

---

## Architecture Rules

### Monorepo Structure

```
works-reruiter/
├── services/          # NestJS backend services
│   ├── gateway/       # HTTP entry point (:3001) — ONLY service with HTTP decorators
│   ├── identity/      # Auth + Users + Organizations + Departments (TCP :3010)
│   ├── recruiting/    # RecruitmentRequests + Plans + Interviews + Results (TCP :3011)
│   ├── profiles/      # Candidate Profiles + CV storage + Vector Search (TCP :3012)
│   ├── review/        # [LEGACY — will be repurposed or removed]
│   └── worker/        # BullMQ async job processor (NOT a NestJS app)
├── webapp/            # React SPA (Vite, :3000)
├── packages/          # Shared libraries
│   ├── contracts/     # @wr/contracts — Enums, Zod schemas, API types (SINGLE SOURCE OF TRUTH)
│   ├── config/        # @wr/config — Zod-validated env schemas (ApiEnv, WorkerEnv)
│   ├── database/      # @wr/database — Prisma schema, client, migrations
│   ├── queue/         # @wr/queue — BullMQ job definitions
│   ├── ai/            # @wr/ai — CV parsing utilities, vector search helpers
│   ├── ui/            # @wr/ui — Shared UI component library (Radix)
│   └── typescript-config/  # Shared tsconfig bases
└── turbo.json
```

### Service Communication Pattern

```
webapp → gateway (HTTP) → microservice (TCP via @nestjs/microservices)
```

**CRITICAL: Two distinct controller types exist:**

1. **Gateway controllers** (`services/gateway/src/controllers/`):
   - Use HTTP decorators: `@Get()`, `@Post()`, `@ApiTags()`, `@ApiOperation()`
   - Proxy via `ClientProxy.send('pattern', payload)` wrapped in `firstValueFrom()`
   - Import `SERVICE_TOKENS` for `@Inject()` of TCP clients

2. **Microservice controllers** (`services/{service}/src/modules/*/`):
   - Use `@MessagePattern('domain.action')` — NO HTTP decorators
   - Receive payload via `@Payload()` decorator
   - Return data directly (no `firstValueFrom`)

### Service Responsibilities

| Service | Port | Responsibilities |
|---------|------|-----------------|
| **Gateway** | `:3001` | HTTP entry, CORS, Swagger, JWT validation, RBAC guards, request routing |
| **Identity** | `:3010` (TCP) | User registration/login, JWT + refresh tokens, organizations, departments |
| **Recruiting** | `:3011` (TCP) | Recruitment requests, approval workflow, OverallPlan + TaskPlan, interviews, results |
| **Profiles** | `:3012` (TCP) | Candidate profiles, CV storage, CV text extraction, vector embeddings, semantic search |
| **Notification** | `:3013` (TCP) | Email dispatch (interview invites, offer letters, rejections), in-app notifications |
| **Worker** | — (BullMQ) | Async CV parsing (PDF/DOCX → text), embedding generation (text → vector) |

### Service Ports

| Service | Port | Env Var |
|---------|------|---------|
| Gateway | 3001 | `GATEWAY_PORT` |
| Identity | 3010 | `IDENTITY_PORT` |
| Recruiting | 3011 | `RECRUITING_PORT` |
| Profiles | 3012 | `PROFILES_PORT` |
| Notification | 3013 | `NOTIFICATION_PORT` |
| Webapp (Vite) | 3000 | N/A |

### Shared Database

- **All services share ONE PostgreSQL database** (ADR-006: premature DB-per-service adds complexity)
- Prisma schema lives in `packages/database/prisma/schema.prisma`
- Each service has its own `PrismaService` extending `PrismaClient` from `@wr/database`
- The `PrismaService` implements `OnModuleInit` + `OnModuleDestroy` lifecycle hooks
- Each service's `DatabaseModule` provides and exports `PrismaService`

### Database Schema Ownership

| Schema Area | Tables | Managed By |
|------------|--------|-----------|
| Identity | `users`, `organizations`, `departments`, `refresh_tokens` | Identity Service |
| Recruiting | `recruitment_requests`, `overall_plans`, `task_plans`, `interviews`, `interview_results`, `request_logs` | Recruiting Service |
| Profiles | `candidate_profiles`, `cv_documents`, `cv_embeddings`, `cv_structured_data` | Profiles Service |
| Notification | `notifications`, `email_logs` | Notification Service |

### Workspace Package References

All internal packages use `"*"` version in `package.json`:
```json
"@wr/contracts": "*",
"@wr/config": "*",
"@wr/database": "*"
```

---

## Critical Implementation Rules

### Language-Specific Rules (TypeScript)

- **Strict mode is mandatory** — `strict: true`, `noUnusedLocals`, `noUnusedParameters`
- **Target**: ES2022 (webapp uses `ESNext` module, services use Node CJS via NestJS)
- **Path aliases**: Webapp uses `@/*` → `src/*` (configured in both `tsconfig.json` and `vite.config.ts`)
- **No path aliases in services/packages** — use relative imports or workspace package imports (`@wr/contracts`)
- **Zod for runtime validation**, `class-validator` for NestJS gateway DTOs — do NOT mix them in the same layer
- **Enum values are UPPERCASE string literals** — e.g., `DEPARTMENT_HEAD = 'DEPARTMENT_HEAD'`
- **All enums live in `packages/contracts/src/enums/index.ts`** — never define domain enums inline in a service
- **All Zod schemas live in `packages/contracts/src/schemas/index.ts`** — never define shared schemas in a service

### Framework-Specific Rules (NestJS)

- **Module organization**: Each domain feature is a NestJS module with triad: `*.module.ts`, `*.controller.ts`, `*.service.ts`
- **Module location**: `services/{service}/src/modules/{feature}/`
- **Service root module**: `services/{service}/src/{service}.module.ts` imports all feature modules
- **Database module**: Each service has `common/database/database.module.ts` providing `PrismaService` (Global)
- **TCP message patterns**: Use dot notation — `domain.action` (e.g., `recruiting.create-request`, `profiles.search-cv`)
- **Gateway proxy pattern**: `@Body() body → this.clientProxy.send('pattern', body) → firstValueFrom()`
- **Worker service is NOT NestJS** — it's a plain TypeScript process using BullMQ `Worker` class directly
- **BullMQ jobs**: Define job types in `@wr/queue`, process in `services/worker/src/processors/`

### Framework-Specific Rules (React / Vite)

- **Vite dev server** proxies `/api` to gateway at `http://localhost:3001`
- **React Router v7** for SPA routing — no file-system routing
- **No SSR** — pure client-side SPA (ADR-005)
- **CSS Variables** for theming (not Tailwind) — design system tokens
- **Radix UI** for accessible primitives

### AI & Vector Search Rules — Simplified for RMS

- **AI is strictly utility** — used only for CV text extraction and semantic search
- **NO LLM for scoring, ranking, or decision-making** — all hiring decisions are human-made
- **Embedding model**: `all-MiniLM-L6-v2` (384 dimensions), self-hosted via `@xenova/transformers`
- **Vector search**: pgvector cosine similarity for CV screening
- **pgvector columns** are NOT in Prisma schema — managed via raw SQL (`$executeRawUnsafe`)
- **Local inference only** — no external API calls, all processing inside Docker container
- **Privacy** — CV data never leaves the server; all embedding computed locally

### Workflow Enforcement Rules

- **Every status change MUST create a `RequestLog` entry** — this is the audit trail
- **Plan-locked execution**: Block all recruitment activities (CV screening, interviews) unless an approved `OverallPlan` exists
- **Approval chain**: DEPARTMENT_HEAD → HR_MANAGER → ADMIN (configurable per department)
- **State machine enforcement**: Only valid transitions are allowed (e.g., cannot go from DRAFT → ACTIVE directly)
- **Traceability**: Department Heads can track their requests in real-time via the tracking dashboard

---

## Testing Rules

- **Jest** for service testing (`ts-jest ^29.3.0`)
- **Test files**: Co-located with source or in `__tests__/` directories
- Tests are NOT yet established — when creating tests:
  - Use `@nestjs/testing` for service/controller unit tests
  - Mock `PrismaService` — never hit real DB in unit tests
  - For `@wr/ai` package: pure unit tests (no DB, no DI needed)

---

## Code Quality & Style Rules

### Prettier Config (enforced)

```js
semi: true
singleQuote: true
trailingComma: "all"
printWidth: 100
tabWidth: 2
arrowParens: "always"
endOfLine: "lf"
```

### Naming Conventions

| Entity | Pattern | Example |
|--------|---------|---------|
| Files | kebab-case | `recruitment-request.service.ts` |
| Classes | PascalCase | `RecruitmentRequestService` |
| Functions/methods | camelCase | `createRequest()` |
| Enums | PascalCase (name), UPPER_SNAKE (values) | `UserRole.DEPARTMENT_HEAD` |
| DB tables | snake_case (via `@@map`) | `recruitment_requests` |
| DB columns | camelCase in Prisma, snake_case in SQL (via `@map`) | `createdAt` → `created_at` |
| Message patterns | dot.notation | `recruiting.create-request` |
| Workspace packages | `@wr/{name}` | `@wr/contracts` |

### Code Comments

- Section headers use `// ─── Section Name ───────` (em-dash box drawing)
- Top-of-file comments explain the module's purpose
- JSONB fields document their expected shape in comments
- Enum string values are always the same as the key name

### Prisma Schema Conventions

- Every model has `@@map("snake_case_table_name")`
- Every non-camelCase column has `@map("snake_case_column_name")`
- Relations always specify `onDelete` behavior
- Indexes use descriptive names: `@@index([field], map: "idx_table_field")`
- Unique constraints: `@@unique([...], map: "uq_table_fields")`
- JSONB fields are typed as `Json` or `Json?` with comment documenting shape
- pgvector columns exist OUTSIDE Prisma (raw SQL migration)

---

## Development Workflow Rules

### Docker

```bash
docker compose up -d    # PostgreSQL 16 (pgvector) + Redis 7
```

### Dev Commands

```bash
npm run dev              # Start all services via Turborepo (parallel)
npm run dev:gateway      # Start gateway only
npm run dev:recruiting   # Start recruiting service only
npm run dev:webapp       # Start React SPA
npm run db:generate      # Prisma generate
npm run db:migrate:dev   # Prisma migrate dev
npm run db:push          # Prisma push (no migration)
```

### Environment

- Validated at startup via `@wr/config` Zod schemas (`validateApiEnv()`, `validateWorkerEnv()`)
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_HOST` / `REDIS_PORT` — BullMQ backend
- `JWT_SECRET` — minimum 10 characters
- `API_CORS_ORIGIN` — defaults to `http://localhost:3000`

---

## Codebase Transition Notes

> **IMPORTANT FOR ALL AGENTS:** The codebase is mid-pivot. The following legacy artifacts exist but are being replaced:

### Legacy Entities (in Prisma schema — TO BE REPLACED)

| Legacy Entity | Replacement |
|--------------|-------------|
| `EvaluationRun` | Removed — no AI-driven evaluation |
| `EvidenceRecord` | Removed — no evidence-based assessment |
| `GapFinding` | Removed — no gap analysis |
| `ExplanationBox` | Removed — no AI narration |
| `InterviewFocusItem` | Simplified → `Interview` |
| `ReviewerFeedback` | Simplified → `InterviewResult` |
| `CandidatePacket` | Removed |
| `SkillNode` / `SkillEdge` | Removed — no skill knowledge graph |
| `EvidenceEmbedding` | Replaced by `CvEmbedding` (simpler) |
| `JobCapabilityModel` | Removed — JD is plain text |
| `CandidateCapabilityModel` | Removed — CV structured data is simpler |

### Legacy Enums (in `@wr/contracts` — TO BE REPLACED)

| Legacy Enum | Status |
|------------|--------|
| `ReadinessLabel` | Remove — no readiness scoring |
| `EvaluationState` | Remove — no evaluation runs |
| `GapType` / `GapSeverity` | Remove — no gap analysis |
| `EvidenceType` | Remove — no evidence tracking |
| `ApplicationStatus` | Simplify — candidates don't "apply"; HR finds them |
| `InviteStatus` | Keep — for interview invitations |
| `CandidateVisibility` | Remove — all candidates are internal |
| `SkillCategory` / `SkillRelationship` | Remove — no skill graph |
| `RECRUITER` / `HIRING_MANAGER` roles | Replace with `HR_MANAGER` |

### What to Do When Encountering Legacy Code

1. **Do NOT build new features on legacy entities** — use the target schema from `docs/data-models.md`
2. **Do NOT add new enums to the old enum set** — define new enums per the target list above
3. **When refactoring a module**, replace legacy patterns with workflow-first patterns
4. **Reference `docs/all-tasks.md`** for the implementation roadmap

---

## Critical Don't-Miss Rules

### ❌ Anti-Patterns to Avoid

1. **Never use LLM for scoring or ranking** — AI is utility only (CV parsing + vector search)
2. **Never define enums or Zod schemas outside `@wr/contracts`** — it's the single source of truth
3. **Never add HTTP decorators to microservice controllers** — only gateway gets `@Get()`, `@Post()`, etc.
4. **Never use `@Controller('path')` in microservices** — they use `@Controller()` (empty) + `@MessagePattern()`
5. **Never import PrismaClient directly in services** — always inject `PrismaService` via DI
6. **Never bypass the plan-locked rule** — no recruitment activities without an approved OverallPlan
7. **Never skip RequestLog creation** — every status transition must be logged
8. **Never use Tailwind CSS** — the project uses CSS Variables design system
9. **Never create separate databases for services** — all share one PostgreSQL instance (ADR-006)
10. **Never add pgvector columns to Prisma schema** — they're managed via raw SQL
11. **Never use SSR/Next.js patterns** — webapp is a pure Vite SPA (ADR-005)
12. **Never build on legacy marketplace entities** — use the target schema from this document

### ⚠️ Edge Cases & Gotchas

- **Prisma doesn't support pgvector natively** — vector columns + indexes must be created/queried via raw SQL
- **Worker service is NOT NestJS** — it's a plain TS process; don't try to use NestJS DI or decorators
- **`@wr/ai` has no database dependency** — it exports pure functions/classes; DB interaction happens in the calling service
- **Gateway must wrap TCP calls in `firstValueFrom()`** — otherwise you get an Observable, not a value
- **BullMQ `@xenova/transformers` is lazy-loaded** — the embedding model downloads on first use (~80MB)
- **Prisma `previewFeatures = ["postgresqlExtensions"]`** is required for pgvector extension support
- **Docker image is `pgvector/pgvector:pg16`** not standard `postgres:16` — this includes pgvector extension
- **The `review` service is legacy** — it maps to the old marketplace model and will be repurposed as the Notification service or removed
- **The Prisma schema has a `prisma.config.ts`** at root that loads `.env` for `DATABASE_URL`
- **UserRole enum currently has 5 roles** (`RECRUITER`, `HIRING_MANAGER` are legacy) — target is 4 roles

---

## Reference Documents

| Document | Path | Purpose |
|----------|------|---------|
| Architecture | `docs/architecture.md` | Service diagram, communication rules, Docker setup |
| Data Models | `docs/data-models.md` | Target entity schemas + enums |
| All Tasks | `docs/all-tasks.md` | Master implementation roadmap (T-001 to T-084) |
| API Contracts | `docs/api-contracts.md` | Endpoint specifications |
| Auth Design | `docs/auth-design.md` | JWT flow, guards, RBAC |
| Project Overview | `PROJECT_OVERVIEW/` | Full product context (Vietnamese) |

---
