# Works Reruiter — Documentation Index

**Last updated:** 2026-05-20  
**Repository type:** Turborepo monorepo (TypeScript)  
**Architecture:** NestJS Microservices + React SPA

---

## Quick Start

👉 **New developer?** Start with the [Development Guide](./development-guide.md)  
👉 **Understanding the codebase?** Start with the [Project Overview](./project-overview.md)

---

## Documentation Map

### 📋 Project Overview
- [Project Overview](./project-overview.md) — Executive summary, tech stack, repository structure
- [Source Tree Analysis](./source-tree-analysis.md) — Annotated directory tree with critical folders

### 🏗️ Architecture
- [Architecture](./architecture.md) — Architecture diagrams, ADRs, rules, security model
- [Data Models](./data-models.md) — All 20 Prisma models, JSONB fields, pgvector setup

### 🔌 API & Contracts
- [API Contracts](./api-contracts.md) — REST endpoints, TCP message patterns, BullMQ jobs

### 🧩 Components
- [Component Inventory](./component-inventory.md) — Service modules, packages, frontend components

### 🛠️ Development
- [Development Guide](./development-guide.md) — Setup, commands, ports, conventions, anti-patterns

---

## Planning Artifacts (BMAD)

Located in `_bmad-output/`:

### Product Planning
- [PRD](../_bmad-output/planning-artifacts/prds/prd-works-reruiter-2026-05-19/prd.md) — Product Requirements Document (final)
- [PRD Addendum](../_bmad-output/planning-artifacts/prds/prd-works-reruiter-2026-05-19/addendum.md) — Technical addendum
- [Product Brief](../_bmad-output/planning-artifacts/briefs/brief-works-reruiter-2026-05-19/brief.md) — Product brief
- [Project Context](../_bmad-output/project-context.md) — AI agent context (roles, rules, patterns)

### Architecture & Design
- [BMAD Architecture](../_bmad-output/planning-artifacts/architecture.md) — Detailed technical architecture
- [UX Design Spec](../_bmad-output/planning-artifacts/ux-design-specification.md) — UX design specification
- [Epics & Stories](../_bmad-output/planning-artifacts/epics.md) — 5 Epics, 30+ stories

### Implementation Tracking
- [Sprint Status](../_bmad-output/implementation-artifacts/sprint-status.yaml) — Sprint progress tracking
- [Readiness Report](../_bmad-output/planning-artifacts/implementation-readiness-report-2026-05-20.md) — Implementation readiness

### Story Files (Epic 1 — Enterprise Hiring Workflow)
| Story | Title |
|-------|-------|
| [1.1](../_bmad-output/implementation-artifacts/1-1-initialize-product-workspace-foundation.md) | Initialize Product Workspace Foundation |
| [1.2](../_bmad-output/implementation-artifacts/1-2-establish-shared-ui-design-system-foundation.md) | Establish Shared UI Design System Foundation |
| [1.3](../_bmad-output/implementation-artifacts/1-3-create-organization-and-department-structure.md) | Create Organization and Department Structure |
| [1.4](../_bmad-output/implementation-artifacts/1-4-configure-multi-level-approval-chain.md) | Configure Multi-Level Approval Chain |
| [1.5](../_bmad-output/implementation-artifacts/1-5-submit-hiring-request.md) | Submit Hiring Request |
| [1.6](../_bmad-output/implementation-artifacts/1-6-approve-reject-revise-hiring-request.md) | Approve/Reject/Revise Hiring Request |
| [1.7](../_bmad-output/implementation-artifacts/1-7-open-recruitment-from-approved-request.md) | Open Recruitment from Approved Request |
| [1.8](../_bmad-output/implementation-artifacts/1-8-create-role-from-jd-text.md) | Create Role from JD Text |
| [1.9](../_bmad-output/implementation-artifacts/1-9-enforce-supported-job-family-scope.md) | Enforce Supported Job Family Scope |
| [1.10](../_bmad-output/implementation-artifacts/1-10-extract-and-inspect-job-capability-model.md) | Extract and Inspect Job Capability Model |
| [1.11](../_bmad-output/implementation-artifacts/1-11-edit-and-approve-requirements-before-publishing.md) | Edit and Approve Requirements Before Publishing |
| [1.12](../_bmad-output/implementation-artifacts/1-12-publish-role-for-candidate-discovery.md) | Publish Role for Candidate Discovery |

### Story Files (Epic 2 — Candidate Profile & CV)
| Story | Title |
|-------|-------|
| [2.1](../_bmad-output/implementation-artifacts/2-1-create-candidate-owned-profile.md) | Create Candidate-Owned Profile |
| [2.2](../_bmad-output/implementation-artifacts/2-2-upload-or-paste-candidate-cv.md) | Upload or Paste Candidate CV |
| [2.3](../_bmad-output/implementation-artifacts/2-3-show-per-document-parsing-status.md) | Show Per-Document Parsing Status |
| [2.4](../_bmad-output/implementation-artifacts/2-4-extract-candidate-capability-evidence.md) | Extract Candidate Capability Evidence |
| [2.5](../_bmad-output/implementation-artifacts/2-5-review-profile-readiness-and-extracted-evidence.md) | Review Profile Readiness and Extracted Evidence |
| [2.6](../_bmad-output/implementation-artifacts/2-6-retry-or-replace-failed-cv-documents.md) | Retry or Replace Failed CV Documents |

---

## Legend

| Symbol | Meaning |
|--------|---------|
| 📋 | Overview / summary |
| 🏗️ | Architecture / design |
| 🔌 | API / integration |
| 🧩 | Components / modules |
| 🛠️ | Development / tooling |
