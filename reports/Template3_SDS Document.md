# Recruitment Workflow Management System

# Software Design Specification

Document ID: `REP-03`  
Version: `1.0-RC1`  
Date: 2026-07-15  
Group: SE20A05 Group 7

Related documents: [Report index](./README.md) · [RDS](./Template2_RDS%20Document.md) · [Traceability](./TRACEABILITY.md) · [Issues](./Template4_Issues%20Report.md)

## Record of changes

| Version | Date       | Type     | Description                                                      |
| ------- | ---------- | -------- | ---------------------------------------------------------------- |
| 0.1     | 2026-05-28 | Added    | Initial workflow-first architecture                              |
| 0.9     | 2026-07-06 | Modified | Unified HR role and current service flows                        |
| 1.0-RC1 | 2026-07-15 | Modified | Code-backed package, class, data, sequence and deployment design |

## 1. Design goals and constraints

### 1.1 Goals

- Keep the React SPA behind one versioned HTTP Gateway.
- Keep business capabilities in independently organized NestJS TCP services.
- Enforce workflow state, ownership, plan-lock and audit effects at service boundaries.
- Persist business changes atomically where multiple records represent one decision.
- Move CV parsing, embedding, email and reminders to asynchronous workers/queues where appropriate.
- Treat AI as a CV-processing/search utility, never as hiring authority.

### 1.2 Constraints

- Shared PostgreSQL database for MVP services.
- Current implemented roles: `ADMIN`, `DEPARTMENT_HEAD`, `HR_LEADER`, `CANDIDATE`.
- Prisma does not model the pgvector column directly; vector DDL/query is raw SQL.
- Worker is a plain TypeScript process, not a NestJS application.
- Frontend is React/Vite SPA; no SSR/Next.js assumptions.

## 2. Architecture and packages

Editable package diagram: [package-architecture.puml](./diagrams/package-architecture.puml)

### 2.1 Runtime packages

| Package / service       | Responsibility                                                          | Public boundary     |
| ----------------------- | ----------------------------------------------------------------------- | ------------------- |
| `webapp`                | React role screens, routing, form state and API client                  | Browser routes only |
| `services/gateway`      | `/api/v1`, Swagger, JWT/RBAC, HTTP DTOs, TCP proxy, SSE                 | HTTP/SSE            |
| `services/identity`     | Auth, users, organizations, departments, Google Calendar                | TCP                 |
| `services/recruiting`   | Requests, plans, tasks, postings, applications, search, offers, reports | TCP                 |
| `services/profiles`     | Candidate profile, avatar and document/evidence metadata                | TCP                 |
| `services/cv`           | Candidate CV lifecycle and processing state                             | TCP                 |
| `services/interview`    | Schedule, conflict, panel, invitations and results                      | TCP                 |
| `services/notification` | Notification records, email templates and delivery commands             | TCP                 |
| `services/worker`       | BullMQ consumers for CV, embeddings, email and reminders                | Redis queue         |

### 2.2 Shared packages

| Package         | Design rule                                                                               |
| --------------- | ----------------------------------------------------------------------------------------- |
| `@wr/contracts` | Shared enums, schemas and API types; intended single source of truth                      |
| `@wr/database`  | Prisma schema/client/migrations for the shared PostgreSQL database                        |
| `@wr/config`    | Environment validation; services fail fast on invalid required configuration              |
| `@wr/queue`     | Queue names, job names and payload contracts                                              |
| `@wr/ai`        | CV parse/extract/embedding/search helpers; no database ownership or hiring decision logic |
| `@wr/storage`   | Supabase storage paths, upload/download/remove and signed/public URL handling             |
| `@wr/ui`        | Shared UI primitives/design tokens where adopted by the SPA                               |

### 2.3 Communication rules

1. SPA calls only Gateway `/api/v1` routes.
2. Gateway uses NestJS `ClientProxy.send()` and resolves Observables before returning HTTP responses.
3. Microservice controllers use `@MessagePattern()` and do not expose HTTP decorators.
4. Async jobs are identified by stable queue/job names and persistent record IDs.
5. Domain services write status/log/side-effect intent before dispatching non-transactional external delivery.

## 3. Database design

Editable class/entity diagram: [domain-class-diagram.puml](./diagrams/domain-class-diagram.puml)

### 3.1 Model catalog

