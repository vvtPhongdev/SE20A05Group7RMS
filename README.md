# Recruitment Workflow Management System

Recruitment Workflow Management System (RMS) is a workflow-focused hiring platform for enterprise recruitment. It digitizes the process from department hiring request to HR planning, boss/admin approval, candidate screening, interviews, offers, rejection emails, and reporting.

The system is built as a monorepo with a React web application, a NestJS API Gateway, NestJS TCP microservices, PostgreSQL with pgvector, Redis, BullMQ workers, and shared TypeScript packages.

## Source Documents

This README is based on:

- `PROJECT_OVERVIEW/index.md`
- `docs/index.md`
- `docs/backend-endpoints-summary.md`
- `docs/requirement_v1.0.md`

Use those files as the detailed reference when updating scope, endpoint contracts, workflow states, or implementation tasks.

## Product Scope

### Actors

| Actor | System role | Main responsibility |
| --- | --- | --- |
| Department Head | `DEPARTMENT_HEAD` | Create recruitment requests, track progress, join interview panels. |
| HR Leader / HR Recruiter | `HR_LEADER`, `HR_RECRUITER` | Review requests, plan campaigns, assign tasks, screen candidates, schedule interviews. |
| Admin / Boss | `ADMIN` | Approve requests and plans, make final hiring decisions, view reports. |
| Candidate | `CANDIDATE` | Register, upload CV, attend interviews, respond to offers. |

### Core Workflow

```text
DRAFT
-> PENDING_HR_REVIEW
-> PENDING_BOSS_APPROVAL
-> APPROVED
-> PLANNING
-> PLAN_PENDING_APPROVAL
-> ACTIVE
-> INTERVIEWING
-> DECISION_PENDING
-> HIRED / NOT_HIRED
-> COMPLETED
```

## Architecture

```text
webapp (:3000)
  -> gateway (:3001, /api/v1)
    -> identity (:3010 TCP)
    -> recruiting (:3011 TCP)
    -> profiles (:3012 TCP)
    -> cv
    -> interview
    -> notification (:3013 TCP)
    -> worker via BullMQ
```

### Main Directories

| Path | Purpose |
| --- | --- |
| `webapp/` | React 19 + Vite frontend. |
| `services/gateway/` | HTTP API Gateway, auth guards, routing to microservices. |
| `services/identity/` | Auth, users, organizations, departments, roles. |
| `services/recruiting/` | Recruitment requests, plans, tasks, workflow state, reports. |
| `services/profiles/` | Candidate profiles, documents, CV metadata, vector search data. |
| `services/cv/` | CV search and screening APIs. |
| `services/interview/` | Interview scheduling, confirmations, feedback, results. |
| `services/notification/` | Email, SSE, in-app notifications, notification logs. |
| `services/worker/` | Async CV parsing, embedding generation, background jobs. |
| `packages/contracts/` | Shared DTOs, enums, schemas, API contracts. |
| `packages/database/` | Prisma schema, migrations, seed logic. |
| `packages/ui/` | Shared UI primitives and design tokens. |

## Requirement v1.0 Changes

`docs/requirement_v1.0.md` adds these required updates:

| Change | Required behavior | Main implementation areas |
| --- | --- | --- |
| Interviewer names at scheduling time | When HR schedules an interview, the interview panel must be selected immediately. Usually at least 2 interviewers are required. | `services/interview`, `services/recruiting`, `services/gateway`, `webapp`, `packages/contracts`, `packages/database` |
| Pass/fail interview email flow | When a candidate passes or fails, the system sends email. Pass flow includes an offer. Candidate approval/acceptance must be stored. | `services/interview`, `services/notification`, `services/recruiting`, `services/gateway`, `webapp`, `packages/database` |
| Recruitment tracking | Add/complete tracking of the recruitment process so users can see current status, owner, progress, tasks, interviews, and decisions. | `services/recruiting`, `services/gateway`, `webapp`, reports endpoints |
| Deadline and task email reminders | Send deadline/task reminder emails to responsible users, for example campaign posting deadlines or assigned recruitment tasks. | `services/notification`, `services/worker`, `services/recruiting`, BullMQ queues |

## Backend API Summary

All client calls go through the API Gateway:

```text
/api/v1/<endpoint>
```

Do not call internal TCP services directly from the frontend.

### Key Endpoint Groups

