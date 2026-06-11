# Source Tree Analysis — Works Reruiter

**Updated:** 2026-05-28  
**Repository type:** Turborepo monorepo  
**Scope:** Recruitment Workflow Management System (RMS)  
**Total TypeScript source files:** ~80+

---

## Annotated Directory Tree

```
works-reruiter/
│
├── services/                          # ─── Backend Microservices ───────
│   ├── gateway/                       # HTTP API Gateway (:3001)
│   │   └── src/
│   │       ├── main.ts                # 🚀 NestFactory.create + Swagger
│   │       ├── gateway.module.ts      # Root module — imports all feature modules
│   │       ├── constants.ts           # SERVICE_PORTS, SERVICE_TOKENS
│   │       ├── controllers/           # HTTP → TCP proxy layer
│   │       │   ├── health.controller.ts       # GET /health
│   │       │   ├── identity.controller.ts     # Auth/User/Org endpoints
│   │       │   ├── recruiting.controller.ts   # RecruitmentRequest/Plan/Interview endpoints
│   │       │   └── profiles.controller.ts     # CandidateProfile/CV endpoints
│   │       └── common/
│   │           └── database/          # PrismaService (Global)
│   │
│   ├── identity/                      # Auth + Users + Orgs + Departments (TCP :3010)
│   │   └── src/
│   │       ├── main.ts                # TCP microservice bootstrap
│   │       ├── identity.module.ts     # Root module
│   │       └── modules/
│   │           ├── auth/              # Authentication module (JWT)
│   │           ├── users/             # User CRUD (4 roles)
│   │           ├── organizations/     # Organization management
│   │           └── departments/       # Department hierarchy
│   │
│   ├── recruiting/                    # RecruitmentRequests + Plans + Interviews (TCP :3011)
│   │   └── src/
│   │       ├── main.ts
│   │       ├── recruiting.module.ts
│   │       └── modules/
│   │           ├── recruitment-requests/  # 13-state lifecycle (DRAFT → COMPLETED)
│   │           ├── overall-plans/         # Campaign plan management
│   │           ├── task-plans/            # Individual task execution
│   │           ├── interviews/            # Interview scheduling
│   │           └── interview-results/     # PASS/FAIL recording
│   │
│   ├── profiles/                      # Candidate Profiles + CV Management (TCP :3012)
│   │   └── src/
│   │       ├── main.ts
│   │       ├── profiles.module.ts
│   │       └── modules/
│   │           ├── candidate-profiles/ # Profile CRUD
│   │           ├── cv-documents/       # CV upload + text extraction
│   │           └── cv-embeddings/      # Vector embedding + semantic search
│   │
│   ├── review/                        # [LEGACY — repurposing as Notification service]
│   │   └── src/
│   │       ├── main.ts                # Will become notification.module.ts
│   │       └── modules/               # Legacy: feedback/, packets/ → notifications/, email/
│   │
│   └── worker/                        # BullMQ Async Job Processor (NOT NestJS)
│       └── src/
│           ├── index.ts               # 🚀 Plain TS entry — BullMQ Worker
│           └── processors/            # CV text extraction, embedding generation
│
├── packages/                          # ─── Shared Libraries (@wr/*) ───────
│   ├── contracts/                     # @wr/contracts — SINGLE SOURCE OF TRUTH
│   │   └── src/
│   │       ├── enums/index.ts         # All domain enums (UPPERCASE values)
│   │       ├── schemas/index.ts       # All Zod schemas
│   │       ├── types/index.ts         # Inferred TypeScript types
│   │       └── index.ts              # Barrel export
│   │
│   ├── config/                        # @wr/config — Env validation
│   │   └── src/
│   │       └── index.ts              # validateApiEnv(), validateWorkerEnv()
│   │
│   ├── database/                      # @wr/database — Prisma schema + client
│   │   └── prisma/
│   │       └── schema.prisma          # Domain entities (in transition to target schema)
│   │
│   ├── queue/                         # @wr/queue — BullMQ job definitions
│   │   └── src/index.ts
│   │
│   ├── ai/                            # @wr/ai — CV parsing utilities + vector search (NO DB dep)
│   │   └── src/
│   │       ├── search/
│   │       │   └── vector/            # MiniLM embedding generation + cosine similarity
│   │       └── parsers/               # CV text extraction (PDF/DOCX)
│   │
│   ├── ui/                            # @wr/ui — Shared Radix components
│   │   └── src/index.ts
│   │
│   └── typescript-config/             # Shared tsconfig bases
│
├── webapp/                            # ─── React SPA (Vite) ───────
│   ├── index.html                     # SPA entry
│   ├── vite.config.ts                 # Dev (:3000), proxy /api → :3001
│   └── src/
│       ├── main.tsx                   # React root
│       └── App.tsx                    # Router setup (React Router v7)
│
├── tests/                             # ─── Test Suites (stubs) ───────
│   ├── contract/.gitkeep
│   └── e2e/.gitkeep
│
├── _bmad-output/                      # ─── BMAD Planning Artifacts ───────
│   ├── planning-artifacts/
│   │   ├── prds/                      # PRD + addendum
│   │   ├── briefs/                    # Product brief
│   │   ├── architecture.md            # Technical architecture doc
│   │   ├── epics.md                   # Epics and stories
│   │   └── ux-design-specification.md
│   ├── implementation-artifacts/
│   │   ├── sprint-status.yaml         # Sprint tracking
│   │   └── *.md                       # Story files
│   └── brainstorming/                 # Brainstorming sessions
│
├── project-context.md                 # 📋 AI agent context — source of truth
├── docker-compose.yml                 # PostgreSQL 16 (pgvector) + Redis 7
├── turbo.json                         # Build pipeline config
├── tsconfig.base.json                 # Shared TypeScript config
├── prettier.config.mjs                # Code formatter config
├── package.json                       # Root workspace + scripts
└── .env / .env.example                # Environment variables
```

## Critical Folders

| Folder                 | Purpose                                               | Entry Point     |
| ---------------------- | ----------------------------------------------------- | --------------- |
| `services/gateway/`    | HTTP API — only service with `@Get()`, `@Post()`      | `main.ts`       |
| `services/identity/`   | Auth, users, orgs, departments                        | `main.ts` (TCP) |
| `services/recruiting/` | RecruitmentRequests, plans, interviews, results       | `main.ts` (TCP) |
| `services/profiles/`   | Candidate profiles, CV documents, embeddings          | `main.ts` (TCP) |
| `services/review/`     | **LEGACY** — being repurposed as Notification service | `main.ts` (TCP) |
| `services/worker/`     | BullMQ job processor (plain TS, NOT NestJS)           | `index.ts`      |
| `packages/contracts/`  | Enums + Zod schemas — single source of truth          | `index.ts`      |
| `packages/database/`   | Prisma schema + client                                | `schema.prisma` |
| `packages/ai/`         | CV parsing + vector search — NO database dependency   | `index.ts`      |

## Integration Points

```
webapp ──HTTP──→ gateway ──TCP──→ identity / recruiting / profiles / notification
                   │
                   └── BullMQ ──→ worker ──→ PostgreSQL + Redis
```

- **webapp → gateway:** REST over HTTP, Vite proxy on `:3000 → :3001`
- **gateway → services:** TCP via `@nestjs/microservices`, `ClientProxy.send()`
- **gateway → worker:** BullMQ job queue via Redis
- **all services → database:** Shared PostgreSQL via PrismaService