| Model                  | Table                    | Purpose                                                 | Key relations                                                             |
| ---------------------- | ------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| `User`                 | `users`                  | Internal/candidate identity and role                    | Organization, Department, requests, plans, tasks, feedback, notifications |
| `Organization`         | `organizations`          | Enterprise tenant/configuration                         | Users, Departments                                                        |
| `Department`           | `departments`            | Hierarchical org unit, skills and head                  | Organization, parent/children, Users, Requests                            |
| `RecruitmentRequest`   | `recruitment_requests`   | Workflow aggregate and hiring target                    | Department, owners, plan, posting, applications, interviews, offers, logs |
| `JobPosting`           | `job_postings`           | Publishable request-facing vacancy                      | One request                                                               |
| `ApprovalRecord`       | `approval_records`       | Attributable request decision                           | Request, approver                                                         |
| `RequestLog`           | `request_logs`           | Authoritative request timeline                          | Request, performed user                                                   |
| `AuditLog`             | `audit_logs`             | Generic cross-entity status/action audit                | No FK by design                                                           |
| `OverallPlan`          | `overall_plans`          | Campaign timeline and approval                          | One request, creator/approver, tasks                                      |
| `TaskPlan`             | `task_plans`             | Assigned campaign activity                              | Plan, assigned user, reminders                                            |
| `TaskReminder`         | `task_reminders`         | Idempotent reminder window state                        | TaskPlan; unique task/key                                                 |
| `CandidateProfile`     | `candidate_profiles`     | Candidate identity/profile data                         | User, CVs, applications, interviews, offers                               |
| `CandidateCV`          | `candidate_cvs`          | File metadata, raw/structured data and processing state | CandidateProfile, embeddings                                              |
| `CvEmbedding`          | `cv_embeddings`          | CV chunk text and vector row identity                   | CandidateCV; vector column via SQL                                        |
| `InterviewSchedule`    | `interview_schedules`    | Candidate/request schedule and panel IDs                | Request, CandidateProfile, results                                        |
| `InterviewResult`      | `interview_results`      | Evaluator decision/scores/notes                         | Schedule, evaluator User                                                  |
| `OfferLetter`          | `offer_letters`          | Offer content, delivery and response                    | Request, CandidateProfile, generator                                      |
| `Notification`         | `notifications`          | In-app message/read state                               | User                                                                      |
| `EmailLog`             | `email_logs`             | Email intent/delivery/error state                       | Optional User                                                             |
| `Application`          | `applications`           | Candidate/request pipeline membership                   | Request, CandidateProfile, collector                                      |
| `TalentSearchRun`      | `talent_search_runs`     | Search query/filter/model audit                         | Actor, optional request, feedback                                         |
| `TalentSearchFeedback` | `talent_search_feedback` | Human action on ranked result                           | SearchRun, CandidateProfile, actor, request                               |

### 3.2 Data access rules

- IDs are UUID strings.
- Mapped database names use snake_case; indexes and unique constraints have explicit names.
- JSON fields store flexible skills, profile extraction, attendance and metadata shapes.
- Critical multi-row transitions use `prisma.$transaction`.
- `RequestLog` must remain consistent with the request status updated by the same business action.
- Generic `AuditLog` accepts system/worker actors and therefore intentionally omits strict actor/entity FKs.
- Vector schema and similarity operations are raw SQL migrations/queries because Prisma does not natively own the pgvector column.

### 3.3 Representative queries

Prisma-style request transition:

```typescript
await prisma.$transaction([
  prisma.recruitmentRequest.update({
    where: { id: requestId },
    data: { status: nextStatus },
  }),
  prisma.requestLog.create({
    data: { requestId, action, fromStatus, toStatus: nextStatus, performedById },
  }),
]);
```

Conceptual pgvector retrieval (exact filters may vary by implementation):

```sql
SELECT cv_document_id,
       chunk_text,
       1 - (embedding <=> $1::vector) AS similarity
FROM cv_embeddings
ORDER BY embedding <=> $1::vector
LIMIT $2;
```

Tracking aggregation is implemented through Prisma queries over request relations and `RequestLog`; pagination/role filtering must occur before returning dashboard rows.

## 4. Code designs

### 4.1 Identity, auth and organization

| Class                        | Key methods                                                                      | Design responsibility                            |
| ---------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------ |
| Gateway `IdentityController` | `register`, `verifyRegister`, `login`, `refresh`, `logout`, user/org/dept routes | HTTP validation, role guards and TCP proxy       |
| `AuthService`                | registration/login variants, token issue/refresh/logout, password reset          | Credential/session rules, Redis refresh state    |
| `UsersService`               | `list`, `get`, `create`, `update`, status/role operations                        | User scope and active/role validation            |
| `OrganizationsService`       | `create`, `list`, `get`, `update`                                                | Organization uniqueness/settings                 |
| `DepartmentsService`         | `create`, `list`, `get`, `update`, `delete`                                      | Org hierarchy, department head and scoped access |
| `GoogleCalendarService`      | OAuth URL/callback, token validation, meeting creation                           | Optional calendar/Meet integration               |

