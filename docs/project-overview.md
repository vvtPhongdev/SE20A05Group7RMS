# Project Overview — Works Reruiter

**Updated:** 2026-05-28  
**Scan mode:** Full rescan  
**Repository type:** Turborepo monorepo

---

## Executive Summary

Works Reruiter is an **internal enterprise Recruitment Workflow Management System (RMS)** that digitizes, automates, and optimizes the end-to-end hiring workflow across the organization. The system enforces a mandatory approval pipeline — **Trưởng Phòng Ban → Phòng Tuyển Dụng / Trưởng Phòng Nhân Sự → Admin (Sếp/Giám Đốc)** — ensuring every recruitment activity is plan-locked and fully traceable.

The system supports a 4-actor enterprise hierarchy — Department Head, HR Manager, Admin/Boss, and Candidate — with a 13-state recruitment request lifecycle. AI is used strictly as a utility for CV text extraction and semantic search (pgvector), not for scoring or decision-making (ADR-004).

## Product Domain

- **Domain:** Enterprise recruitment workflow management with plan-locked execution
- **Persona model:** 4 enterprise roles (Department Head → HR Manager → Admin → Candidate)
- **Core workflow:** Recruitment Request (13 states) → Multi-Level Approval → OverallPlan → Campaign Execution → Interview → Decision
- **Core enforcement:** No recruitment activity permitted without an approved `OverallPlan`

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------| 
| **Runtime** | Node.js | 22+ |
| **Language** | TypeScript | ^5.8.3 (strict) |
| **Orchestrator** | Turborepo | latest |
| **Backend** | NestJS | ^11.1.0 |
| **Database** | PostgreSQL 16 | pgvector/pgvector:pg16 |
| **ORM** | Prisma | ^6.8.2 |
| **Vector Search** | pgvector | vector(384), ivfflat |
| **Queue** | BullMQ + Redis 7 | ^5.52.0 |
| **Frontend** | React 19 + Vite 6 | SPA, no SSR |
| **UI Primitives** | Radix UI | latest |
| **Design System** | CSS Variables | Design system tokens |
| **Validation** | Zod (contracts) + class-validator (gateway DTOs) | ^3.25.1 |
| **AI/Embeddings** | @xenova/transformers (all-MiniLM-L6-v2) | Self-hosted, local inference only |

## Repository Structure

```
works-reruiter/                    # Turborepo monorepo root
├── services/                      # NestJS backend microservices
│   ├── gateway/                   # HTTP entry point (:3001) — ONLY service with HTTP decorators
│   ├── identity/                  # Auth + Users + Orgs + Departments (TCP :3010)
│   ├── recruiting/                # RecruitmentRequests + Plans + Interviews + Results (TCP :3011)
│   ├── profiles/                  # Candidate Profiles + CV storage + Vector Search (TCP :3012)
│   ├── review/                    # [LEGACY — will be repurposed as Notification service or removed]
│   └── worker/                    # BullMQ async job processor (NOT NestJS)
├── packages/                      # Shared libraries (@wr/*)
│   ├── contracts/                 # @wr/contracts — Enums, Zod schemas, API types (SSOT)
│   ├── config/                    # @wr/config — Zod-validated env schemas
│   ├── database/                  # @wr/database — Prisma schema, client, migrations
│   ├── queue/                     # @wr/queue — BullMQ job definitions
│   ├── ai/                        # @wr/ai — CV parsing utilities, vector search helpers
│   ├── ui/                        # @wr/ui — Shared UI component library (Radix)
│   └── typescript-config/         # Shared tsconfig bases
├── webapp/                        # React SPA (Vite, :3000)
├── tests/                         # Contract + E2E test suites (stubs)
├── _bmad-output/                  # BMAD planning and implementation artifacts
│   ├── planning-artifacts/        # PRD, epics, architecture, validation reports
│   └── implementation-artifacts/  # Story files, sprint-status.yaml
├── docker-compose.yml             # PostgreSQL 16 (pgvector) + Redis 7
├── turbo.json                     # Build orchestration
└── package.json                   # Root workspace scripts
```

## Architecture Pattern

**Microservices via NestJS TCP transport**, orchestrated through a single HTTP Gateway.

```
webapp → gateway (HTTP :3001) → microservice (TCP via @nestjs/microservices)
```

- All services share **one PostgreSQL database** (ADR-006)
- Async processing via **BullMQ** (Redis 7)
- Gateway proxies via `ClientProxy.send()` + `firstValueFrom()`
- Microservices use `@MessagePattern('domain.action')` — no HTTP decorators

## 4-Actor Model

| Actor | Role Enum | Primary Responsibility |
|-------|-----------|----------------------|
| Trưởng Phòng Ban | `DEPARTMENT_HEAD` | Creates recruitment requests, tracks progress, participates in interviews |
| Phòng Tuyển Dụng / Trưởng Phòng NS | `HR_MANAGER` | Reviews requests, creates campaign plans, manages interviews, screens CVs |
| Admin / Boss (Sếp) | `ADMIN` | Final approval authority, strategic reporting, system configuration |
| Ứng Viên | `CANDIDATE` | Submits CV, receives interview invitations, views results |

## Links to Detailed Documentation

- [Documentation Index](./index.md)
- [Enterprise Hiring Workflow](./enterprise-hiring-workflow.md)
- [Architecture](./architecture.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Component Inventory](./component-inventory.md)
- [Development Guide](./development-guide.md)
- [Data Models](./data-models.md)
- [API Contracts](./api-contracts.md)
- [Auth Design](./auth-design.md)
- [All Tasks](./all-tasks.md)
