# Use Case to Playwright E2E Coverage

## Scope

This matrix maps all 61 Use Cases in `use-case-specifications.md` to the browser-level Playwright
suite. Stateful UI scenarios use deterministic network fixtures and assert both what the user sees
and the HTTP method, endpoint, and business payload emitted by the UI.

Coverage levels:

- **Automated UI**: the user-visible flow and its important validation/alternative path are covered.
- **Partial UI**: the implemented UI portion is covered, but another endpoint or actor in the Use
  Case has no browser workflow.
- **No UI**: the Use Case is an API, infrastructure, or worker concern and belongs in service/API
  tests rather than a synthetic browser test.
- **UI gap**: the specification describes a browser action, but the current UI does not expose a
  working path that can be automated.

## Traceability Matrix

| UC    | Use Case                                       | Coverage     | Playwright test or gap                                                                                                    |
| ----- | ---------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| UC-01 | Register                                       | Automated UI | `use-cases/auth.spec.ts`, `public-pages.spec.ts` — validation, success transition, duplicate email                        |
| UC-02 | Verify Registration OTP                        | Automated UI | `use-cases/auth.spec.ts` — invalid and valid OTP                                                                          |
| UC-03 | Login                                          | Automated UI | `public-pages.spec.ts` — all role redirects and invalid credentials                                                       |
| UC-04 | Authenticate with Google                       | Automated UI | `use-cases/auth.spec.ts` — login and registration entry points                                                            |
| UC-05 | Refresh Session                                | No UI        | Token-rotation endpoint has no dedicated screen or implemented browser refresh workflow                                   |
| UC-06 | Logout                                         | Automated UI | `access-control.spec.ts` — clears session and redirects                                                                   |
| UC-07 | Reset Password                                 | Automated UI | `public-pages.spec.ts` — request, mismatch validation, successful reset                                                   |
| UC-08 | View and Update Own Profile                    | Automated UI | `use-cases/candidate.spec.ts` — profile fields and visibility payload                                                     |
| UC-09 | Connect Google Calendar / Create Meet          | Automated UI | `use-cases/hr.spec.ts` — Meet creation and attendee/reminder payload                                                      |
| UC-10 | Manage Users and Roles                         | Automated UI | `use-cases/admin.spec.ts` — create user with role and department                                                          |
| UC-11 | Check Email Availability                       | Automated UI | `use-cases/auth.spec.ts`, `use-cases/admin.spec.ts` — available and duplicate email                                       |
| UC-12 | Manage Organizations                           | Automated UI | `use-cases/admin.spec.ts` — organization profile update                                                                   |
| UC-13 | Configure Organization Settings                | Automated UI | `use-cases/admin.spec.ts` — workflow/settings persistence                                                                 |
| UC-14 | Manage Departments                             | Automated UI | `use-cases/admin.spec.ts` — department and requirement creation                                                           |
| UC-15 | Manage Department Team                         | Automated UI | `use-cases/department-head.spec.ts` — validation and member creation                                                      |
| UC-16 | Create Recruitment Request                     | Automated UI | `use-cases/department-head.spec.ts` — required fields and draft creation                                                  |
| UC-17 | Update Recruitment Request                     | Automated UI | Department Head and HR update paths in both role specs                                                                    |
| UC-18 | Submit Recruitment Request                     | Automated UI | `use-cases/department-head.spec.ts` — validation and submit transition                                                    |
| UC-19 | Assign HR to Recruitment Request               | Automated UI | `use-cases/hr.spec.ts` — claim/assignment payload                                                                         |
| UC-20 | Return Recruitment Request for Revision        | Automated UI | `use-cases/hr.spec.ts` — reason and return transition                                                                     |
| UC-21 | Request Changes from HR                        | UI gap       | Admin UI only exposes `Reject Request` through `/decision`, not the specified `/request-changes` flow                     |
| UC-22 | Forward Recruitment Request to Admin           | Automated UI | `use-cases/hr.spec.ts` — forward transition                                                                               |
| UC-23 | Approve or Reject Recruitment Request          | Automated UI | `use-cases/admin.spec.ts` — approval decision payload                                                                     |
| UC-24 | View Recruitment Request Tracking              | Automated UI | `use-cases/department-head.spec.ts` — scoped request details                                                              |
| UC-25 | Create Overall Recruitment Plan                | Automated UI | `use-cases/hr.spec.ts` — draft plan creation                                                                              |
| UC-26 | Submit / Resubmit Overall Plan                 | Automated UI | `use-cases/hr.spec.ts` — complete-plan submission                                                                         |
| UC-27 | Approve or Reject Overall Plan                 | Automated UI | `use-cases/admin.spec.ts` — required rejection reason                                                                     |
| UC-28 | Start Recruitment Campaign                     | Automated UI | `use-cases/hr.spec.ts` — campaign start from approved plan                                                                |
| UC-29 | Update Task Plan                               | Automated UI | `use-cases/hr.spec.ts` — duration update                                                                                  |
| UC-30 | Assign Task to HR Member                       | Automated UI | `use-cases/hr.spec.ts` — assignee selection and payload                                                                   |
| UC-31 | Update Task Status                             | Automated UI | `use-cases/hr.spec.ts` — mark assigned task complete                                                                      |
| UC-32 | Manage Roles / Job Descriptions                | No UI        | CRUD endpoints have no dedicated web screen                                                                               |
| UC-33 | Manage Job Postings and Media                  | Automated UI | `use-cases/hr.spec.ts` — edit, save, and publish posting                                                                  |
| UC-34 | Browse Public Jobs                             | Automated UI | `use-cases/candidate.spec.ts` — public job discovery                                                                      |
| UC-35 | Submit and Manage Applications                 | Automated UI | `use-cases/candidate.spec.ts` — application submission                                                                    |
| UC-36 | Manage Invites                                 | No UI        | Generic invite endpoints have no dedicated web workflow                                                                   |
| UC-37 | Trigger and View Evaluations                   | No UI        | Evaluation-run endpoints are not wired to a screen                                                                        |
| UC-38 | Manage Candidate Profile and Avatar            | Automated UI | `use-cases/candidate.spec.ts` — profile update, recruiter visibility, and avatar upload/editor                            |
| UC-39 | Upload and Manage Candidate CV                 | Automated UI | `use-cases/candidate.spec.ts` — unsupported file and successful parsed upload                                             |
| UC-40 | View Latest Candidate CV                       | Automated UI | `use-cases/hr.spec.ts` — authorized latest-CV file request from search results                                            |
| UC-41 | Parse CV and Generate Embeddings               | No UI        | Asynchronous worker/AI pipeline; verify with worker and AI package tests                                                  |
| UC-42 | Search and Screen CV                           | Automated UI | `use-cases/hr.spec.ts` — query, filters, evidence, and shortlist                                                          |
| UC-43 | Record Talent Search Feedback                  | Automated UI | `use-cases/hr.spec.ts` — user actions emit feedback/screening decisions                                                   |
| UC-44 | Expand Talent Query / Export Feedback Triplets | Partial UI   | Expanded query terms are asserted; feedback-triplet export has no UI control                                              |
| UC-45 | Upload and View Documents / Evidence           | Partial UI   | Candidate CV document upload is covered; generic document/evidence screens are absent                                     |
| UC-46 | Schedule Interview                             | Automated UI | `use-cases/hr.spec.ts` — panel, date/time, Meet, and invitation payload                                                   |
| UC-47 | Candidate Interview Response                   | Automated UI | `use-cases/candidate.spec.ts` — confirm, reschedule, cancel, required reasons                                             |
| UC-48 | Reschedule or Cancel Interview                 | UI gap       | Existing HR schedule selection disables dispatch before the internal reschedule branch can run; Admin cancel UI is absent |
| UC-49 | Send Invitations and View Email Logs           | Partial UI   | Initial invitation dispatch is covered; email-log audit has no visible UI                                                 |
| UC-50 | View Completed Interviews and Details          | Automated UI | `use-cases/hr.spec.ts` — completed result detail                                                                          |
| UC-51 | Record Panel Feedback                          | Automated UI | HR and Department Head feedback paths in both role specs                                                                  |
| UC-52 | Record HR Result / Recommendation              | Automated UI | `use-cases/hr.spec.ts` — feedback and final recommendation                                                                |
| UC-53 | Admin Review of Interview Result               | Automated UI | `use-cases/admin.spec.ts` — panel evidence and request-more-info flow                                                     |
| UC-54 | Final Hiring Decision                          | Automated UI | `use-cases/admin.spec.ts` — request information and hire decision                                                         |
| UC-55 | Create and Send Offer                          | Automated UI | `use-cases/admin.spec.ts` — compensation/start date and offer queue                                                       |
| UC-56 | Candidate Responds to Offer                    | Automated UI | `use-cases/candidate.spec.ts` — accept and reason-required decline                                                        |
| UC-57 | View and Manage Notifications                  | Automated UI | `use-cases/candidate.spec.ts` — read, unread, and archive                                                                 |
| UC-58 | View Dashboards                                | Automated UI | `role-pages.spec.ts`, `access-control.spec.ts` — all four role dashboards and redirects                                   |
| UC-59 | View Reports and Export Annual Report          | Partial UI   | `use-cases/admin.spec.ts` covers year filter/PDF export; Admin/HR report pages have route smoke coverage                  |
| UC-60 | Access Protected Route / API                   | Automated UI | `access-control.spec.ts` — anonymous redirect, role mismatch, role home routing                                           |
| UC-61 | Monitor System Health                          | No UI        | Health endpoint is an infrastructure/API concern with no browser screen                                                   |

## Commands

Run the stateful Use Case workflows:

```bash
npm run test:ui:e2e:use-cases
```

Run all desktop UI checks, including route health, authorization, public pages, and Use Cases:

```bash
npm run test:ui:e2e:desktop
```

The current browser scope is 49 fully automated Use Cases, 4 partially automated Use Cases, 6
non-UI Use Cases, and 2 confirmed UI implementation gaps. API/worker-only coverage should be added
to the relevant service test suites rather than being represented as skipped Playwright tests.