Database access: `User`, `Organization`, `Department`; Redis refresh-token state. Passwords/tokens are never returned as general user data.

### 4.2 Recruitment request approval

Editable sequence: [sequence-request-approval.puml](./diagrams/sequence-request-approval.puml)

| Class                          | Method                    | Input/output and processing                                                                         |
| ------------------------------ | ------------------------- | --------------------------------------------------------------------------------------------------- |
| Gateway `RecruitingController` | request routes            | Applies `DEPARTMENT_HEAD`, `HR_LEADER`, `ADMIN` guards and forwards current actor                   |
| `RecruitmentRequestsService`   | `createForDepartmentHead` | Validates owner/department and creates `DRAFT` plus initial log                                     |
| `RecruitmentRequestsService`   | `updateForDepartmentHead` | Restricts editable state/owner and records revision response when supplied                          |
| `RecruitmentRequestsService`   | `submitDraft`             | Requires owner and `DRAFT`/`REVISION_NEEDED`; transactionally moves to `PENDING_HR_REVIEW` and logs |
| `RecruitmentRequestsService`   | `assignToHr`              | Validates HR assignee and updates ownership/log                                                     |
| `RecruitmentRequestsService`   | `returnForRevision`       | HR moves request to revision with reason and notification                                           |
| `RecruitmentRequestsService`   | `forwardToAdmin`          | Requires HR-reviewed state and moves to boss approval                                               |
| `RecruitmentRequestsService`   | `requestChanges`          | Admin requests attributable changes from HR/Department Head flow                                    |
| `RecruitmentRequestsService`   | `decide`                  | Approves/rejects with required state/reason, approval record, log and notifications                 |

Database access: `RecruitmentRequest` CRUD, `ApprovalRecord` create, `RequestLog` create/read, `Notification` side effects.

### 4.3 Overall plan, tasks and job posting

| Class                | Key methods                                                                  | Design responsibility                                                              |
| -------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `OverallPlanService` | `create`, `submit`, `approve`, `reject`, `resubmit`, `startCampaign`         | Timeline/state rules, required tasks, request transition and assignee notification |
| `TaskPlanService`    | `create`, `update`, `assignRecruiter`, `updateStatus`, `upsertTaskReminders` | Date/assignee/status rules and reminder records                                    |
| `JobPostingsService` | `create`, `list`, `get`, `update`, `publish`, `close`                        | Request/task permission, publication window and media metadata                     |

`startCampaign` requires an approved plan and every task assigned to an active HR member with start/end dates. It transactionally sets the request to `ACTIVE`, writes `CAMPAIGN_STARTED`, then emails assignees.

Database access: `OverallPlan`, `TaskPlan`, `TaskReminder`, `RecruitmentRequest`, `RequestLog`, `JobPosting`, `User`.

### 4.4 Candidate, CV and search pipeline

| Class/component            | Key methods/jobs                                                     | Design responsibility                                        |
| -------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| Gateway `CvController`     | `listMine`, `uploadMine`, `replaceMine`, `deleteMine`, latest file   | File validation, storage upload/rollback and TCP calls       |
| CV `CvService`             | upload/replace/get/list/delete and processing updates                | Candidate ownership and CV lifecycle                         |
| `CandidateProfilesService` | `getProfile`, `updateProfile`, enrichment sync                       | Profile projection and latest-CV structured data             |
| `CvSearchService`          | `search`                                                             | Query embedding, vector search and role/campaign constraints |
| `TalentSearchService`      | `search`, `expandQuery`, `recordFeedback`, `updateScreeningDecision` | Search audit and human feedback/actions                      |
| Worker                     | parse and embedding processors                                       | Extract text/structured data, chunk and generate embeddings  |
| `@wr/ai`                   | parse/extract/embed helpers                                          | Pure processing utilities; no hiring decision                |

Upload/replace workflow:

1. Gateway validates file and begins text extraction and storage upload.
2. If service persistence fails, the newly uploaded object is removed.
3. CV service persists current file/processing state and queues deeper processing.
4. Worker stores parse result and vector chunks; failure state is visible for retry/manual review.
5. Search results are recorded with model version and human feedback where applicable.

Database access: `CandidateProfile`, `CandidateCV`, `CvEmbedding`, `Application`, `TalentSearchRun`, `TalentSearchFeedback`; Supabase storage object paths.