| Group | Examples | Purpose |
| --- | --- | --- |
| Health | `GET /api/v1/health` | Gateway and service health check. |
| Auth | `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `POST /api/v1/auth/refresh` | Registration, login, OTP, refresh token, logout, password reset. |
| Current user | `GET /api/v1/me`, `GET /api/v1/me/profile` | Current JWT user and profile. |
| Users/orgs/departments | `GET /api/v1/users`, `POST /api/v1/departments` | Admin and HR user management. |
| Recruitment requests | `POST /api/v1/recruitment-requests`, `PATCH /api/v1/recruitment-requests/:id/submit`, `PATCH /api/v1/recruitment-requests/:id/decision` | Request creation, review, approval, rejection. |
| Plans and tasks | `POST /api/v1/overall-plan`, `PATCH /api/v1/overall-plan/:id/submit`, `POST /api/v1/task-plan` | Overall campaign plan and assigned task plan. |
| Job postings | `POST /api/v1/job-postings`, `GET /api/v1/public/job-postings`, `POST /api/v1/job-postings/:id/publish` | Internal and public job posting management. |
| Candidates/CVs | `GET /api/v1/candidate-profiles`, `POST /api/v1/candidate/cvs`, `POST /api/v1/cv/search` | Candidate profile, CV upload, search, screening. |
| Interviews | `POST /api/v1/interviews/schedules`, `POST /api/v1/interviews/:id/my-feedback`, `POST /api/v1/interviews/:id/results` | Scheduling, candidate confirmation, feedback, result recording. |
| Offers/decisions | `POST /api/v1/hiring-decisions/:requestId`, `POST /api/v1/offers`, `POST /api/v1/offers/:id/respond` | Final decision, offer letter, candidate response. |
| Reports/tracking | `GET /api/v1/reports/realtime-tracking`, `GET /api/v1/reports/pipeline` | Role-based dashboard and process tracking. |
| Notifications | `GET /api/v1/notifications/sse`, `GET /api/v1/notifications` | Realtime and stored notifications. |

For full endpoint details, update and review `docs/backend-endpoints-summary.md`.

## How To Implement Requirement Changes

### 1. Update Shared Specification First

Update shared contracts before service code:

- Add or adjust enums in `packages/contracts/` and `packages/database/`.
- Define request/response DTOs for interview panel selection, tracking response models, task reminder payloads, and offer response persistence.
- Add validation rules, especially for interview panel size and deadline fields.

Expected specification updates:

- Interview schedule payload includes `interviewerIds` or panel members.
- Interview creation rejects schedules with fewer than 2 interviewers unless a documented exception is allowed.
- Interview result payload supports pass/fail, notes, scores, recommendation, and next action.
- Offer response payload stores candidate decision, response time, and optional note.
- Tracking response exposes workflow status, current owner, task progress, interview status, decision status, and notification/reminder state.

### 2. Update Database Schema

Use `packages/database/` for persistent model changes.

Likely schema changes:

- Interview panel table or relation between interview schedule and users.
- Offer response fields or offer response table.
- Task deadline and reminder metadata.
- Request tracking/audit log fields if current logs are incomplete.

After schema changes:

```bash
npm run db:generate
npm run db:migrate:dev
```

### 3. Implement Backend Service Logic

Recommended order:

1. `services/interview/`
   - Validate selected interviewers during schedule creation.
   - Save panel members with the interview schedule.
   - Support candidate confirm, reschedule, cancel, and result flows.

2. `services/recruiting/`
   - Keep recruitment request status synchronized with planning, interview, result, offer, and final decision events.
   - Provide tracking data for dashboards and reports.
   - Enforce plan and task constraints before campaign actions.

3. `services/notification/`
   - Send interview invitation emails to candidate and panel members.
   - Send pass/fail emails.
   - Send offer emails and store delivery logs.
   - Send deadline/task reminder emails.

4. `services/worker/`
   - Add scheduled or queued reminder jobs.
   - Process task deadline reminders and notification retries.

5. `services/gateway/`
   - Add or adjust REST endpoints.
   - Keep all frontend-facing routes under `/api/v1`.
   - Apply JWT and role guards consistently.

### 4. Implement Frontend Screens

Update `webapp/` after the backend contract is clear.

Required UI behavior:

- Interview scheduling form must select at least 2 interviewers.
- Tracking dashboard must show status, owner, progress, tasks, interviews, and decision state.
- Candidate offer screen must allow accept/decline and persist the response.
- HR task screens must show deadline/reminder status.
- Notifications must surface interview invites, offers, rejection notices, and deadline reminders.

Use existing UI primitives from `packages/ui/` and the role-based flows described in `PROJECT_OVERVIEW/2-features.md`.

### 5. Update Documentation

Whenever behavior changes, update:

- `docs/backend-endpoints-summary.md` for real gateway endpoints.
- `docs/api-contracts.md` for DTOs and message patterns.
- `docs/data-models.md` for entities, relations, and enums.
- `docs/enterprise-hiring-workflow.md` for workflow transitions.
- `PROJECT_OVERVIEW/5-implementation-plan-mvp-milestones.md` if milestone scope changes.
- This `README.md` if setup, scope, or implementation guidance changes.

## How To Update This Project

Use this checklist for new features or requirement changes:

1. Read the current spec documents in `PROJECT_OVERVIEW/` and `docs/`.
2. Identify affected actor roles and workflow states.
3. Update shared contracts and database models.
4. Implement service logic behind the Gateway.
5. Expose or update `/api/v1` endpoints in `services/gateway/`.
6. Update the React UI and role-based navigation.
7. Add or update tests for the changed workflow.
8. Update docs and endpoint summaries.
9. Run format, lint, typecheck, and build before merging.

## Local Development

### Prerequisites

- Node.js `>=22`
- npm `10`
- Docker with Compose
- PostgreSQL and Redis via `docker-compose.yml`

### Install

```bash
npm install
```

### Start Infrastructure

```bash
npm run docker:up
```

### Prepare Database

```bash
npm run db:generate
npm run db:migrate:dev
npm run db:seed
```

### Run All Apps

```bash
npm run dev
```

### Run Individual Services

```bash
npm run dev:webapp
npm run dev:gateway
npm run dev:identity
npm run dev:recruiting
npm run dev:profiles
npm run dev:cv
npm run dev:interview
npm run dev:notification
npm run dev:worker
```

### Validate

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
```

## Specification Checklist

Before a feature is considered complete, verify:

- Role-based access is correct for `ADMIN`, `HR_LEADER`, `HR_RECRUITER`, `DEPARTMENT_HEAD`, and `CANDIDATE`.
- Gateway endpoint exists and uses `/api/v1`.
- Internal service message pattern is typed and documented.
- DTO validation rejects invalid states and missing required fields.
- Workflow transition is valid and logged.
- Notifications are sent to all required stakeholders.
- Candidate-facing actions are persisted.
- Tracking dashboard reflects the latest state.
- Database migrations and seed data are updated when needed.
- Documentation matches implemented behavior.

