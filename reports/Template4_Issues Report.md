# RMS Issues Report

Document ID: `REP-04`  
Baseline: 2026-07-15  
Repository: https://github.com/vvtPhongdev/SE20A05Group7RMS

Related documents: [Report index](./README.md) · [Project tracking](./Template1_Project%20Tracking.md) · [Final release](./Template5_Final%20Release%20Document.md)

## 1. Status summary

| Category                          | Count | Release interpretation                                                                                                                        |
| --------------------------------- | ----: | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Open GitHub issues                |     0 | GitHub API and repository tracker rechecked on 2026-07-15                                                                                     |
| Issues bulk-closed as `completed` |     7 | #186, #213, #214, #215, #223, #224 and #227 were closed by `vvtPhongdev` at 2026-07-15 15:23 UTC                                              |
| Code-backed closures              |     2 | #224 logging/correlation and #227 Gateway hardening have direct implementation evidence                                                       |
| Partially verified closures       |     2 | #213 has an executable role-lifecycle script; #223 has worker guards/tests, but neither was executed end-to-end during documentation QA       |
| Closure-evidence gaps             |     3 | #214 full auth E2E, #215 full CV-pipeline E2E and #186 GitHub Actions workflow are not represented by complete artifacts in the reviewed tree |

The authoritative live state is the repository issue tracker. Issue state and release evidence are deliberately separate: closing an issue records workflow state, while the evidence review below determines whether a production claim is supportable.

## 2. Recently closed release-gate review

