# Architecture — Works Reruiter

**Generated:** 2026-05-20  
**Architecture style:** Microservices (NestJS TCP transport)  
**Frontend:** React 19 SPA (Vite 6)

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                   BROWSER (React SPA)                     │
│                      localhost:3000                        │
│  React 19 + Vite 6 + React Router v7 + Radix UI          │
└──────────────────────┬───────────────────────────────────┘
                       │ REST / JSON (Vite proxy → :3001)
┌──────────────────────▼───────────────────────────────────┐
│               GATEWAY SERVICE (HTTP :3001)                │
│  NestJS — Swagger, Auth Guards, DTO Validation            │
│  ONLY service with @Get/@Post/@Patch decorators           │
└───┬───────────┬───────────┬───────────┬──────────────────┘
    │ TCP       │ TCP       │ TCP       │ TCP
    ▼           ▼           ▼           ▼
┌────────┐ ┌─────────┐ ┌────────┐ ┌────────┐
│Identity│ │Recruiting│ │Profiles│ │ Review │
│ :3010  │ │  :3011   │ │ :3012  │ │ :3013  │
│        │ │          │ │        │ │        │
│Auth    │ │HiringReq │ │CandProf│ │Feedback│
│Users   │ │Roles     │ │CVDocs  │ │Packets │
│Orgs    │ │Apps      │ │Evidence│ │        │
│Depts   │ │Evals     │ │        │ │        │
│Approvals│ │TSearch  │ │        │ │        │
└───┬────┘ └───┬─────┘ └───┬────┘ └───┬────┘
    │          │            │          │
    ▼          ▼            ▼          ▼
┌────────────────────────────────────────────┐
│          SHARED POSTGRESQL DATABASE         │
│     pgvector/pgvector:pg16 (:5432)          │
│     Prisma ORM — single schema.prisma       │
│     pgvector for vector(384) columns        │
└────────────────────────────────────────────┘

                    ┌──────────┐
Gateway ──BullMQ──→ │  WORKER  │
                    │ (BullMQ) │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │  REDIS 7 │
                    │  (:6379) │
                    └──────────┘
```

## Architectural Decision Records (ADR)

| ADR | Title | Decision |
|-----|-------|----------|
| ADR-001 | Monorepo strategy | Turborepo workspaces with `@wr/*` packages |
| ADR-002 | Transport protocol | TCP via `@nestjs/microservices` (not HTTP between services) |
| ADR-003 | Embedding model | all-MiniLM-L6-v2 via `@xenova/transformers` (local, no API) |
| ADR-004 | No LLM scoring | LLM is for extraction/explanation only, never ranking/scoring |
| ADR-005 | Frontend: SPA only | React/Vite SPA, no SSR, no Next.js |
| ADR-006 | Shared database | One PostgreSQL instance, one Prisma schema, all services share |
| ADR-007 | Enterprise role model | 4 roles: Department Head, Hiring Manager, HR Recruiter, Candidate |
| ADR-008 | Hybrid search | RRF fusion of rule-based (Dice+TF-IDF) and vector (MiniLM) search |

## Key Architecture Rules

### Gateway Rules
1. **ONLY** service with HTTP decorators (`@Get`, `@Post`, `@Patch`, `@Delete`)
2. Receives HTTP request → validates DTO → proxies to microservice via TCP
3. Uses `ClientProxy.send()` + `firstValueFrom()`
4. Owns Swagger/OpenAPI documentation
5. Owns authentication guards (JWT)

### Microservice Rules
1. Use `@MessagePattern('domain.action')` — NEVER `@Get()` etc.
2. Trust inbound payloads (already validated by gateway)
3. Import `PrismaService` from shared module
4. Return plain objects/arrays (auto-serialized by NestJS TCP)

### Worker Rules
1. **NOT** a NestJS application — plain TypeScript
2. BullMQ worker connecting to Redis
3. Processes async jobs: CV parse, embedding generation, evaluation runs
4. Accesses database directly via Prisma

### Frontend Rules
1. React SPA — no SSR
2. Vite dev server with proxy: `localhost:3000/api → localhost:3001`
3. Uses `@wr/contracts` Zod schemas for request/response validation
4. UI built with Radix primitives + Tailwind CSS + CSS Variables ("Case Review Ivory" theming)
5. "Case Review Ivory" design system

### Data Flow Rules
1. All domain types defined in `@wr/contracts`
2. `@wr/ai` has **zero database dependencies** — pure algorithms only
3. pgvector columns managed via raw SQL (not in Prisma schema)
4. Hiring Request is mandatory entry point for all recruitment

## Security Model

- **Authentication:** JWT tokens issued by Identity service
- **Authorization:** Role-based (DEPARTMENT_HEAD, HIRING_MANAGER, HR_RECRUITER, CANDIDATE)
- **Approval chain:** Multi-level, configurable per organization
- **Data isolation:** Organization-scoped queries in all services
- **Candidate data:** Candidate can only see own profile + applications

## Scalability Considerations

- Each microservice can scale independently (TCP transport)
- Worker scales horizontally (multiple BullMQ workers per queue)
- pgvector `ivfflat` index for ANN queries at scale
- Redis as BullMQ broker + potential session cache
- Turborepo enables selective builds (only changed packages rebuild)
