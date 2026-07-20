# Recruitment Workflow Management System

# Requirement and Design Specification

Document ID: `REP-02`  
Version: `1.0-RC1`  
Date: 2026-07-15  
Group: SE20A05 Group 7

Related documents: [Report index](./README.md) · [Traceability](./TRACEABILITY.md) · [SDS](./Template3_SDS%20Document.md) · [Screen URLs](./screens.md)

## Record of changes

| Version | Date       | Type     | Owner   | Description                                                                    |
| ------- | ---------- | -------- | ------- | ------------------------------------------------------------------------------ |
| 0.1     | 2026-05-28 | Added    | Group 7 | RMS workflow pivot and four-actor target model                                 |
| 0.9     | 2026-07-06 | Modified | Group 7 | Unified HR role and requirement v1.0 completion rules                          |
| 1.0-RC1 | 2026-07-15 | Modified | Group 7 | Replaced template content with code-backed requirements, mappings and diagrams |

## 1. Overview

### 1.1 Purpose

RMS is an internal enterprise hiring platform that governs recruitment from a department's staffing need through HR review, Admin approval, campaign planning, candidate/CV operations, panel interviews, final decision, offer response and reporting.

The central business argument is that recruitment activity is not free-form: approval and a valid campaign plan unlock downstream operations, every transition is traceable, and human actors retain all hiring authority.

### 1.2 Scope

In scope:

- Account/session, organization, department and role management.
- Recruitment request review and multi-stage approval.
- Overall campaign plan and dated task assignments.
- Job posting, candidate profile, CV upload, parse, embedding and search.
- Interview panel selection, conflict checks, invitations, attendance and feedback.
- Admin hiring decision, offer/rejection communication and candidate response.
- Realtime tracking, annual reports, department statistics and notifications.

Out of scope for `1.0-RC1`:

- Payroll, onboarding, employee performance and HRIS integration.
- Autonomous AI ranking or hiring decisions.
- Multi-database-per-service deployment.
- Production SLA, disaster recovery certification and audited compliance controls.

### 1.3 Actors

| Actor           | Implemented role  | Responsibilities                                                           | Data scope                        |
| --------------- | ----------------- | -------------------------------------------------------------------------- | --------------------------------- |
| Admin / Boss    | `ADMIN`           | User/org governance, request/plan approval, final hiring decision, reports | Organization-wide                 |
| Department Head | `DEPARTMENT_HEAD` | Create staffing request, revise/track it, join interview panel             | Own department and owned requests |
| HR Leader       | `HR_LEADER`       | Review requests, plan campaign, manage tasks/posting/CV/interviews/offers  | HR-managed workflow               |
| Candidate       | `CANDIDATE`       | Maintain profile/CV, view interviews/notifications, answer offers          | Own profile, schedules and offers |
| System / Worker | Service identity  | CV processing, embeddings, email, reminders, audit and health              | Task-scoped internal access       |

Older planning documents that say `HR_MANAGER` or `HR_RECRUITER` are interpreted as `HR_LEADER` for this release.

### 1.4 Use-case model

Editable diagram: [system-use-cases.puml](./diagrams/system-use-cases.puml)

The canonical detailed catalog contains 61 use cases in [`docs/use-case-specifications.md`](../docs/use-case-specifications.md). This specification groups them without changing their IDs:

| Range        | Capability                                                  | Primary actors                        |
| ------------ | ----------------------------------------------------------- | ------------------------------------- |
| UC-01..UC-09 | Authentication, own profile and calendar integration        | All users                             |
| UC-10..UC-15 | Users, roles, organizations, departments and team members   | Admin, Department Head                |
| UC-16..UC-24 | Recruitment request creation, review, approval and tracking | Department Head, HR, Admin            |
| UC-25..UC-31 | OverallPlan, TaskPlan and campaign execution                | HR, Admin                             |
| UC-32..UC-45 | Job posting, application, candidate profile, CV and search  | HR, Admin, Candidate, Worker          |
| UC-46..UC-56 | Interview, feedback, final decision and offer               | HR, Department Head, Admin, Candidate |
| UC-57..UC-61 | Notifications, dashboards, reports, security and health     | All actors, System                    |

## 2. Overall functionality

### 2.1 End-to-end workflow

Editable state diagram: [recruitment-state-machine.puml](./diagrams/recruitment-state-machine.puml)

Primary path:

