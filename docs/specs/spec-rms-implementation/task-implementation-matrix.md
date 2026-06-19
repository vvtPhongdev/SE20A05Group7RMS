# Task Implementation Matrix

This companion maps every task in `docs/all-tasks.md` to implementation targets and acceptance checks. Implement tasks in dependency order unless a task is already complete and verified.

## Phase 0: Foundation

| ID | Implementation target | Acceptance / verification |
| --- | --- | --- |
| T-001 | Verify all npm workspaces build and typecheck from the root. | `npm run typecheck` and `npm run build` complete after dependencies are installed. |
| T-002 | Define canonical domain enums in `packages/contracts/src/enums`. | All services and webapp import roles/statuses from `@wr/contracts`; no local enum copies. |
| T-003 | Create or verify design tokens in `packages/ui/src/styles/tokens.css`. | UI components consume CSS variables for color, spacing, radius, status, and typography. |
| T-004 | Configure CSS reset and IBM Plex Sans/Mono loading. | Webapp and shared UI render with consistent reset and fonts. |
| T-005 | Build Radix-backed UI primitives in `packages/ui`. | Button, Input, Textarea, Select, Badge, StatusBadge, Tooltip, Dialog, Tabs, DropdownMenu, Separator, ScrollArea, and Toast are exported. |
| T-006 | Verify `docker-compose.yml` starts PostgreSQL 16 with pgvector and Redis 7. | `npm run docker:up` exposes Postgres `5432` and Redis `6379`. |
| T-007 | Align Prisma schema to RMS entities in `packages/database/prisma/schema.prisma`. | Models cover identity, workflow, planning, interviews, profiles, documents, notifications, email logs, and offers. |
| T-008 | Run Prisma migration for relational schema changes. | Migration applies locally and Prisma client generates. |
| T-009 | Add raw SQL migration for pgvector extension, vector table/column, and index. | pgvector extension exists and vector similarity query works. |
| T-010 | Seed organization, departments, admin, HR users, department heads, candidates, sample requests, and an approved plan. | Local dev login and role-scoped flows can be exercised from seed data. |

## Phase 1: Identity & Auth

| ID | Implementation target | Acceptance / verification |
| --- | --- | --- |
| T-011 | Scaffold or verify `services/identity` as NestJS TCP service on `3010`. | Service starts and registers identity message patterns. |
| T-012 | Implement registration with password hashing, role validation, optional OTP activation. | Valid user is created; duplicate email and invalid role are rejected. |
| T-013 | Implement login with JWT and refresh token issue. | Valid credentials return access and refresh tokens; invalid credentials fail safely. |
| T-014 | Implement refresh token rotation. | Used refresh tokens cannot be replayed; new access token is issued. |
| T-015 | Implement logout by invalidating refresh token state. | Logout prevents future refresh with the same token. |
| T-016 | Implement forgot-password OTP notification trigger. | OTP is generated, stored with expiry, and notification/email is queued or logged. |
| T-017 | Implement reset-password with OTP validation. | Valid OTP updates password; expired or invalid OTP is rejected. |
| T-018 | Implement Gateway `JwtAuthGuard` and `RolesGuard`. | Protected routes require JWT and role decorators are enforced. |
| T-019 | Add Gateway auth routes for register, login, refresh, logout, forgot, reset, and current user. | Routes are documented under `/api/v1` and proxy to identity service. |
| T-020 | Implement organization and department CRUD in identity service. | Admin can create/update/list orgs and departments; department head assignment is role-valid. |
| T-021 | Implement user management routes and identity handlers. | Admin manages users; HR leader sees scoped recruiter list where required. |
| T-022 | Build frontend login page. | Login stores tokens and redirects based on role. |
| T-023 | Build frontend registration page. | Candidate/internal registration follows allowed role flow and displays validation errors. |
| T-024 | Implement frontend auth context and token management. | Access token attaches to API requests; refresh/logout behavior is consistent. |
| T-025 | Implement frontend role-based route guards. | Unauthorized roles land on an unauthorized or fallback page. |

