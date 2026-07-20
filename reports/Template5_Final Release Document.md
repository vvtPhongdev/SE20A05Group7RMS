# Recruitment Workflow Management System

# Final Release Document - Release Candidate

Document ID: `REP-05`  
Version: `1.0-RC1`  
Date: 2026-07-15  
Repository baseline: `main` at `9393a9d` plus the reviewed working-tree implementation

Related documents: [Report index](./README.md) · [RDS](./Template2_RDS%20Document.md) · [SDS](./Template3_SDS%20Document.md) · [Issues](./Template4_Issues%20Report.md) · [Screens](./screens.md)

## 1. Deliverable package

| No. | Deliverable                          | Version / path                                           | Notes                                                             |
| --- | ------------------------------------ | -------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | Source code                          | Repository `main`                                        | Turborepo monorepo: webapp, Gateway, services and shared packages |
| 2   | Database schema/migrations           | `packages/database/prisma`                               | PostgreSQL 16 + pgvector; Prisma schema plus raw vector migration |
| 3   | Requirement and Design Specification | `reports/Template2_RDS Document.md`                      | FR, UC, screens, rules and acceptance                             |
| 4   | Software Design Specification        | `reports/Template3_SDS Document.md`                      | Architecture, models, classes, sequences and deployment           |
| 5   | Project Tracking                     | `reports/Template1_Project Tracking.md`                  | 35 product functions and four iterations                          |
| 6   | Issues Report                        | `reports/Template4_Issues Report.md`                     | Issue closure evidence and residual release risks                 |
| 7   | AI Usage Report                      | `reports/Template0__SWP391_AI_Usage_Report_ Template.md` | Five workstreams, validation and evidence policy                  |
| 8   | Traceability matrix                  | `reports/TRACEABILITY.md`                                | FR -> UC -> screen -> API -> code -> database -> report           |
| 9   | Screen URL registry                  | `reports/screens.md`                                     | Localhost placeholders for implemented React routes               |
| 10  | UML source diagrams                  | `reports/diagrams/*.puml`                                | Eight editable PlantUML sources plus rendered PNG previews        |
| 11  | Excalidraw mapping                   | `reports/diagrams/rms-document-map.excalidraw`           | Editable source plus reviewed PNG visual argument                 |
| 12  | Team output summaries                | `outputs/*.md`                                           | Five Git-identity workstreams; not an official roster             |

Repository: https://github.com/vvtPhongdev/SE20A05Group7RMS

## 2. Release scope

### 2.1 Included

- Four-role authentication and protected navigation.
- Organization, department and user administration.
- Department recruitment request and HR/Admin approval workflow.
- OverallPlan/TaskPlan approval and plan-locked campaign execution.
- Job posting, candidate profile, CV processing and talent search.
- Interview panel/schedule/conflict/invitation/feedback flow.
- Final decision, offer/rejection communication and candidate offer response.
- Notifications, task reminders, tracking, pipeline and annual/department reports.

### 2.2 Release classification

This package is `1.0-RC1`. GitHub currently reports zero open issues, and the seven former release-gate issues were closed as `completed` on 2026-07-15. The RC label remains because issue closure and production evidence are different: full auth/CV E2E artifacts and a GitHub Actions workflow remain incomplete, and environment-backed lifecycle/retry/security/logging exercises were not run during documentation QA. See REP-04.

## 3. Installation guide

### 3.1 Prerequisites

- Node.js 22 or newer.
- npm 10.
- Docker Desktop / Docker Compose.
- Git.
- Optional configured accounts/services for Supabase storage, Google OAuth/Calendar, SMTP and Gemini CV extraction.

### 3.2 Obtain and install

```bash
git clone https://github.com/vvtPhongdev/SE20A05Group7RMS.git
cd SE20A05Group7RMS
npm install
```

### 3.3 Configure environment

Copy `.env.example` to `.env` and set environment-specific values. Do not commit real secrets.

Minimum local infrastructure values are already illustrated in `.env.example`:

- `DATABASE_URL`
- `REDIS_URL`, `REDIS_HOST`, `REDIS_PORT`
- `API_PORT`, `API_CORS_ORIGIN`
- `JWT_SECRET`

Provider groups required by enabled features:

- Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, redirect URI.
- Supabase: URL, service-role key and storage buckets.
- Email: SMTP host/port/user/password/from.
- Optional CV extraction: Gemini key slots/model or configured fallback.
- Optional remote embeddings: embedding API URL/token; otherwise local model path is used.