```text
DRAFT -> PENDING_HR_REVIEW -> PENDING_BOSS_APPROVAL -> APPROVED
-> PLANNING -> PLAN_PENDING_APPROVAL -> PLAN_APPROVED -> ACTIVE
-> SCREENING / INTERVIEWING -> INTERVIEW_COMPLETED
-> OFFER_EXTENDED or NOT_HIRED
-> OFFER_ACCEPTED / OFFER_DECLINED -> HIRED -> COMPLETED
```

Revision, rejection, close and cancellation branches are shown in the PUML source. Compatibility values in the enum are not all valid next states from every point; service methods enforce transitions.

### 2.2 Screen flow and placeholders

- Role-based editable screen flow: [`docs/screen-flow.puml`](../docs/screen-flow.puml).
- Complete route placeholder registry: [screens.md](./screens.md).
- All examples use `http://localhost:3000` as the web host placeholder.

| Actor           | Entry URL                       | Core route set                                                        |
| --------------- | ------------------------------- | --------------------------------------------------------------------- |
| Admin           | http://localhost:3000/admin     | approval queue, requests, interview results, users, settings, reports |
| Department Head | http://localhost:3000/dept-head | create/track request, interviews, feedback, settings                  |
| HR Leader       | http://localhost:3000/hr        | requests, campaigns, tasks, postings, candidates, interviews, reports |
| Candidate       | http://localhost:3000/candidate | profile, CV, notifications, interviews and offers                     |

### 2.3 Screen authorization

| Capability                   | Admin                       | Department Head                   | HR Leader           | Candidate               |
| ---------------------------- | --------------------------- | --------------------------------- | ------------------- | ----------------------- |
| Manage users/org/departments | Full                        | Department settings only          | Read as required    | No                      |
| Create request               | No                          | Own department                    | No                  | No                      |
| Review/forward request       | Decision/revision           | Revise own                        | Review/forward      | No                      |
| Approve plan                 | Yes                         | View status                       | Create/submit/start | No                      |
| Manage candidate/CV search   | Review                      | Read when panel/department scoped | Operational         | Own profile/CV only     |
| Schedule interview           | Review/cancel where allowed | Panel view/feedback               | Yes                 | Respond to own schedule |
| Final decision               | Yes                         | No                                | Recommend           | No                      |
| Offer                        | Review/decision path        | No                                | Generate/send path  | Own offer response      |
| Reports                      | Organization-wide           | Own department                    | Pipeline/workload   | No                      |

Frontend route guards improve navigation, but the Gateway JWT/role guards and service ownership/state checks are the authorization boundary.

### 2.4 Non-UI functions

| ID    | Function                 | Trigger                                     | Result                                           |
| ----- | ------------------------ | ------------------------------------------- | ------------------------------------------------ |
| NF-01 | CV text extraction       | Candidate CV upload/replace                 | Raw text and processing state stored             |
| NF-02 | Structured CV extraction | Worker job; optional configured extractor   | Structured profile/CV JSON stored                |
| NF-03 | Embedding generation     | Successful parse                            | Chunked 384-dimension vectors stored in pgvector |
| NF-04 | Email delivery           | Interview, decision, offer, reminder events | `EmailLog` plus queued delivery/retry            |
| NF-05 | Task reminders           | 24 hours before deadline and at deadline    | Unique `TaskReminder` and notification/email     |
| NF-06 | Realtime notifications   | Domain events                               | `Notification` plus SSE delivery bridge          |
| NF-07 | Audit trail              | Status-changing actions                     | `RequestLog` and/or generic `AuditLog`           |
| NF-08 | Aggregated health        | `GET /api/v1/health`                        | Gateway and service health response              |

## 3. High-level design

### 3.1 Architecture

Editable architecture diagram: [package-architecture.puml](./diagrams/package-architecture.puml)

```text
React SPA -> API Gateway /api/v1 -> NestJS TCP microservices
                                  -> shared PostgreSQL + pgvector
                                  -> Redis/BullMQ workers
                                  -> storage, calendar and email providers
```

All frontend HTTP calls go through the Gateway. Internal services use message patterns and do not expose public HTTP routes. Shared contracts are the intended source of enum/DTO truth.

### 3.2 Database design

Editable entity/class diagram: [domain-class-diagram.puml](./diagrams/domain-class-diagram.puml)

The current schema contains 22 Prisma models grouped as follows:

| Domain                  | Models                                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| Identity                | `User`, `Organization`, `Department`                                                                       |
| Request governance      | `RecruitmentRequest`, `JobPosting`, `ApprovalRecord`, `RequestLog`, `AuditLog`                             |
| Planning                | `OverallPlan`, `TaskPlan`, `TaskReminder`                                                                  |
| Candidate/search        | `CandidateProfile`, `CandidateCV`, `CvEmbedding`, `Application`, `TalentSearchRun`, `TalentSearchFeedback` |
| Interview/communication | `InterviewSchedule`, `InterviewResult`, `OfferLetter`, `Notification`, `EmailLog`                          |

