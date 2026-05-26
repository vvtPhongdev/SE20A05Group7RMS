# Project Overview — Works Reruiter

**Generated:** 2026-05-20  
**Scan mode:** Full rescan (quick)  
**Repository type:** Turborepo monorepo

---

## Executive Summary

Works Reruiter is an **enterprise reasoning-first Recruitment Management System (RMS)** that replaces opaque AI scoring with explainable, evidence-backed candidate assessments. The system supports a 4-role enterprise hierarchy — Department Head, Hiring Manager (Approver), HR Recruiter, and Candidate — with a mandatory hiring-request-to-approval pipeline before any recruitment activity begins.

The core differentiator is a **Hybrid Search Engine** combining rule-based analysis (Dice's Coefficient + TF-IDF) with semantic vector search (MiniLM-L6-v2 embeddings via pgvector), fused through Reciprocal Rank Fusion (RRF). All matching is **deterministic** — no LLM scoring (ADR-004).

## Product Domain

- **Domain:** Enterprise recruitment with explainability-first candidate assessment
- **Persona model:** 4 enterprise roles (Department Head → Hiring Manager → HR Recruiter → Candidate)
- **Core workflow:** Hiring Request → Multi-Level Approval → Role Creation → Candidate Discovery → Evidence-Based Evaluation
- **Job family scope (MVP):** Backend, Frontend, Fullstack software engineering

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
| **Design System** | CSS Variables | "Case Review Ivory" tokens |
| **Validation** | Zod (contracts) + class-validator (gateway DTOs) | ^3.25.1 |
| **AI/Embeddings** | @xenova/transformers (all-MiniLM-L6-v2) | Self-hosted, local inference only |

## Repository Structure

```
works-reruiter/                    # Turborepo monorepo root
├── services/                      # NestJS backend microservices
│   ├── gateway/                   # HTTP entry point (:3001) — ONLY service with HTTP decorators
│   ├── identity/                  # Auth + Users + Orgs + Depts + Approval Chains (TCP :3010)
│   ├── recruiting/                # HiringRequests + Roles + Applications + Evaluations (TCP :3011)
│   ├── profiles/                  # Candidate Profiles + Documents + Evidence (TCP :3012)
│   ├── review/                    # Reviewer Feedback + Packets (TCP :3013)
│   └── worker/                    # BullMQ async job processor (NOT NestJS)
├── packages/                      # Shared libraries (@wr/*)
│   ├── contracts/                 # @wr/contracts — Enums, Zod schemas, API types (SSOT)
│   ├── config/                    # @wr/config — Zod-validated env schemas
│   ├── database/                  # @wr/database — Prisma schema, client, migrations
│   ├── queue/                     # @wr/queue — BullMQ job definitions
│   ├── ai/                        # @wr/ai — Skill graph, matching engine, scoring
│   ├── ui/                        # @wr/ui — Shared UI component library (Radix)
│   └── typescript-config/         # Shared tsconfig bases
├── webapp/                        # React SPA (Vite, :3000)
├── tests/                         # Contract + E2E test suites (stubs)
├── _bmad-output/                  # BMAD planning and implementation artifacts
│   ├── planning-artifacts/        # PRD, epics, architecture, readiness reports
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

## Links to Detailed Documentation

- [Architecture](./architecture.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Component Inventory](./component-inventory.md)
- [Development Guide](./development-guide.md)
- [Data Models](./data-models.md)
- [API Contracts](./api-contracts.md)