### 3.4 Start infrastructure

```bash
npm run docker:up
```

This starts PostgreSQL 16 with pgvector on port 5432 and Redis 7 on port 6379.

### 3.5 Prepare database

```bash
npm run db:generate
npm run db:migrate:dev
npm run db:seed
```

Use the migration workflow appropriate to the environment. Production deployments should use reviewed deployment migrations rather than development migration creation.

### 3.6 Start the system

All workspaces:

```bash
npm run dev
```

Or start individually:

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

Default development entry points:

- Web: http://localhost:3000
- API: http://localhost:3001/api/v1
- Health: http://localhost:3001/api/v1/health

### 3.7 Validate build quality

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
npm run test:e2e:roles
npm run test:ui:roles
```

Documentation QA on 2026-07-15 recorded these results:

| Check                       | Result                                                              |
| --------------------------- | ------------------------------------------------------------------- |
| `npm run typecheck`         | Pass: 25/25 Turborepo tasks across 18 packages                      |
| Worker Jest                 | Pass: 4 suites / 13 tests                                           |
| PlantUML                    | Pass: eight sources compiled to PNG                                 |
| Excalidraw                  | Pass: JSON validation plus repeated render/view review              |
| Markdown links/tables       | Pass                                                                |
| Role lifecycle and UI smoke | Not run; requires a seeded running environment and role credentials |

Run the remaining format, lint, build and environment-backed smoke commands before final production certification.

## 4. Operations guide

### 4.1 Startup order

1. PostgreSQL and Redis.
2. Schema migration and optional seed.
3. Identity, Recruiting, Profiles, CV, Interview and Notification services.
4. Worker.
5. Gateway.
6. Webapp.
7. Health check and role smoke tests.

### 4.2 Health and diagnosis

- Call `GET /api/v1/health` for the aggregated service state.
- Check `RequestLog` for request workflow history.
- Check `AuditLog` for plan/interview/CV activity.
- Check `EmailLog` and `TaskReminder` for delivery/retry state.
- Check queue/worker logs when CV, embedding, email or reminder processing is delayed.
- Structured correlation code is present for HTTP, TCP and queue work; verify one end-to-end correlation trace in the target environment.

### 4.3 Backup and data handling

- Back up PostgreSQL and configured storage buckets together so database metadata and files remain consistent.
- Protect CVs, candidate data, offer compensation, tokens and provider credentials as sensitive data.
- Do not log raw passwords, JWT secrets, refresh tokens or provider keys.
- Apply organization/role/ownership scope to exports and operational queries.

## 5. User manual

All URLs below are placeholders. Replace `http://localhost:3000` with the deployed web host.

### 5.1 Common account workflow

1. Candidate registers at http://localhost:3000/signup.
2. Candidate verifies OTP at http://localhost:3000/verify-email.
3. Any active user logs in at http://localhost:3000/login.
4. The app routes the user to Admin, Department Head, HR or Candidate home according to the JWT role.
5. For password recovery, use http://localhost:3000/forgot-password then http://localhost:3000/reset-password.
6. If access is not permitted, the user is sent to http://localhost:3000/unauthorized.

Expected result: active session, role-specific navigation and protected API calls. Invalid/inactive credentials are rejected without revealing sensitive account details.

### 5.2 Department Head - create and track a request

1. Open http://localhost:3000/dept-head/create-request.
2. Enter position, headcount, job description, skills, justification and urgency.
3. Save as draft or submit to HR.
4. Track/edit allowed requests at http://localhost:3000/dept-head/requests.
5. If HR/Admin requests revision, review notes, update and resubmit.
6. Follow status/progress at http://localhost:3000/dept-head.
7. When invited to a panel, open http://localhost:3000/dept-head/interviews.
8. Submit attributed feedback at http://localhost:3000/dept-head/feedback.

Expected result: request transitions are visible in the timeline and the Department Head sees only allowed department/owned data.

### 5.3 HR Leader - review, plan and start campaign

1. Open request queue at http://localhost:3000/hr/requests.
2. Review/assign the request; return for revision or forward it to Admin.
3. After approval, open http://localhost:3000/hr/campaigns and select/create the campaign.
4. Define OverallPlan dates at http://localhost:3000/hr/campaigns/{campaignId}.
5. Create and assign tasks at http://localhost:3000/hr/tasks; all task dates must fit the plan.
6. Submit the plan for Admin approval. If rejected, revise and resubmit.
7. Start the campaign only after approval and valid task assignments.
8. Manage the posting at http://localhost:3000/hr/job-postings/{requestId}.

