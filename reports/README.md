# RMS Report Set

Document set: Recruitment Workflow Management System (RMS)  
Group: SE20A05 Group 7  
Baseline: `main` at `9393a9d`, including the working-tree implementation available on 2026-07-15  
Release label: `1.0-RC1`

## Purpose

This directory is the submission-oriented view of the project. It turns the original Word and Excel templates into a consistent Markdown document set. Every requirement, use case, screen, API, service, database entity, issue, and release instruction is connected through stable identifiers.

The source hierarchy used to resolve conflicts is:

1. Current implementation in `packages/`, `services/`, and `webapp/`.
2. Current Prisma schema and shared contract enums.
3. `docs/backend-endpoints-summary.md` and `docs/use-case-specifications.md`.
4. `docs/`, `PROJECT_OVERVIEW/`, `project-context.md`, and root `README.md`.
5. The original report templates and historical planning text.

When an older document uses `HR_MANAGER` or `HR_RECRUITER`, this report set maps it to the implemented role `HR_LEADER`.

## Documents

| ID     | Document                                                              | Purpose                                                     | Primary mappings                          |
| ------ | --------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------- |
| REP-00 | [AI Usage Report](./Template0__SWP391_AI_Usage_Report_%20Template.md) | AI-assisted activities, validation and evidence             | Team workstreams, Git evidence            |
| REP-01 | [Project Tracking](./Template1_Project%20Tracking.md)                 | Product functions, ownership, iteration and status          | Screens, FR, UC, SDS sections             |
| REP-02 | [Requirement and Design Specification](./Template2_RDS%20Document.md) | Actors, requirements, use cases, screens and business rules | FR-01..FR-22, UC-01..UC-61                |
| REP-03 | [Software Design Specification](./Template3_SDS%20Document.md)        | Packages, classes, sequences, data and deployment design    | API, TCP patterns, classes, Prisma models |
| REP-04 | [Issues Report](./Template4_Issues%20Report.md)                       | Issue closure evidence and residual release risks           | GitHub issues, release gates              |
| REP-05 | [Final Release Document](./Template5_Final%20Release%20Document.md)   | Deliverables, setup, operations and user manual             | Screen URLs, workflows, limitations       |
| MAP-01 | [Traceability Matrix](./TRACEABILITY.md)                              | Cross-document source of truth                              | FR -> UC -> screen -> API -> code -> data |
| MAP-02 | [Screen URL Registry](./screens.md)                                   | Web placeholders for all implemented routes                 | `webapp/src/App.tsx`                      |

## Diagram sources

PlantUML files are source diagrams that can be opened by PlantUML or inserted into draw.io through **Arrange -> Insert -> Advanced -> PlantUML**.

| Diagram                     | Source                                                                          | Covers                                              |
| --------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------- |
| System use cases            | [system-use-cases.puml](./diagrams/system-use-cases.puml)                       | Actors and core system capabilities                 |
| Workflow state machine      | [recruitment-state-machine.puml](./diagrams/recruitment-state-machine.puml)     | Recruitment request lifecycle                       |
| Domain model                | [domain-class-diagram.puml](./diagrams/domain-class-diagram.puml)               | Current Prisma model relationships                  |
| Package architecture        | [package-architecture.puml](./diagrams/package-architecture.puml)               | Web, Gateway, services, packages and infrastructure |
| Request approval sequence   | [sequence-request-approval.puml](./diagrams/sequence-request-approval.puml)     | Department Head -> HR -> Admin approval             |
| Plan and interview sequence | [sequence-plan-and-interview.puml](./diagrams/sequence-plan-and-interview.puml) | Plan-lock, scheduling, panel and invitations        |
| Hiring and offer sequence   | [sequence-hiring-offer.puml](./diagrams/sequence-hiring-offer.puml)             | Feedback, decision, offer and response              |
| Deployment                  | [deployment.puml](./diagrams/deployment.puml)                                   | Runtime nodes and transports                        |
| Document mapping argument   | [rms-document-map.excalidraw](./diagrams/rms-document-map.excalidraw)           | Evidence convergence and report fan-out             |

The existing detailed role-based screen flow remains in [`docs/screen-flow.puml`](../docs/screen-flow.puml).

## Five-member workstream model

The repository does not contain an official class roster. To avoid inventing student IDs or legal names, ownership uses the five primary Git identities found in project history. The lecturer and official student codes must be copied from the class roster before institutional submission.

| Workstream | Git identity    | Responsibility used in reports                                      | Evidence summary                                            |
| ---------- | --------------- | ------------------------------------------------------------------- | ----------------------------------------------------------- |
| WS-1       | `vvtPhongdev`   | Lead integration, backend workflow, CV/AI and interview integration | [Output](../outputs/01-vvtPhongdev-platform-integration.md) |
| WS-2       | `dungnt585`     | Role dashboards, Department Head and Candidate UI                   | [Output](../outputs/02-dungnt585-ui-dashboard.md)           |
| WS-3       | `duyhieu141`    | Quality, auth/recruitment flow alignment, screen-flow documentation | [Output](../outputs/03-duyhieu141-quality-docs.md)          |
| WS-4       | `LyHD-DE190075` | Integration, talent search, job posting and calendar flows          | [Output](../outputs/04-LyHD-DE190075-integration-search.md) |
| WS-5       | `hhNamdev`      | Workflow contracts, unified HR role, reminders and final pipeline   | [Output](../outputs/05-hhNamdev-workflow-contracts.md)      |

This allocation is a documentation ownership model reconstructed from Git history; it is not a substitute for the official contribution assessment.

## Traceability conventions

- `FR-xx`: functional requirement from `docs/FeatureRequired.md`.
- `UC-xx`: system use case from `docs/use-case-specifications.md`.
- `SCR-ROLE-xx`: screen or route placeholder in `screens.md`.
- `API-<domain>`: Gateway HTTP endpoint group.
- `SVC-<domain>`: implementation service or controller.
- `DB-<model>`: Prisma model/table.
- `ISS-<number>`: GitHub issue.
- `REP-xx`: report document.

No diagram image is treated as a source of truth. The editable `.puml` or `.excalidraw` file is authoritative; rendered images are derived artifacts.
Validated PNG previews are stored in `reports/diagrams/rendered/`; the reviewed document-map preview is `reports/diagrams/rms-document-map.png`.

## Current release position

The functional product is documented as release candidate `1.0-RC1`, not as an unconditional production release. GitHub currently reports zero open issues; seven former release-gate issues were bulk-closed as `completed` on 2026-07-15. REP-04 separates that tracker state from implementation evidence: logging and Gateway hardening are code-backed, while full auth/CV E2E coverage and a GitHub Actions workflow still lack complete artifacts in the reviewed tree.

## Documentation QA evidence

- All 22 FR rows have seven traceability columns and map to the 61-UC catalog.
- All local Markdown links and contiguous Markdown table structures pass validation.
- All eight PlantUML sources compile to PNG with PlantUML 1.2026.6; key use-case, domain and sequence previews were visually reviewed.
- The 63-element Excalidraw source passed JSON validation and a repeated render-view-fix review.
- `npm run typecheck` passed all 25 Turborepo tasks across the 18-package scope.
- Worker Jest validation passed 4 suites / 13 tests.
- Environment-backed role lifecycle and UI smoke scripts were not executed because a seeded running stack and role credentials were outside this documentation task.
