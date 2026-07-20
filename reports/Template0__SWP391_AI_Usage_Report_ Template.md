# SWP391 Project AI Usage Report

Document ID: `REP-00`  
Project: Recruitment Workflow Management System (RMS)  
Class: SE20A05  
Semester: Summer 2026 (`SU26`)  
Group: 7  
Baseline date: 2026-07-15

Related documents: [Report index](./README.md) · [Project tracking](./Template1_Project%20Tracking.md) · [Traceability](./TRACEABILITY.md)

## 1. Administrative information

| Field         | Value                                                       |
| ------------- | ----------------------------------------------------------- |
| Subject code  | SWP391                                                      |
| Subject name  | Software Development Project                                |
| Class code    | SE20A05                                                     |
| Semester      | Summer 2026                                                 |
| Group code    | Group 7                                                     |
| Project title | Recruitment Workflow Management System                      |
| Lecturer      | Controlled class-roster value; not stored in the repository |
| Repository    | https://github.com/vvtPhongdev/SE20A05Group7RMS             |

## 2. Five-member register

The repository contains no official roster. The table therefore uses the five primary Git identities and does not invent legal names or student codes. Replace roster-controlled fields before institutional submission.

| No. | Student code | Repository identity | Project role                 | AI-assisted areas                                                     | Output evidence                                           |
| --- | ------------ | ------------------- | ---------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | Not stored   | `vvtPhongdev`       | Technical lead / integration | Architecture synthesis, backend integration, CV/AI and interview flow | [WS-1](../outputs/01-vvtPhongdev-platform-integration.md) |
| 2   | Not stored   | `dungnt585`         | Frontend / UI                | Dashboard, Department Head and Candidate flows, API connection        | [WS-2](../outputs/02-dungnt585-ui-dashboard.md)           |
| 3   | Not stored   | `duyhieu141`        | Quality / documentation      | Auth and request alignment, screen flows, test preparation            | [WS-3](../outputs/03-duyhieu141-quality-docs.md)          |
| 4   | DE190075     | `LyHD-DE190075`     | Integration / search         | Talent search, public posting, calendar and pipeline integration      | [WS-4](../outputs/04-LyHD-DE190075-integration-search.md) |
| 5   | Not stored   | `hhNamdev`          | Workflow / contracts         | Unified HR role, transition rules, reminders and completion           | [WS-5](../outputs/05-hhNamdev-workflow-contracts.md)      |

## 3. AI governance

1. AI is used as a development assistant for requirement comparison, code navigation, draft generation, test ideas and document structure.
2. AI output is never accepted as authoritative without checking current code, tests, API contracts, schema and Git history.
3. Product AI is limited to CV extraction, embeddings and search support. It does not make hiring decisions.
4. Personal data, passwords, tokens, private CVs and production secrets must not be copied into external AI prompts.
5. Generated code or documentation must be reviewed for role authorization, workflow state, plan-lock, audit logs and notification side effects.
6. The evidence links below prove resulting repository output. Original prompt/response screenshots remain a separate course-controlled evidence artifact and must be attached by the students who own those sessions.

## 4. Iteration 1 - Foundation and requirements (2026-05-24 to 2026-05-31)