## Phase 2: Recruitment Request & Approval

| ID | Implementation target | Acceptance / verification |
| --- | --- | --- |
| T-026 | Scaffold or verify `services/recruiting` as NestJS TCP service on `3011`. | Service starts and exposes recruitment message patterns. |
| T-027 | Implement create recruitment request in `DRAFT`. | Department Head can save position, headcount, JD, skills, justification, urgency. |
| T-028 | Implement submit transition `DRAFT -> PENDING_HR_REVIEW`. | Required fields are validated and HR notification is created. |
| T-029 | Implement HR forward transition to Admin approval. | Only HR leader can forward valid requests to `PENDING_BOSS_APPROVAL`. |
| T-030 | Implement Admin approval transition to `APPROVED`. | Approval records approver/time and notifies HR and Department Head. |
| T-031 | Implement rejection with mandatory reason. | Rejected requests store reason and become terminal unless a revision flow explicitly reopens. |
| T-032 | Implement request log auto-write on every workflow transition. | Logs include actor, action, from/to status, timestamp, and metadata. |
| T-033 | Implement get request logs endpoint/handler. | Authorized viewers can see timeline for a request. |
| T-034 | Add Gateway recruitment request routes. | Routes match `docs/backend-endpoints-summary.md` and forward actor context. |
| T-035 | Build Department Head request creation form. | Form supports draft and submit paths with validation. |
| T-036 | Build role-filtered request list. | Each role sees only allowed requests. |
| T-037 | Build request detail with status timeline. | Current status, owner, logs, and available actions are visible. |
| T-038 | Build Admin approve/reject actions. | Admin can approve or reject with reason and sees result immediately. |
| T-039 | Build Department Head tracking dashboard. | Dashboard shows status, handler, filled count, timeline, and logs. |

## Phase 3: Recruitment Planning

| ID | Implementation target | Acceptance / verification |
| --- | --- | --- |
| T-040 | Implement overall plan creation for approved requests. | Plan dates are valid and request transitions to planning state. |
| T-041 | Implement task plan creation under an overall plan. | Tasks include type, assignee, start/end dates, deadline, and notes. |
| T-042 | Implement plan submit transition to approval. | Plan cannot submit without required task coverage. |
| T-043 | Implement Admin plan approval and campaign activation. | Approval unlocks plan-locked activities and notifies stakeholders. |
| T-044 | Implement plan revision request with notes. | Revision moves plan back to editable state and notifies HR leader. |
| T-045 | Enforce plan lock in service layer. | Locked actions return explicit precondition failure before side effects. |
| T-046 | Implement task status updates. | Allowed assignees can move tasks through `PENDING`, `IN_PROGRESS`, `COMPLETED`. |
| T-047 | Add Gateway plan and task routes. | Routes expose overall plan and task plan operations under `/api/v1`. |
| T-048 | Build HR overall plan creation form. | HR leader can create valid timeline for an approved request. |
| T-049 | Build HR task assignment UI. | HR leader assigns recruiters and deadlines within the overall plan dates. |
| T-050 | Build Admin plan review and approval UI. | Admin reviews overall plan and tasks, approves, or requests revision with notes. |

## Phase 4: Candidate & CV Management