### 4.5 Interview schedule and invitation

Editable sequence: [sequence-plan-and-interview.puml](./diagrams/sequence-plan-and-interview.puml)

| Class                         | Method                                             | Input/output and processing                                                                        |
| ----------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Gateway `InterviewController` | schedule/list/get/reschedule/cancel/confirm routes | HTTP DTO/role boundary and TCP proxy                                                               |
| `SchedulesService`            | `assertPlanLocked`                                 | Requires schedulable request, approved OverallPlan and `INTERVIEW_COORDINATION` task               |
| `SchedulesService`            | `assertValidInterviewers`                          | Deduplicates and validates minimum active internal panel                                           |
| `SchedulesService`            | `detectConflicts`                                  | Checks candidate and panel time overlap                                                            |
| `SchedulesService`            | `create`                                           | Validates ISO date/duration, application, creates schedule and changes states/logs transactionally |
| `SchedulesService`            | confirm/reschedule/cancel operations               | Ownership/state/conflict/reason checks and notifications                                           |
| `InvitationsService`          | `sendInvitations`, `getEmailLogs`                  | Candidate/panel email composition and delivery log lookup                                          |

The `create` transaction inserts `InterviewSchedule`, changes `Application` and `RecruitmentRequest` to interviewing, and writes `RequestLog`. Generic audit and external notifications occur after persistence and report failures separately.

Database access: `OverallPlan`, `TaskPlan`, `Application`, `InterviewSchedule`, `RecruitmentRequest`, `RequestLog`, `AuditLog`, `User`, `Notification`, `EmailLog`.

### 4.6 Interview results, hiring decision and offers

Editable sequence: [sequence-hiring-offer.puml](./diagrams/sequence-hiring-offer.puml)

| Class                      | Key methods                                                                              | Design responsibility                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `InterviewResultService`   | `listCompleted`, `getDetails`, `recordMyFeedback`, `saveEvaluationDraft`, `recordResult` | Evaluator access, per-person scores, final recommendation and completion             |
| Gateway result controllers | list/detail/feedback/recommendation                                                      | Separate Admin, HR and Department Head route scopes                                  |
| `HiringDecisionService`    | `decide`, `requestInfo`                                                                  | Validate final state/candidate evidence; atomic hire/reject and communication intent |
| `OfferLetterService`       | `generate`, `get`, `listForCandidate`, `send`, `respond`                                 | Offer content, ownership, immutable response and completion logic                    |

`HiringDecisionService.decide` updates request/application state, logs, email intent and candidate notification in one database transaction; HIRE can create a `SENT` offer. Delivery is then queued using persistent email-log-derived job IDs.

`OfferLetterService.respond` requires candidate ownership and `SENT` status. ACCEPT updates offer/application/request and candidate department; when accepted hires meet headcount it also closes the posting and completes the hiring task/plan/campaign. DECLINE records response and keeps the campaign available to continue.

Database access: `InterviewSchedule`, `InterviewResult`, `Application`, `RecruitmentRequest`, `OfferLetter`, `RequestLog`, `Notification`, `EmailLog`, `JobPosting`, `TaskPlan`, `OverallPlan`, `User`.

### 4.7 Notifications, email and reminders

| Component                         | Responsibility                                                               |
| --------------------------------- | ---------------------------------------------------------------------------- |
| Gateway `NotificationsController` | SSE stream, list, mark read/delete operations                                |
| `SseNotificationService`          | Bridges stored/published notifications to connected users                    |
| Notification service              | Creates notification, renders templates and accepts email commands           |
| Worker email processor            | Sends queued email and updates `EmailLog` status/error                       |
| Task reminder flow                | Upserts `24h-before`/`deadline` records and skips completed/ineligible tasks |

External email is not part of a database transaction. The design persists intent first, then queues delivery and records failure for retry/diagnosis.

Database access: `Notification`, `EmailLog`, `TaskReminder`, `TaskPlan`.

### 4.8 Tracking and reports

| Class            | Key methods                                                       | Output                                                                          |
| ---------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `ReportsService` | `getRealtimeTracking`                                             | Role-scoped owner, pending action, task/interview/offer counters and latest log |
| `ReportsService` | `getHrDashboard`, `getAdminDashboard`, `getHrRequestQueueSummary` | Dashboard summaries                                                             |
| `ReportsService` | `getAnnualReport`, `getAnnualReportExport`                        | Annual metrics and CSV/PDF-ready data                                           |
| `ReportsService` | `getDepartmentStats`, `getDepartmentReport`                       | Department drill-down                                                           |
| `ReportsService` | `getTimeToHireReport`, `getPipelineOverview`, `getHiringMetrics`  | Operational analytics                                                           |

