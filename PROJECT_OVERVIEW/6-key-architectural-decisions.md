# 6. Key Architectural Decisions

| ADR | Decision | Rationale |
|-----|----------|-----------|
| ADR-001 | Turborepo monorepo | services + webapp + shared packages need clean boundaries |
| ADR-002 | API Gateway + TCP microservices | Domain isolation (identity, recruiting, profiles, notification) with single HTTP entry |
| ADR-003 | PostgreSQL + JSONB + pgvector | Relational integrity + flexible metadata + vector search for CV in one DB |
| ADR-004 | Workflow-first design | Strict request → approval → plan → execute → result pipeline, locked by plan status |
| ADR-005 | React (Vite) over Next.js | Pure SPA at `webapp/` — no SSR needed. Vite proxy to gateway for dev |
| ADR-006 | Shared DB, separate services | Premature DB-per-service adds complexity. Shared Prisma for MVP |
| ADR-007 | Tailwind CSS + CSS Variables | Tailwind utilities for layout/spacing + CSS variable tokens for theming |
| ADR-008 | Radix UI for primitives | Accessible, unstyled, composable — wrapped with project design tokens |
| ADR-009 | 4-actor role model | Trưởng Phòng Ban → Phòng Tuyển Dụng → Admin/Boss → Ứng Viên with approval chain |
| ADR-010 | IBM Plex font system | IBM Plex Sans (UI) + IBM Plex Mono (data) — professional, readable for long sessions |
| ADR-011 | Real-time notifications | Every approval/rejection/status change triggers instant notifications to stakeholders |
| ADR-012 | Plan-locked execution | Recruitment activities cannot proceed until the corresponding plan is approved by Admin/Boss |

---
