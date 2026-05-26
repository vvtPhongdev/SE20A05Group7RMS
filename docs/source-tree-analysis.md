# Source Tree Analysis — Works Reruiter

**Generated:** 2026-05-20  
**Repository type:** Turborepo monorepo  
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
│   │       │   ├── recruiting.controller.ts   # Roles/HiringRequests endpoints
│   │       │   ├── profiles.controller.ts     # CandidateProfile endpoints
│   │       │   └── review.controller.ts       # ReviewerFeedback endpoints
│   │       └── common/
│   │           └── database/          # PrismaService (Global)
│   │
│   ├── identity/                      # Auth + Users + Orgs + Departments (TCP :3010)
│   │   └── src/
│   │       ├── main.ts                # TCP microservice bootstrap
│   │       ├── identity.module.ts     # Root module
│   │       └── modules/
│   │           ├── auth/              # Authentication module (JWT)
│   │           ├── users/             # User CRUD
│   │           ├── organizations/     # Organization management
│   │           ├── departments/       # Department hierarchy
│   │           └── approval-chains/   # Multi-level approval config
│   │
│   ├── recruiting/                    # HiringRequests + Roles + Applications (TCP :3011)
│   │   └── src/
│   │       ├── main.ts
│   │       ├── recruiting.module.ts
│   │       └── modules/
│   │           ├── hiring-requests/   # DRAFT→PENDING→APPROVED→RECRUITING
│   │           ├── roles/             # Role/JD management
│   │           ├── applications/      # Candidate applications
│   │           ├── evaluations/       # Evaluation runs
│   │           └── talent-search/     # Hybrid search orchestration
│   │
│   ├── profiles/                      # Candidate Profiles + Documents (TCP :3012)
│   │   └── src/
│   │       ├── main.ts
│   │       ├── profiles.module.ts
│   │       └── modules/
│   │           ├── candidate-profiles/ # Profile CRUD
│   │           ├── cv-documents/       # CV upload + parsing
│   │           └── evidence/           # Evidence record management
│   │
│   ├── review/                        # Reviewer Feedback + Packets (TCP :3013)
│   │   └── src/
│   │       ├── main.ts
│   │       ├── review.module.ts
│   │       └── modules/
│   │           ├── feedback/          # Agree/Challenge/Comment
│   │           └── packets/           # Candidate review packets
│   │
│   └── worker/                        # BullMQ Async Job Processor (NOT NestJS)
│       └── src/
│           ├── index.ts               # 🚀 Plain TS entry — BullMQ Worker
│           └── processors/            # Job-specific handlers
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
│   │       └── schema.prisma          # 420 lines — all domain entities
│   │
│   ├── queue/                         # @wr/queue — BullMQ job definitions
│   │   └── src/index.ts
│   │
│   ├── ai/                            # @wr/ai — Matching engine (NO DB dep)
│   │   └── src/
│   │       ├── search/
│   │       │   ├── rule-based/        # Lane 1: Dice + TF-IDF
│   │       │   ├── vector/            # Lane 2: MiniLM embeddings
│   │       │   └── fusion/rrf.ts      # RRF result fusion
│   │       ├── skill-graph/           # In-memory knowledge graph (~200 nodes)
│   │       └── scoring/               # Readiness labels, gap classification
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
│   │   ├── epics.md                   # 5 Epics, 30+ stories
│   │   ├── ux-design-specification.md
│   │   └── implementation-readiness-report-2026-05-20.md
│   ├── implementation-artifacts/
│   │   ├── sprint-status.yaml         # Sprint tracking
│   │   └── 1-*.md, 2-*.md            # Story files (Epic 1 + Epic 2)
│   ├── brainstorming/                 # 3 brainstorming sessions
│   └── project-context.md            # AI agent context file
│
├── docker-compose.yml                 # PostgreSQL 16 (pgvector) + Redis 7
├── turbo.json                         # Build pipeline config
├── tsconfig.base.json                 # Shared TypeScript config
├── prettier.config.mjs                # Code formatter config
├── package.json                       # Root workspace + scripts
└── .env / .env.example                # Environment variables
```

## Critical Folders

| Folder | Purpose | Entry Point |
|--------|---------|-------------|
| `services/gateway/` | HTTP API — only service with `@Get()`, `@Post()` | `main.ts` |
| `services/identity/` | Auth, users, orgs, departments, approval chains | `main.ts` (TCP) |
| `services/recruiting/` | HiringRequests, roles, applications, evaluations | `main.ts` (TCP) |
| `services/profiles/` | Candidate profiles, CV documents, evidence | `main.ts` (TCP) |
| `services/review/` | Reviewer feedback, candidate packets | `main.ts` (TCP) |
| `services/worker/` | BullMQ job processor (plain TS, NOT NestJS) | `index.ts` |
| `packages/contracts/` | Enums + Zod schemas — single source of truth | `index.ts` |
| `packages/database/` | Prisma schema (420 lines) + client | `schema.prisma` |
| `packages/ai/` | Hybrid search engine — NO database dependency | `index.ts` |

## Integration Points

```
webapp ──HTTP──→ gateway ──TCP──→ identity / recruiting / profiles / review
                   │
                   └── BullMQ ──→ worker ──→ PostgreSQL + Redis
```

- **webapp → gateway:** REST over HTTP, Vite proxy on `:3000 → :3001`
- **gateway → services:** TCP via `@nestjs/microservices`, `ClientProxy.send()`
- **gateway → worker:** BullMQ job queue via Redis
- **all services → database:** Shared PostgreSQL via PrismaService