Report queries must enforce role scope before aggregation. Realtime tracking derives the timeline from `RequestLog` and combines request, plan/task, interview, application and offer relations.

## 5. Cross-cutting design

### 5.1 Authorization

- Global JWT protection with explicit public routes.
- Role metadata and `RolesGuard` at Gateway controllers.
- Service-level owner, department, actor and workflow-state validation.
- Candidate file/offer/schedule reads and mutations check ownership.
- Panel feedback checks evaluator participation/permission.

### 5.2 Validation and errors

- Gateway DTO/class validation rejects malformed HTTP input.
- Services return structured RPC errors with HTTP-equivalent status.
- Global exception filter normalizes HTTP responses.
- Conflict errors describe invalid state, schedule overlap or duplicate response rather than silently ignoring it.

### 5.3 Transactions and idempotency

- Multi-record business decisions use Prisma transactions.
- Request transitions and logs are coupled.
- Offer response may produce multiple ordered logs in one transaction.
- Reminder uniqueness is `(taskPlanId, reminderKey)`.
- Email job IDs should derive from `EmailLog` IDs.
- Issue #223 is closed; CV parse/email completion guards and stable reminder/email job IDs are present. All 13 worker unit tests passed during documentation QA; a retry/concurrency execution remains a release-verification item.

### 5.4 Audit and observability

- `RequestLog`: request workflow truth.
- `AuditLog`: generic plan/interview/CV action trail.
- `EmailLog`: delivery state/error.
- `TalentSearchRun/Feedback`: search/model/human-action trace.
- Aggregated health endpoints are implemented.
- Issue #224 is closed and implementation evidence exists in `@wr/logger`, Gateway correlation middleware, TCP interceptors and BullMQ context propagation.

### 5.5 Time, files and external providers

- API date/time input is ISO-8601; interviews must be future times.
- User-facing schedule email currently formats Asia/Ho_Chi_Minh time.
- CV storage paths are generated and database rollback removes newly uploaded objects.
- Provider credentials come from validated environment variables and are never documented as literal secrets.
- Google Calendar/Meet, Supabase storage, email transport and optional Gemini extraction must fail with explicit user/operational feedback.

## 6. Deployment design

Editable diagram: [deployment.puml](./diagrams/deployment.puml)

### 6.1 Development topology

| Component        | Default address / transport              |
| ---------------- | ---------------------------------------- |
| Webapp           | `http://localhost:3000`                  |
| Gateway          | `http://localhost:3001/api/v1`           |
| Identity         | NestJS TCP `:3010`                       |
| Recruiting       | NestJS TCP `:3011`                       |
| Profiles         | NestJS TCP `:3012`                       |
| Notification     | NestJS TCP `:3013`                       |
| CV               | NestJS TCP `:3014`                       |
| Interview        | NestJS TCP `:3015`                       |
| PostgreSQL/Redis | Docker Compose/private development ports |

### 6.2 Required configuration groups

- Database: `DATABASE_URL`.
- Redis/BullMQ: Redis host/port and queue configuration.
- Security: JWT secret and CORS origin.
- Storage: Supabase URL/key/bucket settings as required by the storage package.
- Email: provider credentials/sender configuration.
- Calendar: Google OAuth client/callback configuration.
- Optional CV extraction: Gemini key slots/model configuration.

Exact variable names and defaults must be taken from current `.env.example` and `@wr/config`, not copied from secrets.

## 7. Design verification

| Check                   | Evidence                             | State                                             |
| ----------------------- | ------------------------------------ | ------------------------------------------------- |
| FR-to-code mapping      | [TRACEABILITY.md](./TRACEABILITY.md) | Complete                                          |
| Editable UML sources    | `reports/diagrams/*.puml`            | Complete                                          |
| Role/screen mapping     | [screens.md](./screens.md)           | Complete                                          |
| Current schema mapping  | Domain class PUML vs Prisma schema   | Complete                                          |
| PlantUML render/syntax  | Eight generated PNG previews         | Verified                                          |
| Full lifecycle E2E      | Closed GitHub #213; role-flow script | Script present; run pending                       |
| Auth E2E                | Closed GitHub #214                   | Full-flow artifact incomplete                     |
| CV pipeline E2E         | Closed GitHub #215                   | Full parse/embed/search artifact incomplete       |
| Production hardening/CI | Closed GitHub #186, #224, #227       | Logging/security code present; CI workflow absent |
