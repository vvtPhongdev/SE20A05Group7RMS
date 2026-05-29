# Architecture

## High-Level Diagram

```
┌──────────────┐     HTTP/REST      ┌──────────────┐
│   React SPA  │ ──────────────────→ │  API Gateway │
│  (Vite :3000)│ ←────────────────── │  (NestJS     │
│              │                     │   :3001)     │
└──────────────┘                     └──────┬───────┘
                                            │
                              NestJS TCP Transport
                                            │
            ┌───────────────┬───────────────┼───────────────┬───────────────┐
            │               │               │               │               │
     ┌──────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐       │
     │  Identity   │ │ Recruiting  │ │  Profiles   │ │Notification │       │
     │  Service    │ │  Service    │ │  Service    │ │  Service    │       │
     │  (TCP:3010) │ │  (TCP:3011) │ │  (TCP:3012) │ │  (TCP:3013) │       │
     └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘       │
            │               │               │               │              │
            └───────────────┴───────────────┴───────────────┘              │
                                    │                                      │
                             ┌──────┴──────┐                      ┌────────┴───────┐
                             │ PostgreSQL  │                      │   BullMQ       │
                             │ (pgvector)  │                      │   Worker       │
                             │   :5432     │                      │   (CV parsing  │
                             └─────────────┘                      │    + embedding)│
                                                                  └────────┬───────┘
                                                                           │
                                                                    ┌──────┴──────┐
                                                                    │   Redis     │
                                                                    │   :6379     │
                                                                    └─────────────┘
```

## Service Responsibilities

| Service | Port | Responsibilities |
|---------|------|-----------------|
| **Gateway** | `:3001` | HTTP entry, CORS, Swagger, JWT validation, request routing to TCP services |
| **Identity** | `:3010` (TCP) | User registration/login, JWT + refresh tokens, organizations, departments, role management |
| **Recruiting** | `:3011` (TCP) | Recruitment requests, approval workflow, plans (overall + task), interviews, results |
| **Profiles** | `:3012` (TCP) | Candidate profiles, CV storage, structured data, vector embeddings, semantic search |
| **Notification** | `:3013` (TCP) | Email dispatch (interview invites, offer letters, rejection letters), in-app notifications |
| **Worker** | — (BullMQ) | Async CV parsing (PDF/DOCX → text), embedding generation (text → vector) |

## Communication Rules

1. **Gateway → Services**: All communication via NestJS TCP transport (`@nestjs/microservices`)
2. **Service → Service**: Never direct. Always route through Gateway or use event-based patterns (BullMQ)
3. **Worker → DB**: Worker writes parsed CV data + embeddings directly to PostgreSQL
4. **Notification**: Triggered by events from Recruiting service or Gateway

## Database Strategy (MVP)

**Shared PostgreSQL instance** with Prisma ORM + raw SQL for pgvector operations.

| Schema Area | Tables | Managed By |
|------------|--------|-----------|
| Identity | `users`, `organizations`, `departments`, `refresh_tokens` | Identity Service |
| Recruiting | `recruitment_requests`, `overall_plans`, `task_plans`, `interviews`, `interview_results`, `request_logs` | Recruiting Service |
| Profiles | `candidate_profiles`, `cv_documents`, `cv_embeddings`, `cv_structured_data` | Profiles Service |
| Notification | `notifications`, `email_logs` | Notification Service |

> **ADR-006**: Shared DB for MVP. DB-per-service migration planned for post-MVP when team grows.

## Auth Architecture

```
Login → Gateway validates credentials → Identity Service
  → Returns JWT (access_token, 15min) + refresh_token (Redis, 7d)
  → Gateway attaches user context to TCP messages

Protected routes:
  → Gateway: JwtAuthGuard extracts user from token
  → Gateway: RolesGuard checks user.role against @Roles() decorator
  → Gateway: Forwards {userId, role, orgId, departmentId} in TCP payload
```

## Docker Compose Services

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: recruitment_rms
      POSTGRES_USER: rms_user
      POSTGRES_PASSWORD: rms_password

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

---

*Last updated: 2026-05-28*
