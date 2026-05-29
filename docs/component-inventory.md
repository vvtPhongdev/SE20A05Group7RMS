# Component Inventory — Works Reruiter

**Updated:** 2026-05-28  
**Scan mode:** Full rescan  
**Scope:** Recruitment Workflow Management System (RMS)

---

## Backend Services (NestJS Microservices)

### Gateway Service (`services/gateway/`)

| Component | Type | Pattern | Description |
|-----------|------|---------|-------------|
| `HealthController` | Controller | HTTP `@Get()` | Health check endpoint |
| `IdentityController` | Controller | HTTP → TCP proxy | Auth, user, org, department endpoints |
| `RecruitingController` | Controller | HTTP → TCP proxy | RecruitmentRequest, plan, interview endpoints |
| `ProfilesController` | Controller | HTTP → TCP proxy | Candidate profile, CV endpoints |
| `GatewayModule` | Module | Root | Imports all controllers + TCP client modules |
| `DatabaseModule` | Module | Global | Provides PrismaService |

### Identity Service (`services/identity/`)

| Component | Type | Pattern | Description |
|-----------|------|---------|-------------|
| `AuthModule` | Module | `@MessagePattern` | JWT auth, login, register |
| `UsersModule` | Module | `@MessagePattern` | User CRUD, role assignment (4 roles) |
| `OrganizationsModule` | Module | `@MessagePattern` | Organization management |
| `DepartmentsModule` | Module | `@MessagePattern` | Department hierarchy |

### Recruiting Service (`services/recruiting/`)

| Component | Type | Pattern | Description |
|-----------|------|---------|-------------|
| `RecruitmentRequestsModule` | Module | `@MessagePattern` | 13-state request lifecycle (DRAFT → COMPLETED) |
| `OverallPlansModule` | Module | `@MessagePattern` | Campaign plan management (requires ADMIN approval) |
| `TaskPlansModule` | Module | `@MessagePattern` | Individual task execution within plans |
| `InterviewsModule` | Module | `@MessagePattern` | Interview scheduling, invite dispatch |
| `InterviewResultsModule` | Module | `@MessagePattern` | PASS/FAIL recording, decision tracking |

### Profiles Service (`services/profiles/`)

| Component | Type | Pattern | Description |
|-----------|------|---------|-------------|
| `CandidateProfilesModule` | Module | `@MessagePattern` | Candidate profile CRUD |
| `CvDocumentsModule` | Module | `@MessagePattern` | CV upload, text extraction, parse status |
| `CvEmbeddingsModule` | Module | `@MessagePattern` | Vector embedding generation + semantic search |

### Notification Service (`services/notification/` — replacing `services/review/`)

| Component | Type | Pattern | Description |
|-----------|------|---------|-------------|
| `NotificationsModule` | Module | `@MessagePattern` | In-app notification management |
| `EmailModule` | Module | `@MessagePattern` | Interview invites, offer letters, rejection emails |

> **Note:** The Notification service owns all communication channels (in-app notifications and transactional email).

### Worker Service (`services/worker/`)

| Component | Type | Pattern | Description |
|-----------|------|---------|-------------|
| `index.ts` | Entry | Plain TS | BullMQ Worker (NOT NestJS) |
| `processors/` | Handlers | BullMQ | CV text extraction (PDF/DOCX → text), embedding generation (text → vector) |

---

## Shared Packages (@wr/*)

| Package | Purpose | Key Exports |
|---------|---------|-------------|
| `@wr/contracts` | Enums, Zod schemas, API types | `UserRole`, `RecruitmentRequestStatus`, `PlanStatus`, Zod schemas |
| `@wr/config` | Environment validation | `validateApiEnv()`, `validateWorkerEnv()` |
| `@wr/database` | Prisma schema + client | `PrismaClient`, domain entities |
| `@wr/queue` | BullMQ job definitions | Job type enums, queue names |
| `@wr/ai` | CV parsing utilities, vector search helpers | Embedding generation, cosine similarity search (NO DB dep) |
| `@wr/ui` | Shared UI components | Radix-based primitives |

---

## Frontend (React SPA)

| Component | Type | Description |
|-----------|------|-------------|
| `App.tsx` | Root | React Router v7 setup |
| `main.tsx` | Entry | React DOM render |

> **Note:** Frontend is early-stage. Full component library in `@wr/ui` package with Radix primitives + CSS Variables design system.

---

## Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| `docker-compose.yml` | Docker Compose | PostgreSQL 16 (pgvector) + Redis 7 |
| `turbo.json` | Turborepo | Build pipeline orchestration |
| `prettier.config.mjs` | Prettier | Code formatting |
| `tsconfig.base.json` | TypeScript | Shared strict config |
| `.env` / `.env.example` | dotenv | Environment variables |