Detailed fields and access design are in REP-03 §3.

## 4. Functional requirements

### 4.1 Identity and organization - FR-01

| Field          | Specification                                                                        |
| -------------- | ------------------------------------------------------------------------------------ |
| Use cases      | UC-01..UC-15, UC-60                                                                  |
| Actors         | Admin, Department Head, HR Leader, Candidate                                         |
| Preconditions  | Organization exists for users; role and active state are valid                       |
| Normal flow    | Register/verify/login; Admin manages users/org/departments; user updates own profile |
| Exceptions     | Duplicate email/slug/code; invalid OTP/token; inactive user; forbidden role/scope    |
| Postconditions | User/session/org structure is persisted; protected routes expose only permitted data |
| Screens        | SCR-COM-01..06, SCR-ADM-05..06, SCR-DH-05                                            |
| APIs           | `/api/v1/auth/*`, `/users`, `/organizations`, `/departments`, `/me/profile`          |

### 4.2 Recruitment requests - FR-02 and FR-03

| Field             | Specification                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Use cases         | UC-16..UC-24                                                                                                                    |
| Trigger           | Department Head identifies a staffing need                                                                                      |
| Required input    | Position, headcount, job description, skills, justification and urgency                                                         |
| Normal flow       | Draft -> submit -> HR review -> Admin decision -> approved/rejected/revision                                                    |
| Alternative flows | HR returns for revision; Admin requests changes; Admin rejects with reason                                                      |
| Exceptions        | Not owner; invalid status; missing request; invalid assignee; blank rejection/revision reason                                   |
| Postconditions    | Request, approval record and transition log reflect the same decision; stakeholders are notified                                |
| Screens           | SCR-DH-02..03, SCR-HR-02, SCR-ADM-02..03                                                                                        |
| APIs              | `/recruitment-requests`, `/:id/submit`, `/assign`, `/return-for-revision`, `/forward-to-admin`, `/request-changes`, `/decision` |

Detailed sequence: [sequence-request-approval.puml](./diagrams/sequence-request-approval.puml).

### 4.3 Campaign planning - FR-04 through FR-07

| Field          | Specification                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------- |
| Use cases      | UC-25..UC-31                                                                                  |
| Preconditions  | Request is approved; HR Leader is authorized                                                  |
| Normal flow    | Create OverallPlan -> add dated TaskPlans -> submit -> Admin approve -> start campaign        |
| Task types     | `JOB_POSTING`, `CV_COLLECTION`, `CV_SCREENING`, `INTERVIEW_COORDINATION`, `HIRING`            |
| Validation     | Plan dates ordered; task dates fall within plan; active HR assignee; required task coverage   |
| Exceptions     | Plan not editable/approved; missing assignee/deadline; invalid task status; revision required |
| Postconditions | Approved plan and tasks unlock only their permitted recruitment activities                    |
| Screens        | SCR-HR-03..06, SCR-ADM-02                                                                     |
| APIs           | `/overall-plan`, `/overall-plan/:id/*`, `/task-plan`, `/task-plan/:id/*`                      |

Plan-lock business rule:

1. Request status must permit the requested operation.
2. An `OverallPlan` must exist and be `APPROVED`.
3. The required activity `TaskPlan` must exist and be assigned appropriately.
4. Services reject the action with a specific failure reason when any condition fails.

### 4.4 Job posting, candidate and CV - FR-08 through FR-11

| Field            | Specification                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| Use cases        | UC-32..UC-45                                                                                                          |
| Actors           | Candidate, HR Leader, Admin, Department Head (read scope), Worker                                                     |
| Normal flow      | Candidate manages profile/CV; worker parses/embeds; HR searches/screens; posting is published under approved campaign |
| File constraints | PDF, DOCX and DOC are accepted by current Gateway CV flow; maximum 10 MiB                                             |
| Search rule      | Vector/hybrid output supports retrieval; a human makes screening and hiring decisions                                 |
| Exceptions       | Unsupported file, storage failure, parse failure, missing embedding, forbidden candidate, plan-lock failure           |
| Postconditions   | Current CV/profile/search feedback are persisted and traceable                                                        |
| Screens          | SCR-CAN-02..03, SCR-HR-06..08                                                                                         |
| APIs             | `/candidate-profiles`, `/candidate/cvs`, `/cv/search`, `/talent/search`, `/job-postings`                              |

