# Documentation Index

## Recruitment Workflow Management System

### Quick Links

| Document | Description |
|----------|-------------|
| [Project Overview](../PROJECT_OVERVIEW/index.md) | Table of contents for project overview documents |
| [Enterprise Hiring Workflow](./enterprise-hiring-workflow.md) | Detailed state machine, transition rules, planning entities |
| [Architecture](./architecture.md) | System architecture, service diagram, communication rules |
| [Data Models](./data-models.md) | Entity definitions, relationships, enum catalog |
| [API Contracts](./api-contracts.md) | HTTP endpoints, TCP message patterns, RBAC matrix |
| [Auth Design](./auth-design.md) | JWT strategy, refresh tokens, role-based guards |
| [All Tasks](./all-tasks.md) | Master task list with dependencies |

### Project Overview Documents

| # | Document | Content |
|---|----------|---------|
| 1 | [Product Context](../PROJECT_OVERVIEW/1-product-context.md) | System overview, 4-actor model, core problem |
| 2 | [Features](../PROJECT_OVERVIEW/2-features.md) | Feature tables per actor role |
| 3 | [Tech Stack](../PROJECT_OVERVIEW/3-tech-stack.md) | Architecture, frontend/backend stack, design system |
| 4 | [AI & Vector Search](../PROJECT_OVERVIEW/4-ai-vector-search-pipeline.md) | CV parsing, embedding, semantic search |
| 5 | [Implementation Plan](../PROJECT_OVERVIEW/5-implementation-plan-mvp-milestones.md) | MVP milestones 0–6 |
| 6 | [Key Decisions](../PROJECT_OVERVIEW/6-key-architectural-decisions.md) | ADR-001 through ADR-012 |
| 7 | [Principles](../PROJECT_OVERVIEW/7-project-principles.md) | 7 core project principles |
| 8 | [Workflow Reference](../PROJECT_OVERVIEW/8-recruitment-workflow-reference.md) | Workflow diagram, data flow, vector search setup |

### Architecture Overview

```
webapp (:3000) → gateway (:3001) → TCP → identity (:3010)
                                       → recruiting (:3011)
                                       → profiles (:3012)
                                       → notification (:3013)
                                 → BullMQ → worker
```

### Key Actors

| Actor | Role | System Role |
|-------|------|------------|
| Trưởng Phòng Ban | Đề xuất nhân sự, giám sát tiến độ | `DEPARTMENT_HEAD` |
| Phòng Tuyển Dụng / Trưởng Phòng NS | Triển khai tuyển dụng, điều phối quy trình | `HR_MANAGER` |
| Admin / Boss (Sếp) | Phê duyệt, quyết định chiến lược | `ADMIN` |
| Ứng Viên | Nộp hồ sơ, tham gia phỏng vấn | `CANDIDATE` |

### Workflow State Machine

```
DRAFT → PENDING_HR_REVIEW → PENDING_BOSS_APPROVAL → APPROVED → PLANNING
→ PLAN_PENDING_APPROVAL → ACTIVE → INTERVIEWING → DECISION_PENDING
→ HIRED/NOT_HIRED → COMPLETED
```

---

*Last updated: 2026-05-28*
