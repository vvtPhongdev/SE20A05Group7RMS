# Component Inventory — Works Reruiter

**Generated:** 2026-05-20  
**Scan mode:** Full rescan (quick)

---

## Backend Services (NestJS Microservices)

### Gateway Service (`services/gateway/`)

| Component | Type | Pattern | Description |
|-----------|------|---------|-------------|
| `HealthController` | Controller | HTTP `@Get()` | Health check endpoint |
| `IdentityController` | Controller | HTTP → TCP proxy | Auth, user, org, department endpoints |
| `RecruitingController` | Controller | HTTP → TCP proxy | HiringRequest, role, application endpoints |
| `ProfilesController` | Controller | HTTP → TCP proxy | Candidate profile, CV endpoints |
| `ReviewController` | Controller | HTTP → TCP proxy | Reviewer feedback, packet endpoints |
| `GatewayModule` | Module | Root | Imports all controllers + TCP client modules |
| `DatabaseModule` | Module | Global | Provides PrismaService |

### Identity Service (`services/identity/`)

| Component | Type | Pattern | Description |
|-----------|------|---------|-------------|
| `AuthModule` | Module | `@MessagePattern` | JWT auth, login, register |
| `UsersModule` | Module | `@MessagePattern` | User CRUD, role assignment |
| `OrganizationsModule` | Module | `@MessagePattern` | Organization management (FR-27) |
| `DepartmentsModule` | Module | `@MessagePattern` | Department hierarchy (FR-27) |
| `ApprovalChainsModule` | Module | `@MessagePattern` | Multi-level approval config (FR-28) |

### Recruiting Service (`services/recruiting/`)

| Component | Type | Pattern | Description |
|-----------|------|---------|-------------|
| `HiringRequestsModule` | Module | `@MessagePattern` | DRAFT→PENDING→APPROVED→RECRUITING (FR-29, FR-30) |
| `RolesModule` | Module | `@MessagePattern` | Role/JD creation from approved requests (FR-31) |
| `ApplicationsModule` | Module | `@MessagePattern` | Candidate application submission |
| `EvaluationsModule` | Module | `@MessagePattern` | Evaluation run orchestration |
| `TalentSearchModule` | Module | `@MessagePattern` | Hybrid search: RRF(Dice+TF-IDF, MiniLM vectors) |

### Profiles Service (`services/profiles/`)

| Component | Type | Pattern | Description |
|-----------|------|---------|-------------|
| `CandidateProfilesModule` | Module | `@MessagePattern` | Profile CRUD (FR-4) |
| `CvDocumentsModule` | Module | `@MessagePattern` | CV upload, parse status (FR-5, FR-6) |
| `EvidenceModule` | Module | `@MessagePattern` | Evidence record management (FR-7) |

### Review Service (`services/review/`)

| Component | Type | Pattern | Description |
|-----------|------|---------|-------------|
| `FeedbackModule` | Module | `@MessagePattern` | Agree/challenge/comment (FR-22) |
| `PacketsModule` | Module | `@MessagePattern` | Candidate review packets |

### Worker Service (`services/worker/`)

| Component | Type | Pattern | Description |
|-----------|------|---------|-------------|
| `index.ts` | Entry | Plain TS | BullMQ Worker (NOT NestJS) |
| `processors/` | Handlers | BullMQ | Job-specific handlers (CV parse, embedding, evaluation) |

---

## Shared Packages (@wr/*)

| Package | Purpose | Key Exports |
|---------|---------|-------------|
| `@wr/contracts` | Enums, Zod schemas, API types | `ReadinessLabel`, `HiringRequestStatus`, Zod schemas |
| `@wr/config` | Environment validation | `validateApiEnv()`, `validateWorkerEnv()` |
| `@wr/database` | Prisma schema + client | `PrismaClient`, 420-line schema |
| `@wr/queue` | BullMQ job definitions | Job type enums, queue names |
| `@wr/ai` | Matching engine (NO DB dep) | Skill graph, Dice, TF-IDF, RRF, embeddings |
| `@wr/ui` | Shared UI components | Radix-based primitives |

---

## Frontend (React SPA)

| Component | Type | Description |
|-----------|------|-------------|
| `App.tsx` | Root | React Router v7 setup |
| `main.tsx` | Entry | React DOM render |

> **Note:** Frontend is early-stage. Full component library in `@wr/ui` package with Radix primitives + CSS Variables ("Case Review Ivory" design system).

---

## Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| `docker-compose.yml` | Docker Compose | PostgreSQL 16 (pgvector) + Redis 7 |
| `turbo.json` | Turborepo | Build pipeline orchestration |
| `prettier.config.mjs` | Prettier | Code formatting |
| `tsconfig.base.json` | TypeScript | Shared strict config |
| `.env` / `.env.example` | dotenv | Environment variables |