| No. | Owner | SDLC phase    | Task / activity                                                      | AI tool        | AI output                                    | Student validation / modification                               | Evidence                                                                                                  | Quantitative measure           | Value | Risk observed                                                  |
| --- | ----- | ------------- | -------------------------------------------------------------------- | -------------- | -------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------ | ----- | -------------------------------------------------------------- |
| 1   | WS-1  | Analysis      | Compare the initial marketplace codebase with the RMS workflow pivot | ChatGPT/Codex  | Candidate domain map and migration checklist | Removed scoring-led assumptions; retained CV utility only       | [Project context](../project-context.md)                                                                  | 12 critical architecture rules | 5     | Older terminology was mixed with target scope                  |
| 2   | WS-2  | UX analysis   | Derive role dashboards and request screens                           | GitHub Copilot | Screen/component checklist                   | Matched screens to four actors and real routes                  | [Frontend commits](https://github.com/vvtPhongdev/SE20A05Group7RMS/commits/main/?author=dungnt585)        | 4 role areas                   | 4     | Generated UI suggestions did not enforce backend authorization |
| 3   | WS-3  | Requirements  | Break requirements into implementation and verification tasks        | ChatGPT/Codex  | Use-case and task candidates                 | Mapped candidates to canonical task IDs and acceptance criteria | [Use cases](../docs/use-case-specifications.md)                                                           | 61 use cases catalogued        | 5     | Duplicate and legacy use cases required consolidation          |
| 4   | WS-4  | Design        | Review authentication, search and integration choices                | GitHub Copilot | Integration alternatives                     | Selected Gateway/TCP boundaries and current provider flows      | [Integration commits](https://github.com/vvtPhongdev/SE20A05Group7RMS/commits/main/?author=LyHD-DE190075) | 4 integration domains          | 4     | Provider setup can differ by environment                       |
| 5   | WS-5  | Domain design | Normalize workflow roles and lifecycle                               | ChatGPT/Codex  | Draft role/state model                       | Reconciled against shared enums and service guards              | [Workflow output](../outputs/05-hhNamdev-workflow-contracts.md)                                           | 4 roles, extended lifecycle    | 5     | Historical documents still used `HR_MANAGER`/`HR_RECRUITER`    |

## 5. Iteration 2 - Core workflow and role UI (2026-06-01 to 2026-06-16)

| No. | Owner | SDLC phase     | Task / activity                                         | AI tool        | AI output                                                 | Student validation / modification                                        | Evidence                                                                                                  | Quantitative measure | Value | Risk observed                                          |
| --- | ----- | -------------- | ------------------------------------------------------- | -------------- | --------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | -------------------- | ----- | ------------------------------------------------------ |
| 1   | WS-1  | Implementation | Integrate request, plan, task and Gateway flows         | GitHub Copilot | Controller/service scaffolding and error-path suggestions | Enforced ownership, state transitions and `RequestLog` writes            | [Lead commits](https://github.com/vvtPhongdev/SE20A05Group7RMS/commits/main/?author=vvtPhongdev)          | 3 workflow modules   | 4     | Generated happy paths could omit audit side effects    |
| 2   | WS-2  | Implementation | Connect Admin, Department Head and Candidate dashboards | GitHub Copilot | React data-loading and component drafts                   | Added role-specific error/empty/loading states and real API calls        | [UI commits](https://github.com/vvtPhongdev/SE20A05Group7RMS/commits/main/?author=dungnt585)              | 10+ screens          | 4     | UI-only guards are not security controls               |
| 3   | WS-3  | Quality        | Align frontend request actions with allowed states      | Codex          | State/action comparison                                   | Removed invalid actions and documented route/state mapping               | [Quality commits](https://github.com/vvtPhongdev/SE20A05Group7RMS/commits/main/?author=duyhieu141)        | 5 request actions    | 5     | Stale status values existed in multiple layers         |
| 4   | WS-4  | Implementation | Integrate identity and public job-posting flows         | GitHub Copilot | DTO and UI wiring drafts                                  | Matched current Gateway endpoints and role guards                        | [Integration commits](https://github.com/vvtPhongdev/SE20A05Group7RMS/commits/main/?author=LyHD-DE190075) | Auth + posting flows | 4     | Provider errors need environment-specific handling     |
| 5   | WS-5  | Implementation | Implement workflow rules and task reminder guards       | Codex          | Validation and edge-case checklist                        | Added approved-plan checks, deadline checks and idempotent reminder keys | [Workflow commits](https://github.com/vvtPhongdev/SE20A05Group7RMS/commits/main/?author=hhNamdev)         | 2 reminder windows   | 5     | Retries can duplicate side effects without idempotency |

## 6. Iteration 3 - CV, interviews and communications (2026-06-17 to 2026-07-05)

| No. | Owner | SDLC phase            | Task / activity                                       | AI tool              | AI output                      | Student validation / modification                                         | Evidence                                                                                             | Quantitative measure           | Value | Risk observed                                         |
| --- | ----- | --------------------- | ----------------------------------------------------- | -------------------- | ------------------------------ | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------ | ----- | ----------------------------------------------------- |
| 1   | WS-1  | Implementation        | Improve CV storage, parsing and interview integration | Codex/GitHub Copilot | Pipeline and validation drafts | Checked file type/size, rollback, plan-lock, panel and notification paths | [Lead commits](https://github.com/vvtPhongdev/SE20A05Group7RMS/commits/main/?author=vvtPhongdev)     | PDF/DOC/DOCX; 384-d vectors    | 5     | Native/file-provider behavior differs across machines |
| 2   | WS-2  | UI testing            | Connect interview and candidate experience            | GitHub Copilot       | Form and state suggestions     | Validated route ownership and API response shape                          | [UI commits](https://github.com/vvtPhongdev/SE20A05Group7RMS/commits/main/?author=dungnt585)         | Candidate + panel screens      | 4     | Date/time-zone display can drift                      |
| 3   | WS-3  | Integration testing   | Replace CV and shortlist workflow                     | Codex                | Regression checklist           | Added cleanup/rollback and verified shortlist state                       | [Quality commits](https://github.com/vvtPhongdev/SE20A05Group7RMS/commits/main/?author=duyhieu141)   | 3 CV mutations                 | 5     | Replacement can orphan storage without rollback       |
| 4   | WS-4  | Search implementation | Improve vector/hybrid candidate search                | GitHub Copilot       | Search query/ranking draft     | Kept human review, logged runs/feedback, avoided autonomous decisions     | [Search commits](https://github.com/vvtPhongdev/SE20A05Group7RMS/commits/main/?author=LyHD-DE190075) | Search run + feedback entities | 5     | Similarity is relevance support, not hiring fitness   |
| 5   | WS-5  | Workflow integration  | Unify HR role and interview feedback permissions      | Codex                | Role-impact analysis           | Updated guards/contracts and preserved invited panel access               | [Workflow commits](https://github.com/vvtPhongdev/SE20A05Group7RMS/commits/main/?author=hhNamdev)    | 1 implemented HR role          | 5     | Older docs and records retain legacy role names       |

## 7. Iteration 4 - Stabilization, release and documentation (2026-07-06 to 2026-07-15)

| No. | Owner | SDLC phase            | Task / activity                                         | AI tool            | AI output                                       | Student validation / modification                                         | Evidence                                                                                                | Quantitative measure                            | Value | Risk observed                                                   |
| --- | ----- | --------------------- | ------------------------------------------------------- | ------------------ | ----------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ----- | --------------------------------------------------------------- |
| 1   | WS-1  | Stabilization         | Refine interview attendance and evaluation workflow     | Codex              | Edge-case and transaction review                | Verified invited evaluators, attendance and result ownership              | [Recent lead commits](https://github.com/vvtPhongdev/SE20A05Group7RMS/commits/main/?author=vvtPhongdev) | 3 evaluation dimensions                         | 5     | Feedback must remain attributable and immutable where required  |
| 2   | WS-2  | Release UX            | Verify route coverage for user manual                   | Codex              | Route-to-screen register                        | Compared all placeholders with `App.tsx`                                  | [Screen registry](./screens.md)                                                                         | 39 screen IDs / 40 route URLs                   | 5     | Placeholder URLs need deployed host replacement                 |
| 3   | WS-3  | Documentation         | Expand role-based screen flow and E2E preparation       | Codex              | PUML and test-flow drafts                       | Compared endpoints, roles and current components                          | [Screen-flow source](../docs/screen-flow.puml)                                                          | 4 role flows                                    | 5     | Lifecycle script exists; environment-backed run is not retained |
| 4   | WS-4  | Integration review    | Validate search/posting/calendar sections               | Codex              | Cross-document checklist                        | Mapped FR/UC/API/service/data consistently                                | [Traceability](./TRACEABILITY.md)                                                                       | 22 FR mappings                                  | 5     | Integration credentials are environment controlled              |
| 5   | WS-5  | Release documentation | Complete six reports and reconcile workflow terminology | Codex + MarkItDown | Markdown baseline, traceability and diagram set | Replaced template/sample content with code-backed facts and release gates | [Report set](./README.md)                                                                               | 6 reports, 8 PUML diagrams, 1 Excalidraw source | 5     | Personal roster and original AI-chat evidence are not in Git    |

## 8. Validation checklist

- [x] AI-derived requirements checked against current shared enums and Prisma schema.
- [x] Gateway routes and React routes used instead of invented endpoints/screens.
- [x] Plan-lock, audit logging and notification side effects represented in diagrams.
- [x] GitHub issue state and closure-evidence gaps remain visible in REP-04 and REP-05.
- [x] AI is not described as the final hiring decision-maker.
- [ ] Official lecturer name and missing student codes copied from the class roster.
- [ ] Original AI prompt/response screenshots uploaded using the course naming convention.
- [ ] Each member signs off the rows attributed to their workstream.