| Issue                                                              | GitHub state       | Closure evidence found in reviewed tree                                                                                                | Documentation verdict                                                   |
| ------------------------------------------------------------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [#227](https://github.com/vvtPhongdev/SE20A05Group7RMS/issues/227) | Closed `completed` | Gateway enables configured CORS, `helmet()` and `ThrottlerGuard`                                                                       | Code-backed; runtime policy verification still belongs in release QA    |
| [#224](https://github.com/vvtPhongdev/SE20A05Group7RMS/issues/224) | Closed `completed` | `@wr/logger` provides Pino logging, correlation middleware, TCP propagation and BullMQ patching                                        | Code-backed; cross-service trace exercise is recommended                |
| [#223](https://github.com/vvtPhongdev/SE20A05Group7RMS/issues/223) | Closed `completed` | CV parse/email skip completed work; reminders/email use stable job IDs; all 13 worker unit tests passed during documentation QA        | Partially verified; retry/concurrency scenario was not run in this task |
| [#215](https://github.com/vvtPhongdev/SE20A05Group7RMS/issues/215) | Closed `completed` | `scripts/e2e-role-flow.mjs` uploads a CV but does not assert the complete parse -> embed -> search chain                               | Closure-evidence gap                                                    |
| [#214](https://github.com/vvtPhongdev/SE20A05Group7RMS/issues/214) | Closed `completed` | Role-flow script proves login only; auth unit specs exist, but no register/login/refresh/logout E2E artifact was found                 | Closure-evidence gap                                                    |
| [#213](https://github.com/vvtPhongdev/SE20A05Group7RMS/issues/213) | Closed `completed` | `scripts/e2e-role-flow.mjs` covers request -> approval -> plan -> posting -> CV/application -> interview -> decision -> offer response | Script present; environment-backed execution is still required          |
| [#186](https://github.com/vvtPhongdev/SE20A05Group7RMS/issues/186) | Closed `completed` | No `.github/workflows` directory was found                                                                                             | Closure-evidence gap                                                    |

## 3. Selected closed release evidence

| Issue                                                              | Title                                                        | State  | Closed     | Mapped capability          |
| ------------------------------------------------------------------ | ------------------------------------------------------------ | ------ | ---------- | -------------------------- |
| [#228](https://github.com/vvtPhongdev/SE20A05Group7RMS/issues/228) | Accessibility audit - keyboard and color-independent status  | Closed | 2026-06-11 | NFR-07, role screens       |
| [#226](https://github.com/vvtPhongdev/SE20A05Group7RMS/issues/226) | Auto-trigger interview invitation email on schedule creation | Closed | 2026-06-10 | FR-13, FR-16, UC-49        |
| [#225](https://github.com/vvtPhongdev/SE20A05Group7RMS/issues/225) | Extend audit logging to plans, interviews and CV screening   | Closed | 2026-06-10 | NFR-03, `AuditLog`         |
| [#222](https://github.com/vvtPhongdev/SE20A05Group7RMS/issues/222) | Health check endpoints for all microservices                 | Closed | 2026-06-11 | UC-61, NFR-06              |
| [#221](https://github.com/vvtPhongdev/SE20A05Group7RMS/issues/221) | Global exception filter and standardized error responses     | Closed | 2026-06-10 | NFR-01/NFR-05              |
| [#220](https://github.com/vvtPhongdev/SE20A05Group7RMS/issues/220) | Database seed script - required fixture set                  | Closed | 2026-06-17 | Installation and test data |
| [#219](https://github.com/vvtPhongdev/SE20A05Group7RMS/issues/219) | Create `packages/config` validated environment schemas       | Closed | 2026-06-11 | Configuration validation   |
| [#218](https://github.com/vvtPhongdev/SE20A05Group7RMS/issues/218) | Email templates - invitation, offer, rejection               | Closed | 2026-06-10 | FR-16..18                  |
| [#217](https://github.com/vvtPhongdev/SE20A05Group7RMS/issues/217) | OfferLetterService - generation, review and send             | Closed | 2026-06-09 | FR-17, UC-55/56            |

## 4. Documentation and environment gaps

These are controlled report gaps, not GitHub issue numbers.

| Gap ID | Description                                                                 | State                      | Resolution / owner                                                                      |
| ------ | --------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------- |
| DOC-01 | Older docs use `HR_MANAGER`/`HR_RECRUITER`; implementation uses `HR_LEADER` | Resolved in report set     | MAP-01 terminology table; update legacy docs when touched                               |
| DOC-02 | Official lecturer, legal names and four student codes are absent from Git   | External input required    | Group lead copies class-roster values before submission                                 |
| DOC-03 | Original AI prompt/response screenshots are not stored in repository        | External evidence required | Each member uploads their own course evidence                                           |
| ENV-01 | Deployed web/API URL is not recorded                                        | Open                       | Replace localhost placeholders after deployment                                         |
| ENV-02 | Provider secrets are environment controlled                                 | Expected                   | Configure Supabase, Google, SMTP and optional Gemini without committing secrets         |
| QA-01  | PlantUML and Excalidraw sources require render validation after edits       | Complete                   | Eight PUML previews and the reviewed Excalidraw PNG are stored under `reports/diagrams` |

## 5. Risk matrix

| Risk                                    | Likelihood | Impact   | Related closure | Mitigation / exit criterion                                                            |
| --------------------------------------- | ---------- | -------- | --------------- | -------------------------------------------------------------------------------------- |
| Full workflow regression                | Medium     | Critical | #213            | Run the role lifecycle script against a clean seeded environment and retain its output |
| Auth/session regression                 | Medium     | High     | #214            | Add and pass register/login/refresh/logout/provider E2E                                |
| CV pipeline breakage                    | Medium     | High     | #215            | Add and pass upload/replace/parse/embed/search E2E with supported files                |
| Duplicate queue side effects            | Medium     | High     | #223            | Run retry and concurrency tests for every worker side effect                           |
| Hard-to-diagnose cross-service failures | Low        | High     | #224            | Exercise one correlation ID from Gateway through TCP and queue logs                    |
| API abuse/security headers              | Low        | High     | #227            | Verify deployed CORS, Helmet headers and route-appropriate rate limits                 |
| Uncontrolled release quality            | High       | High     | #186            | Add CI that runs format, lint, typecheck, build and tests on pull requests             |
| Documentation drift                     | Medium     | Medium   | DOC-01          | Update MAP-01 and affected reports in the same change as code/schema                   |

## 6. Release decision rule

`1.0-RC1` may be demonstrated in a controlled development environment. Although the seven tracked issues are now closed on GitHub, this report does not promote the build to production-ready until the closure-evidence gaps above are either verified in a clean environment or explicitly risk-accepted by the project owner.
