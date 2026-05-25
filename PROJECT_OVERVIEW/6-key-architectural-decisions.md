# 6. Key Architectural Decisions

| ADR | Decision | Rationale |
|-----|----------|-----------|
| ADR-001 | Turborepo monorepo | services + webapp + shared packages need clean boundaries |
| ADR-002 | API Gateway + TCP microservices | Domain isolation (identity, recruiting, profiles, review) with single HTTP entry |
| ADR-003 | PostgreSQL + JSONB + pgvector | Relational integrity + flexible evidence + vector search in one DB |
| ADR-004 | Readiness labels over scores | Hiring is risk management — labels are defensible, scores are not |
| ADR-005 | React (Vite) over Next.js | Pure SPA at `webapp/` — no SSR needed. Vite proxy to gateway for dev |
| ADR-006 | Shared DB, separate services | Premature DB-per-service adds complexity. Shared Prisma for MVP |
| ADR-007 | Tailwind CSS + CSS Variables | Tailwind utilities for layout/spacing + CSS variable tokens ("Case Review Ivory") for theming |
| ADR-008 | Radix UI for primitives | Accessible, unstyled, composable — wrapped with project design tokens |
| ADR-009 | Enterprise 4-role model | Department Head → Hiring Manager → HR Recruiter → Candidate (+ Admin) with multi-level approval chain |
| ADR-010 | IBM Plex font system | IBM Plex Sans (UI) + IBM Plex Mono (evidence/provenance) — professional, readable for long review sessions |

---