Expected result: request becomes active, assignees receive task notifications, and downstream functions unlock only under plan-lock rules.

### 5.4 Candidate and CV workflow

Candidate:

1. Maintain profile at http://localhost:3000/candidate/profile.
2. Upload/replace/delete CV at http://localhost:3000/candidate/upload-cv.
3. Review processing state and correct profile information if extraction requires adjustment.

HR Leader:

1. Browse the pool at http://localhost:3000/hr/candidates.
2. Search at http://localhost:3000/hr/search using job-relevant terms.
3. Open the latest CV and record the human shortlist/screening decision.

Expected result: CV metadata, extracted content, embeddings and human actions are traceable. Search relevance never replaces human review.

### 5.5 Interview workflow

1. HR opens http://localhost:3000/hr/interviews.
2. Select the active request/application, a future time, duration, location and at least two panel members.
3. The system validates plan-lock, panel eligibility and conflicts.
4. Candidate/panel receive notifications and invitation email.
5. Candidate views/responds at http://localhost:3000/candidate/interviews.
6. HR reviews details/attendance at http://localhost:3000/hr/interview-detail?id={interviewId}.
7. Panel members submit feedback in their respective feedback/results screen.
8. HR submits the final recommendation at http://localhost:3000/hr/results.

Expected result: interview and application/request states align, each evaluator is attributable, and Admin is notified when results are ready.

### 5.6 Final decision and offer

1. Admin opens http://localhost:3000/admin/interview-results.
2. Review CV, attendance, panel feedback, scores and HR recommendation.
3. Choose HIRE, REJECT or request more information.
4. HIRE supplies candidate, compensation and start date; the system creates/sends an offer through the implemented decision path.
5. Candidate opens http://localhost:3000/candidate/offers then http://localhost:3000/candidate/offer/{offerId}.
6. Candidate accepts or declines once, with an optional note.
7. The system notifies Department Head, HR and Admin; if accepted hires meet headcount, it completes campaign records.

Expected result: decision, request/application status, offer, logs and communication intent are persisted consistently.

### 5.7 Admin governance and reports

1. Manage users at http://localhost:3000/admin/users.
2. Manage organization/departments at http://localhost:3000/admin/settings.
3. Review request/plan decisions at http://localhost:3000/admin/approval-queue.
4. View all requests at http://localhost:3000/admin/requests.
5. View annual reports/export at http://localhost:3000/admin/reports.
6. Drill down by department at http://localhost:3000/admin/dept-stats.

HR pipeline reports are at http://localhost:3000/hr/reports; Department Head tracking is at http://localhost:3000/dept-head.

## 6. Known limitations and release gates

| Gate               | GitHub state | Required evidence / current review                                                   |
| ------------------ | ------------ | ------------------------------------------------------------------------------------ |
| Full lifecycle E2E | #213 closed  | Role-flow script exists; run it against a clean seeded environment and retain output |
| Auth E2E           | #214 closed  | Add/retain register/login/refresh/logout/provider E2E evidence                       |
| CV pipeline E2E    | #215 closed  | Add/retain upload/replace/parse/embed/search E2E evidence                            |
| Worker idempotency | #223 closed  | Demonstrate retry/concurrency without duplicate side effects                         |
| Structured logging | #224 closed  | Demonstrate one correlation ID across HTTP, TCP and queue logs                       |
| API hardening      | #227 closed  | Verify deployed CORS, Helmet headers and rate limits                                 |
| CI/CD              | #186 closed  | Add a workflow that gates format/lint/typecheck/build/test                           |

Additional submission-only inputs: official lecturer/student roster data, original AI session evidence and deployed host URL.

## 7. Release acceptance checklist

- [x] Deliverables and source paths listed.
- [x] Installation and environment groups documented without secrets.
- [x] Four actor workflows documented with screen URL placeholders.
- [x] RDS/SDS/traceability/issue documents cross-linked.
- [x] Editable PUML and Excalidraw sources included.
- [x] All seven former release-gate GitHub issues are closed.
- [ ] REP-04 closure-evidence gaps verified or risk-accepted.
- [ ] Clean-clone deployment validated in a fresh environment.
- [ ] Official roster and AI evidence attached.
- [ ] Deployed URLs replace localhost placeholders.