### 4.5 Interviews - FR-12, FR-13 and FR-16

| Field             | Specification                                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| Use cases         | UC-46..UC-50                                                                                                          |
| Preconditions     | Approved plan; `INTERVIEW_COORDINATION` task; candidate application exists                                            |
| Input             | Candidate, request, ISO-8601 start time, 15-480 minute duration, location, panel IDs                                  |
| Panel rule        | At least two distinct active internal users; scheduler may be included in resolved panel                              |
| Normal flow       | Validate plan/panel -> check conflicts -> transactionally create schedule/update states/log -> notify candidate/panel |
| Alternative flows | Candidate confirms/requests reschedule/cancels; HR reschedules/cancels with reason                                    |
| Exceptions        | Past/invalid time, conflict, insufficient/invalid panel, missing application, unauthorized ownership                  |
| Postconditions    | Schedule and status/logs agree; invitations and delivery logs are available                                           |
| Screens           | SCR-HR-09..10, SCR-DH-04, SCR-CAN-05                                                                                  |
| APIs              | `/interviews/schedules`, `/interviews/requests/:requestId/schedules`, confirm/reschedule/cancel/invitations           |

Detailed sequence: [sequence-plan-and-interview.puml](./diagrams/sequence-plan-and-interview.puml).

### 4.6 Interview result, decision and offer - FR-14, FR-15, FR-17 and FR-18

| Field          | Specification                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Use cases      | UC-51..UC-56                                                                                           |
| Feedback       | Invited/authorized panel member records PASS/FAIL, technical, communication, culture and notes         |
| Recommendation | HR Leader submits final recommendation/summary for Admin review                                        |
| Decision       | Admin selects HIRE or REJECT; HIRE requires candidate, compensation and valid start date               |
| Communication  | Decision transaction creates request/application/log/notification/email state before queueing delivery |
| Offer response | Candidate owner may answer only a `SENT` offer once with ACCEPT or DECLINE and optional note           |
| Completion     | Accepted hires reaching headcount close job posting, complete hiring task/plan and request             |
| Exceptions     | Not panel/owner, absent PASS evidence, offer not SENT, duplicate response, invalid compensation/date   |
| Screens        | SCR-HR-11, SCR-ADM-04, SCR-CAN-06..07                                                                  |
| APIs           | `/hr-interview-results`, `/admin-interview-results`, `/hiring-decisions`, `/offers`                    |

Detailed sequence: [sequence-hiring-offer.puml](./diagrams/sequence-hiring-offer.puml).

### 4.7 Notifications and reminders - FR-19

| Field            | Specification                                                                           |
| ---------------- | --------------------------------------------------------------------------------------- |
| Use cases        | UC-49, UC-57                                                                            |
| Channels         | Stored in-app notification, SSE delivery and email queue                                |
| Reminder windows | `24h-before` and `deadline`                                                             |
| Eligibility      | Incomplete task, approved plan, active request and valid deadline                       |
| Idempotency      | Unique `(taskPlanId, reminderKey)` record; email job IDs derive from persistent log IDs |
| Exceptions       | Queue/provider failure records status/error for retry; completed tasks are skipped      |
| Screens          | Notification bell, SCR-HR-13, SCR-CAN-04                                                |

### 4.8 Tracking and reports - FR-20 through FR-22

| Field           | Specification                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| Use cases       | UC-24, UC-58, UC-59                                                                                                  |
| Realtime output | Status, current owner, pending action, headcount/hired count, task/interview/offer progress, latest log, update time |
| Scope           | Admin all; HR managed; Department Head own department/requests                                                       |
| Reports         | Pipeline, time-to-hire, annual export, department stats/report, Admin/HR dashboards                                  |
| Source          | Current workflow tables with `RequestLog` as request timeline authority                                              |
| Exceptions      | Invalid date range, department outside scope, missing report permissions                                             |
| Screens         | SCR-ADM-01/03/07/08, SCR-DH-01, SCR-HR-01/12                                                                         |

## 5. Business rules