| ID | Implementation target | Acceptance / verification |
| --- | --- | --- |
| T-051 | Scaffold or verify `services/profiles` as NestJS TCP service on `3012`. | Service starts and exposes candidate/CV message patterns. |
| T-052 | Implement candidate profile CRUD. | Candidate manages own profile; HR/Admin have scoped profile access. |
| T-053 | Implement CV upload and storage metadata. | PDF/DOC/DOCX limits are enforced and processing status is initialized. |
| T-054 | Implement BullMQ CV text extraction processor. | Worker extracts text, handles parse errors, and updates document status. |
| T-055 | Implement embedding generation processor. | Worker creates 384-dimension embeddings and stores them in pgvector-backed storage. |
| T-056 | Implement vector search endpoint. | HR search returns ranked candidate profiles with similarity scores and summaries. |
| T-057 | Add Gateway candidate and CV routes. | Routes enforce role scope and file upload behavior. |
| T-058 | Build candidate CV upload form. | Candidate can upload and see processing state or failure. |
| T-059 | Build HR candidate search UI. | HR can query candidates and inspect ranked results. |
| T-060 | Build candidate profile view. | Authorized users can view structured profile, CV metadata, and latest CV. |

## Phase 5: Interview & Decision

| ID | Implementation target | Acceptance / verification |
| --- | --- | --- |
| T-061 | Implement interview scheduling with plan-lock checks and selected panel members. | Schedule is rejected without approved plan/task or insufficient panel members. |
| T-062 | Implement available time slot lookup abstraction. | API returns conflict-free suggestions or documented conflict warnings. |
| T-063 | Implement cancel and reschedule handlers. | Changes require reason, update status, and notify candidate/panel. |
| T-064 | Implement interview result recording. | PASS/FAIL, scores, notes, and panel feedback are stored. |
| T-065 | Implement final hiring decision. | Admin decision moves request to hired/not hired path and triggers correct communication. |
| T-066 | Scaffold or verify notification service on `3013`. | Service starts and exposes notification/email message patterns. |
| T-067 | Implement interview invitation email flow. | Candidate and panel receive schedule details and email log records delivery. |
| T-068 | Implement offer letter email flow. | HR leader can generate/review/send offer and candidate receives it. |
| T-069 | Implement rejection email flow. | Failed/not-hired candidates receive professional rejection with reason. |
| T-070 | Implement in-app notification system. | Notifications are stored, listed, marked read, and available via SSE if supported. |
| T-071 | Add Gateway interview and notification routes. | Routes match implemented role access and endpoint summary. |
| T-072 | Build HR interview scheduling UI. | HR selects candidate, time, location/link, and at least two interviewers unless exception is supported. |
| T-073 | Build interview calendar view. | Users can see scheduled, rescheduled, cancelled, and completed interviews. |
| T-074 | Build interview result UI. | HR/panel can submit allowed feedback and result fields. |
| T-075 | Build Admin hiring decision UI. | Admin reviews result and sends hire/reject decision. |
| T-076 | Build notification center. | Users can view unread/read notifications and open related entities. |

## Phase 6: Reporting & Analytics

| ID | Implementation target | Acceptance / verification |
| --- | --- | --- |
| T-077 | Implement annual recruitment report endpoint. | Admin can query configurable date range and see opened vs filled metrics. |
| T-078 | Implement department-wise report endpoint. | Admin and scoped Department Head can view department stats. |
| T-079 | Implement time-to-hire metrics endpoint. | Metrics are derived from request logs and hiring/completion timestamps. |
| T-080 | Implement pipeline overview endpoint. | HR/Admin can see active stage counts, blockers, and pending actions. |
| T-081 | Add Gateway report routes. | Report routes enforce role access and query validation. |
| T-082 | Build Admin dashboard. | Admin sees approval queue, strategic metrics, and annual/department report links. |
| T-083 | Build HR dashboard. | HR sees pipeline, assigned tasks, campaign status, and pending interviews. |
| T-084 | Build Department Head dashboard. | Department Head sees own request tracking and department progress. |

## Cross-Cutting Definition Of Done

- Contracts updated before service/UI code.
- Database migration and seed data updated for schema changes.
- Gateway route documented in `docs/backend-endpoints-summary.md`.
- State transitions covered by unit tests.
- Plan-lock and role guard behavior tested.
- Frontend has loading, empty, error, and unauthorized states.
- Docs updated in the same change as behavior.

