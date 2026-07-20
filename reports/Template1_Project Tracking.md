# RMS Project Tracking

Document ID: `REP-01`  
Release: `1.0-RC1`  
Baseline: 2026-07-15

Related documents: [Report index](./README.md) · [Traceability](./TRACEABILITY.md) · [Screen URLs](./screens.md) · [Issues](./Template4_Issues%20Report.md)

## 1. Product function register

Status meanings: **Done** = implementation exists in the working tree; **Validation pending** = implementation exists but a release-gate test/infra issue is open; **Open** = tracked GitHub issue remains incomplete.

| #   | Screen / function                        | Feature                 | Actor           | Description                                                                  | Owner     | Status                                     | Planned | Actual          | RDS / SDS                 |
| --- | ---------------------------------------- | ----------------------- | --------------- | ---------------------------------------------------------------------------- | --------- | ------------------------------------------ | ------- | --------------- | ------------------------- |
| 1   | Login, registration, OTP, password reset | Authentication          | All             | Account and session lifecycle, including Google/Supabase-backed flow         | WS-3/WS-4 | Validation pending (#214)                  | Iter1   | Iter4 hardening | RDS 4.1 / SDS 4.1         |
| 2   | Admin Dashboard                          | Tracking                | Admin           | Approval, campaign and hiring overview                                       | WS-2      | Done                                       | Iter2   | Iter2           | RDS 4.8 / SDS 4.8         |
| 3   | Admin Approval Queue                     | Request/Plan Governance | Admin           | Approve, reject or request revision for requests/plans                       | WS-2/WS-5 | Validation pending (#213)                  | Iter2   | Iter3           | RDS 4.2-4.3 / SDS 4.2-4.3 |
| 4   | Admin All Requests                       | Tracking                | Admin           | Global request search, status and timeline                                   | WS-2      | Done                                       | Iter2   | Iter3           | RDS 4.8 / SDS 4.8         |
| 5   | Admin Interview Results                  | Hiring Decision         | Admin           | Review feedback and make final hire/reject decision                          | WS-1/WS-5 | Validation pending (#213)                  | Iter3   | Iter4           | RDS 4.6 / SDS 4.6         |
| 6   | Admin Users                              | Identity                | Admin           | Create/update users, role and active status                                  | WS-4      | Done                                       | Iter1   | Iter3           | RDS 4.1 / SDS 4.1         |
| 7   | Admin Settings                           | Organization            | Admin           | Organization and department configuration                                    | WS-4      | Done                                       | Iter1   | Iter3           | RDS 4.1 / SDS 4.1         |
| 8   | Annual Reports                           | Reporting               | Admin           | Annual metrics, time-to-hire and export                                      | WS-2/WS-1 | Done                                       | Iter4   | Iter4           | RDS 4.8 / SDS 4.8         |
| 9   | Department Statistics                    | Reporting               | Admin           | Department-level recruitment metrics                                         | WS-2/WS-1 | Done                                       | Iter4   | Iter4           | RDS 4.8 / SDS 4.8         |
| 10  | Department Dashboard                     | Tracking                | Department Head | Own department requests, status and progress                                 | WS-2      | Done                                       | Iter2   | Iter2           | RDS 4.8 / SDS 4.8         |
| 11  | Create Request                           | Recruitment Request     | Department Head | Create draft with position, headcount, JD, skills, justification and urgency | WS-2/WS-1 | Validation pending (#213)                  | Iter2   | Iter4 alignment | RDS 4.2 / SDS 4.2         |
| 12  | Department Requests                      | Recruitment Request     | Department Head | Edit/resubmit/delete allowed requests and view timeline                      | WS-2/WS-3 | Validation pending (#213)                  | Iter2   | Iter4 alignment | RDS 4.2 / SDS 4.2         |
| 13  | Department Interviews                    | Interview               | Department Head | View invited interviews and attendance                                       | WS-1/WS-2 | Done                                       | Iter3   | Iter4           | RDS 4.5 / SDS 4.5         |
| 14  | Department Feedback                      | Interview Result        | Department Head | Submit panel scores and decision                                             | WS-1/WS-5 | Done                                       | Iter3   | Iter4           | RDS 4.5 / SDS 4.6         |
| 15  | Department Settings                      | Organization            | Department Head | View/update allowed department data and team                                 | WS-1/WS-2 | Done                                       | Iter2   | Iter3           | RDS 4.1 / SDS 4.1         |
| 16  | HR Dashboard                             | Tracking                | HR Leader       | Queue, campaign, task and interview summary                                  | WS-2      | Done                                       | Iter2   | Iter3           | RDS 4.8 / SDS 4.8         |
| 17  | HR Request Queue                         | Request Review          | HR Leader       | Assign/claim, edit, return and forward requests                              | WS-1/WS-3 | Validation pending (#213)                  | Iter2   | Iter4 alignment | RDS 4.2 / SDS 4.2         |
| 18  | Campaigns and Campaign Detail            | Planning                | HR Leader       | Create, submit, resubmit and start OverallPlan                               | WS-1/WS-5 | Validation pending (#213)                  | Iter2   | Iter4           | RDS 4.3 / SDS 4.3         |
| 19  | Task Planner                             | Planning                | HR Leader       | Create, assign and update dated campaign tasks                               | WS-1/WS-5 | Done                                       | Iter2   | Iter4           | RDS 4.3 / SDS 4.3         |
| 20  | Job Posting Workspace                    | Job Posting             | HR Leader/Admin | Draft, upload media, publish and close posting                               | WS-4      | Done                                       | Iter3   | Iter4           | RDS 4.4 / SDS 4.3         |
| 21  | Talent Pool                              | Candidate Management    | HR Leader       | Browse candidate profile and current CV                                      | WS-1/WS-4 | Done                                       | Iter3   | Iter3           | RDS 4.4 / SDS 4.4         |
| 22  | Candidate Search                         | CV Search               | HR Leader       | Vector/hybrid search, shortlist and feedback                                 | WS-4/WS-3 | Validation pending (#215)                  | Iter3   | Iter4           | RDS 4.4 / SDS 4.4         |
| 23  | Interview Schedule                       | Interview               | HR Leader       | Plan-locked schedule, panel validation, conflicts and invitations            | WS-1/WS-5 | Done                                       | Iter3   | Iter4           | RDS 4.5 / SDS 4.5         |
| 24  | Interview Detail                         | Interview               | HR Leader       | Candidate, panel attendance, invitation and result details                   | WS-1/WS-2 | Done                                       | Iter3   | Iter4           | RDS 4.5 / SDS 4.5         |
| 25  | Interview Results                        | Interview Result        | HR Leader       | Own feedback plus final recommendation to Admin                              | WS-1/WS-5 | Done                                       | Iter3   | Iter4           | RDS 4.5-4.6 / SDS 4.6     |
| 26  | Pipeline Reports                         | Reporting               | HR Leader       | Pipeline overview and time-to-hire metrics                                   | WS-4/WS-1 | Done                                       | Iter4   | Iter4           | RDS 4.8 / SDS 4.8         |
| 27  | HR Notifications                         | Communications          | HR Leader       | In-app/SSE notification history and read state                               | WS-1      | Done                                       | Iter4   | Iter4           | RDS 4.7 / SDS 4.7         |
| 28  | Candidate Dashboard/Profile              | Candidate               | Candidate       | Maintain personal profile/avatar and view workflow summary                   | WS-2/WS-4 | Done                                       | Iter2   | Iter3           | RDS 4.4 / SDS 4.4         |
| 29  | Candidate CV                             | CV Intake               | Candidate       | Upload, replace, delete and monitor PDF/DOC/DOCX processing                  | WS-1/WS-3 | Validation pending (#215)                  | Iter3   | Iter4           | RDS 4.4 / SDS 4.4         |
| 30  | Candidate Interviews                     | Interview               | Candidate       | View schedule and confirm/reschedule/cancel                                  | WS-2/WS-1 | Done                                       | Iter3   | Iter4           | RDS 4.5 / SDS 4.5         |
| 31  | Candidate Offers                         | Offer                   | Candidate       | View offer and submit immutable accept/decline response                      | WS-5/WS-2 | Validation pending (#213)                  | Iter4   | Iter4           | RDS 4.6 / SDS 4.6         |
| 32  | Candidate Notifications                  | Communications          | Candidate       | View interview, status and offer messages                                    | WS-2/WS-1 | Done                                       | Iter4   | Iter4           | RDS 4.7 / SDS 4.7         |
| 33  | CV parse and embedding workers           | Async Processing        | System          | Parse CV, structured extraction and vector generation                        | WS-1/WS-4 | Validation pending (#215, #223)            | Iter3   | Iter4           | RDS 4.4 / SDS 4.4         |
| 34  | Task deadline reminders                  | Async Processing        | System          | Idempotent 24-hour/deadline reminder records and email jobs                  | WS-5      | Validation pending (#223)                  | Iter4   | Iter4           | RDS 5.3 / SDS 4.7         |
| 35  | Health and operational hardening         | Operations              | Admin/System    | Aggregated health, exception handling, logging, rate limits and CI           | WS-1/WS-3 | Closure evidence review (#186, #224, #227) | Iter4   | Partial         | RDS 5.5 / SDS 5.4         |

## 2. Iteration 1 - Foundation and scope pivot

| ID    | Planned scope                                    | Owner     | Result                                          | Status             | Trace                    |
| ----- | ------------------------------------------------ | --------- | ----------------------------------------------- | ------------------ | ------------------------ |
| I1-01 | Monorepo, shared packages and database baseline  | WS-1      | Node/TypeScript/Turborepo structure established | Done               | SDS 2-3                  |
| I1-02 | Auth, JWT, refresh token and role guard          | WS-3/WS-4 | Identity TCP service and Gateway protection     | Validation pending | UC-01..UC-07, issue #214 |
| I1-03 | Organization, department and user administration | WS-4      | Identity CRUD and role-scoped UI                | Done               | FR-01                    |
| I1-04 | RMS pivot requirements and workflow              | WS-5      | Four-role workflow and plan-lock documented     | Done               | FR-02..FR-07             |

## 3. Iteration 2 - Request and planning workflow

| ID    | Planned scope                     | Owner     | Result                                                        | Status             | Trace             |
| ----- | --------------------------------- | --------- | ------------------------------------------------------------- | ------------------ | ----------------- |
| I2-01 | Department Head request lifecycle | WS-2/WS-3 | Create/edit/submit/revise/track screens and services          | Validation pending | FR-02, issue #213 |
| I2-02 | HR review and Admin approval      | WS-1/WS-5 | Assign, return, forward, approve/reject/request-changes       | Validation pending | FR-03, issue #213 |
| I2-03 | OverallPlan and TaskPlan          | WS-1/WS-5 | Plan submit/approve/reject/resubmit/start and task operations | Validation pending | FR-04..FR-07      |
| I2-04 | Role dashboards                   | WS-2      | Admin/HR/Department summary screens                           | Done               | FR-20, FR-22      |

## 4. Iteration 3 - Candidate, CV and interview

| ID    | Planned scope                      | Owner          | Result                                                | Status             | Trace                    |
| ----- | ---------------------------------- | -------------- | ----------------------------------------------------- | ------------------ | ------------------------ |
| I3-01 | Candidate profile and CV lifecycle | WS-1/WS-2/WS-3 | Profile, upload, replace, delete and processing state | Validation pending | FR-08..FR-10, issue #215 |
| I3-02 | Talent search and shortlist        | WS-4           | Vector/hybrid search with feedback records            | Validation pending | FR-11, issue #215        |
| I3-03 | Interview schedule and invitation  | WS-1/WS-5      | Plan-lock, panel, conflicts, notifications and email  | Done               | FR-12, FR-13, FR-16      |
| I3-04 | Panel feedback and recommendation  | WS-1/WS-5      | Per-evaluator feedback and HR recommendation          | Done               | FR-14                    |

## 5. Iteration 4 - Decision, reporting and release

| ID    | Planned scope                           | Owner          | Result                                                          | Status             | Trace                           |
| ----- | --------------------------------------- | -------------- | --------------------------------------------------------------- | ------------------ | ------------------------------- |
| I4-01 | Admin final decision and offer response | WS-5/WS-1      | Atomic hire/reject communication and candidate response         | Validation pending | FR-15, FR-17, FR-18; issue #213 |
| I4-02 | Notifications and reminders             | WS-1/WS-5      | SSE/in-app/email plus task deadline reminders                   | Validation pending | FR-19; issue #223               |
| I4-03 | Annual, department and pipeline reports | WS-1/WS-4/WS-2 | Role-scoped tracking, metrics and export                        | Done               | FR-20..FR-22                    |
| I4-04 | Documentation and diagram set           | WS-3 + all     | Six reports, traceability, PUML and Excalidraw mapping          | Done               | REP-00..REP-05                  |
| I4-05 | Release hardening                       | WS-1/WS-3      | Logging/rate-limit code present; GitHub Actions workflow absent | Closure review     | Closed issues #186, #224, #227  |

## 6. Release burndown

| Gate                           | GitHub state | Evidence state                                               |
| ------------------------------ | ------------ | ------------------------------------------------------------ |
| Full recruitment lifecycle E2E | #213 closed  | Script present; clean-environment run not recorded           |
| Auth E2E                       | #214 closed  | Dedicated full-flow artifact not found                       |
| CV pipeline E2E                | #215 closed  | Upload covered; parse/embed/search assertions incomplete     |
| Worker idempotency             | #223 closed  | Guards and unit specs present; retry/concurrency run pending |
| Structured logging/correlation | #224 closed  | Pino/correlation implementation present                      |
| CORS/Helmet/rate limiting      | #227 closed  | Gateway implementation present                               |
| CI/CD pipeline                 | #186 closed  | `.github/workflows` artifact not found                       |

All seven tracker items are closed, but incomplete verification evidence keeps the appropriate release label at `1.0-RC1`.