| ID    | Rule                                                                                                                 |
| ----- | -------------------------------------------------------------------------------------------------------------------- |
| BR-01 | Current production-facing roles are exactly `ADMIN`, `DEPARTMENT_HEAD`, `HR_LEADER`, and `CANDIDATE`.                |
| BR-02 | A Department Head may create/submit only requests in their permitted department scope.                               |
| BR-03 | Request rejection/revision requires an attributable reason or response where the action requires it.                 |
| BR-04 | Every request status transition creates a `RequestLog` in the same transaction when feasible.                        |
| BR-05 | Recruitment work is blocked until request approval, plan approval and the applicable task assignment are satisfied.  |
| BR-06 | Task dates must fit the OverallPlan and campaign start requires active HR assignees plus dates.                      |
| BR-07 | Candidate search/AI output is advisory retrieval data; humans decide shortlist, interview and hire.                  |
| BR-08 | CV file operations must enforce type/size/ownership and clean up uploaded storage if database persistence fails.     |
| BR-09 | Interview start must be in the future and duration must be between 15 and 480 minutes.                               |
| BR-10 | Interview panel contains at least two distinct active internal users with permitted roles.                           |
| BR-11 | Interview scheduling requires an application for the candidate/request pair.                                         |
| BR-12 | Panel feedback is attributable to the current evaluator and restricted by invitation/role/attendance rules.          |
| BR-13 | Admin is the final hiring authority; HR supplies operational recommendation and may manage explicit offer workflows. |
| BR-14 | HIRE requires a selected eligible candidate plus compensation and start date.                                        |
| BR-15 | Only the owner candidate may respond to an offer, and only while it is `SENT`.                                       |
| BR-16 | Offer response is immutable after the first valid response.                                                          |
| BR-17 | Campaign completes only when accepted hires meet headcount; otherwise recruitment may continue.                      |
| BR-18 | Task reminders are unique by task and reminder window and skip completed/ineligible tasks.                           |
| BR-19 | Candidate and organization data is returned only within role/ownership scope.                                        |
| BR-20 | The Gateway is the public HTTP boundary; internal TCP services are not called directly by the SPA.                   |

## 6. Non-functional requirements

| ID                     | Requirement                                                               | Acceptance for RC1                                                                       |
| ---------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| NFR-01 Security        | JWT, role guard, ownership/state validation, safe password/token handling | Implemented with CORS/Helmet/throttling; deployed-policy verification pending            |
| NFR-02 Reliability     | Atomic state changes, retryable email jobs, persistent logs               | Critical transactions and worker guards present; retry/concurrency run pending           |
| NFR-03 Traceability    | RequestLog/AuditLog and document mapping                                  | Implemented and documented                                                               |
| NFR-04 Performance     | Pagination, indexed filters, pgvector retrieval, async heavy work         | Implemented baseline; load benchmark not release-certified                               |
| NFR-05 Maintainability | Strict TypeScript, shared contracts, Gateway boundary, modular services   | Implemented baseline                                                                     |
| NFR-06 Observability   | Health checks, structured logs and correlation IDs                        | Health, Pino logging and correlation propagation are code-backed; trace exercise pending |
| NFR-07 Accessibility   | Keyboard and color-independent status support                             | Issue #228 closed; regression review still required per release                          |
| NFR-08 Portability     | Docker Compose infrastructure and environment validation                  | Development deployment documented                                                        |
| NFR-09 Testing         | Auth, CV and full workflow E2E                                            | Lifecycle script present; full auth and CV-pipeline E2E artifacts incomplete             |

## 7. Assumptions, dependencies and limitations

### Assumptions

- Organization, departments and internal user accounts are seeded/configured before workflow use.
- Email, storage and calendar provider credentials are supplied by the deployment environment.
- Dates are stored as timestamps; user-facing interview text is displayed for Asia/Ho_Chi_Minh where implemented.
- The official roster and AI session captures are managed outside source control.

### Dependencies

- Node.js 22+, npm 10, PostgreSQL 16 with pgvector and Redis 7.
- Supabase storage for managed files in configured environments.
- Google OAuth/Calendar for optional calendar/Meet integration.
- Email transport and optional Gemini configuration for structured CV extraction.

### Limitations

- `1.0-RC1` retains compatibility states and some legacy endpoint/document terminology.
- GitHub has zero open issues; REP-04 records closure evidence and residual verification gates.
- Placeholder screen URLs use localhost; deployment URLs are not yet recorded.
- No production claim until deployed security/logging checks, worker retry/concurrency tests, CI/CD and complete auth/CV E2E evidence are verified or risk-accepted.

## 8. Acceptance and traceability

The normative cross-reference is [TRACEABILITY.md](./TRACEABILITY.md). A requirement is document-complete only when its row identifies:

1. At least one UC.
2. A screen placeholder or explicit non-UI actor.
3. A Gateway API/event.
4. A concrete controller/service method area.
5. Persistent data or an explicit stateless result.
6. Design coverage in REP-03.
7. Open release risks in REP-04 where applicable.
