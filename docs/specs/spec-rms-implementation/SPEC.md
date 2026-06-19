---
id: SPEC-rms-implementation
companions:
  - task-implementation-matrix.md
  - workflow-api-spec.md
  - ../../all-tasks.md
  - ../../backend-endpoints-summary.md
  - ../../enterprise-hiring-workflow.md
  - ../../data-models.md
sources:
  - ../../../PROJECT_OVERVIEW/index.md
  - ../../index.md
  - ../../requirement_v1.0.md
---

> **Canonical contract.** This SPEC and the files in `companions:` define what to build, test, and validate for the RMS task implementation plan.

# RMS Implementation Spec

## Why

The project needs a single implementation contract that turns the RMS overview, endpoint summary, requirement v1.0 changes, and master task list into executable work. The mandate is to preserve the enterprise recruitment workflow while making each documented task implementable, testable, and traceable.

## Capabilities

- id: CAP-1
  intent: Admin can configure organizations, departments, users, and roles so the enterprise approval chain has trusted actors.
  success: Admin can create and manage organization data through guarded Gateway endpoints, and non-admin users cannot perform admin-only mutations.

- id: CAP-2
  intent: Users can authenticate, refresh sessions, reset passwords, and access only routes allowed by their role.
  success: JWT-protected endpoints reject missing or invalid tokens, role guards enforce `ADMIN`, `HR_LEADER`, `HR_RECRUITER`, `DEPARTMENT_HEAD`, and `CANDIDATE`, and refresh/logout flows update token state.

- id: CAP-3
  intent: Department Heads can create, submit, and track recruitment requests through the full approval workflow.
  success: Request transitions follow the documented state machine, invalid transitions are rejected, and every status change writes a request log and notification.

- id: CAP-4
  intent: HR Leaders can create overall plans and task plans that control campaign execution.
  success: Approved requests can enter planning, plans require Admin approval, task assignments are deadline-bound, and downstream recruiting actions remain locked until plan rules pass.

- id: CAP-5
  intent: Candidates can maintain profiles and upload CVs that HR can search semantically.
  success: CV upload accepts only supported files, async parsing and embedding jobs update processing status, and vector search returns ranked candidates with similarity scores.

- id: CAP-6
  intent: HR users can schedule interviews with named interviewers, capture results, and route final decisions.
  success: Interview schedules require selected panel members, usually at least two interviewers, detect conflicts where supported, and result/decision actions update the request pipeline.

- id: CAP-7
  intent: The system can send interview, offer, rejection, status, task, and deadline notifications to the correct stakeholders.
  success: Triggered events create in-app notifications or email logs for intended recipients, and candidate offer acceptance/decline is persisted.

- id: CAP-8
  intent: Admin, HR, and Department Head users can view role-scoped tracking and reports.
  success: Dashboards expose current owner, stage, task progress, interview progress, hires vs target, annual metrics, department metrics, and pipeline data according to role scope.

- id: CAP-9
  intent: Developers can implement the project task-by-task using shared contracts, service boundaries, and validation rules.
  success: Each task in `docs/all-tasks.md` maps to implementation targets, acceptance checks, and verification commands in `task-implementation-matrix.md`.

## Constraints

- All frontend traffic must go through the Gateway under `/api/v1`; webapp code must not call TCP services directly.
- Only the Gateway may expose HTTP controllers; internal services communicate through NestJS TCP message patterns or BullMQ jobs.
- Shared enums and DTO schemas must live in `packages/contracts`; do not create local enum copies in services or UI.
- The canonical implemented HR roles are `HR_LEADER` and `HR_RECRUITER`; older docs using `HR_MANAGER` must be migrated or treated as legacy terminology.
- Recruitment activity is plan-locked: CV screening, job posting, candidate communication, and interview scheduling require an approved request, approved overall plan, and matching task assignment.
- PostgreSQL is shared for MVP; do not split service databases during this implementation.
- pgvector columns and vector indexes must be handled with raw SQL migrations, not Prisma vector field declarations.
- CV embedding generation must run locally with the configured embedding model; do not introduce external LLM scoring or ranking.
- Frontend must use the existing React/Vite SPA and shared UI primitives/design tokens.

## Non-goals

- Replacing the architecture with Next.js, SSR, GraphQL, or direct service-to-service HTTP is out of scope.
- Building a multi-tenant DB-per-service architecture is out of scope for this MVP.
- Implementing external calendar provider integration beyond the documented availability/conflict abstraction is out of scope unless a later task explicitly adds it.
- Reintroducing legacy marketplace/evaluation entities as primary workflow concepts is out of scope.

## Success signal

The implementation is complete when every task ID in `docs/all-tasks.md` has code, tests or documented verification, and docs matching the implemented behavior. A Department Head can submit a request, HR can plan and execute the campaign, Admin can approve and decide, Candidate can upload CV and respond to an offer, and every workflow stage is visible in tracking/reporting.

## Assumptions

- Source code and `docs/backend-endpoints-summary.md` are more current than older docs that still use `HR_MANAGER`.
- Existing service folders are the intended implementation locations even when older docs mention a replaced `review` service.
- Requirement v1.0 is additive to the existing task list, especially for interviewer panel selection, pass/fail email flow, recruitment tracking, and deadline reminders.

## Open Questions

- Should interview schedules hard-require at least two interviewers for all roles, or allow an explicit exception for some positions?
- What exact reminder cadence is required for task/deadline emails: once before due date, repeated escalation, or configurable per task?
- Which offer fields are mandatory before sending: compensation, start date, benefits, contract type, or all of them?

