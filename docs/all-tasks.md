# Master Task List — Recruitment Workflow Management System

## Phase 0: Foundation

| ID    | Task                                                           | Depends On   | Status |
| ----- | -------------------------------------------------------------- | ------------ | ------ |
| T-001 | Verify monorepo workspace (all packages build + typecheck)     | —            | ⬜     |
| T-002 | Define domain enums in `@wr/contracts`                         | —            | ⬜     |
| T-003 | Create design tokens CSS (`packages/ui/src/styles/tokens.css`) | —            | ⬜     |
| T-004 | CSS reset + IBM Plex Sans/Mono font setup                      | T-003        | ⬜     |
| T-005 | Radix UI primitive wrappers (Button, Input, Badge, etc.)       | T-003, T-004 | ⬜     |
| T-006 | Docker Compose (PostgreSQL 16 pgvector + Redis 7)              | —            | ⬜     |
| T-007 | Prisma schema (all entities)                                   | T-002        | ⬜     |
| T-008 | Run `prisma migrate dev`                                       | T-006, T-007 | ⬜     |
| T-009 | pgvector extension + vector column migration (raw SQL)         | T-008        | ⬜     |
| T-010 | Seed initial data (org, departments, admin user)               | T-008        | ⬜     |

## Phase 1: Identity & Auth

| ID    | Task                                                                  | Depends On   | Status |
| ----- | --------------------------------------------------------------------- | ------------ | ------ |
| T-011 | Identity service scaffold (NestJS TCP :3010)                          | T-001        | ⬜     |
| T-012 | User registration handler                                             | T-011, T-007 | ⬜     |
| T-013 | Login handler (JWT + refresh token)                                   | T-011        | ⬜     |
| T-014 | Refresh token rotation                                                | T-013        | ⬜     |
| T-015 | Logout handler (clear Redis refresh token)                            | T-013        | ⬜     |
| T-016 | Forgot password (OTP via email)                                       | T-011        | ⬜     |
| T-017 | Reset password handler                                                | T-016        | ⬜     |
| T-018 | Gateway JwtAuthGuard + RolesGuard                                     | T-013        | ⬜     |
| T-019 | Gateway auth routes (register, login, refresh, logout, forgot, reset) | T-018        | ⬜     |
| T-020 | Organization + Department CRUD (Identity service)                     | T-011        | ⬜     |
| T-021 | User management routes (list, update role, activate/deactivate)       | T-018, T-020 | ⬜     |
| T-022 | Frontend: Login page                                                  | T-019        | ⬜     |
| T-023 | Frontend: Registration page                                           | T-019        | ⬜     |
| T-024 | Frontend: Auth context + token management                             | T-022        | ⬜     |
| T-025 | Frontend: Role-based route guards                                     | T-024        | ⬜     |

## Phase 2: Recruitment Request & Approval

| ID    | Task                                                        | Depends On   | Status |
| ----- | ----------------------------------------------------------- | ------------ | ------ |
| T-026 | Recruiting service scaffold (NestJS TCP :3011)              | T-001        | ⬜     |
| T-027 | Create RecruitmentRequest handler (DRAFT)                   | T-026, T-007 | ⬜     |
| T-028 | Submit request (DRAFT → PENDING_HR_REVIEW)                  | T-027        | ⬜     |
| T-029 | Forward to boss (PENDING_HR_REVIEW → PENDING_BOSS_APPROVAL) | T-028        | ⬜     |
| T-030 | Approve request (→ APPROVED)                                | T-029        | ⬜     |
| T-031 | Reject request (→ REJECTED, with reason)                    | T-029        | ⬜     |
| T-032 | RequestLog audit trail (auto-log on status change)          | T-027        | ⬜     |
| T-033 | Get request logs endpoint                                   | T-032        | ⬜     |
| T-034 | Gateway: Recruitment request routes                         | T-018, T-027 | ⬜     |
| T-035 | Frontend: Create request form (Trưởng PB)                   | T-034, T-025 | ⬜     |
| T-036 | Frontend: Request list (filtered by role)                   | T-034        | ⬜     |
| T-037 | Frontend: Request detail + status timeline                  | T-036        | ⬜     |
| T-038 | Frontend: Approve/Reject actions (Admin/Boss)               | T-037        | ⬜     |
| T-039 | Frontend: Tracking dashboard (Trưởng PB)                    | T-033, T-037 | ⬜     |

## Phase 3: Recruitment Planning

| ID    | Task                                                    | Depends On   | Status |
| ----- | ------------------------------------------------------- | ------------ | ------ |
| T-040 | Create OverallPlan handler                              | T-030        | ⬜     |
| T-041 | Create TaskPlan handler (add tasks to plan)             | T-040        | ⬜     |
| T-042 | Submit plan for approval (→ PLAN_PENDING_APPROVAL)      | T-040        | ⬜     |
| T-043 | Approve plan (→ ACTIVE) + unlock recruitment activities | T-042        | ⬜     |
| T-044 | Request plan revision (with notes)                      | T-042        | ⬜     |
| T-045 | Plan enforcement: block activities if plan not approved | T-043        | ⬜     |
| T-046 | Update task status (PENDING → IN_PROGRESS → COMPLETED)  | T-041        | ⬜     |
| T-047 | Gateway: Plan routes                                    | T-040        | ⬜     |
| T-048 | Frontend: Plan creation form (HR Manager)               | T-047, T-025 | ⬜     |
| T-049 | Frontend: Task assignment UI                            | T-048        | ⬜     |
| T-050 | Frontend: Plan review + approve (Admin/Boss)            | T-047        | ⬜     |

## Phase 4: Candidate & CV Management

| ID    | Task                                                   | Depends On   | Status |
| ----- | ------------------------------------------------------ | ------------ | ------ |
| T-051 | Profiles service scaffold (NestJS TCP :3012)           | T-001        | ⬜     |
| T-052 | Candidate profile CRUD                                 | T-051, T-007 | ⬜     |
| T-053 | CV upload endpoint (file storage)                      | T-052        | ⬜     |
| T-054 | BullMQ worker: CV text extraction (pdf-parse, mammoth) | T-053        | ⬜     |
| T-055 | BullMQ worker: Vector embedding generation             | T-054, T-009 | ⬜     |
| T-056 | Vector search endpoint (cosine similarity)             | T-055        | ⬜     |
| T-057 | Gateway: Candidate + CV routes                         | T-018, T-052 | ⬜     |
| T-058 | Frontend: CV upload form (Candidate)                   | T-057, T-025 | ⬜     |
| T-059 | Frontend: Candidate search (HR Manager, vector search) | T-056, T-057 | ⬜     |
| T-060 | Frontend: Candidate profile view                       | T-057        | ⬜     |

## Phase 5: Interview & Decision

| ID    | Task                                             | Depends On          | Status |
| ----- | ------------------------------------------------ | ------------------- | ------ |
| T-061 | Schedule interview handler                       | T-026, T-043        | ⬜     |
| T-062 | Get available time slots (interviewer calendar)  | T-061               | ⬜     |
| T-063 | Cancel / reschedule interview handlers           | T-061               | ⬜     |
| T-064 | Record interview result (PASS/FAIL)              | T-061               | ⬜     |
| T-065 | Final hiring decision (Admin/Boss)               | T-064               | ⬜     |
| T-066 | Notification service scaffold (NestJS TCP :3013) | T-001               | ⬜     |
| T-067 | Send interview invitation email                  | T-066, T-061        | ⬜     |
| T-068 | Send Offer Letter email                          | T-066, T-065        | ⬜     |
| T-069 | Send rejection email (with reason)               | T-066, T-065        | ⬜     |
| T-070 | In-app notification system                       | T-066               | ⬜     |
| T-071 | Gateway: Interview + Notification routes         | T-018, T-061, T-066 | ⬜     |
| T-072 | Frontend: Interview scheduling (HR Manager)      | T-071, T-025        | ⬜     |
| T-073 | Frontend: Interview calendar view                | T-072               | ⬜     |
| T-074 | Frontend: Record interview result                | T-072               | ⬜     |
| T-075 | Frontend: Hiring decision (Admin/Boss)           | T-071               | ⬜     |
| T-076 | Frontend: Notification center                    | T-070, T-071        | ⬜     |

## Phase 6: Reporting & Analytics

| ID    | Task                                           | Depends On   | Status |
| ----- | ---------------------------------------------- | ------------ | ------ |
| T-077 | Annual recruitment report endpoint             | T-026        | ⬜     |
| T-078 | Department-wise report endpoint                | T-077        | ⬜     |
| T-079 | Time-to-hire metrics endpoint                  | T-077        | ⬜     |
| T-080 | Pipeline overview endpoint                     | T-077        | ⬜     |
| T-081 | Gateway: Report routes                         | T-018, T-077 | ⬜     |
| T-082 | Frontend: Admin dashboard (strategic overview) | T-081        | ⬜     |
| T-083 | Frontend: HR Manager dashboard (pipeline)      | T-081        | ⬜     |
| T-084 | Frontend: Department Head dashboard (tracking) | T-039, T-081 | ⬜     |

---

## Dependency Graph

```
Phase 0 (Foundation) ─────────────────────────────────────────────┐
  └── T-006 (Docker) → T-008 (Migrate) → T-009 (pgvector)       │
  └── T-002 (Enums) → T-007 (Prisma) → T-008                    │
  └── T-003 (Tokens) → T-004 (Fonts) → T-005 (Primitives)       │
                                                                   │
Phase 1 (Identity) ←──────────────────────────────────────────────┘
  └── T-011 (Service) → T-013 (Login) → T-018 (Guards)
  └── T-019 (Routes) → T-022..T-025 (Frontend auth)

Phase 2 (Requests) ← Phase 1
  └── T-026 (Service) → T-027..T-031 (Request CRUD + workflow)
  └── T-034 (Routes) → T-035..T-039 (Frontend request UI)

Phase 3 (Planning) ← Phase 2
  └── T-040 (Plan) → T-043 (Approve) → T-045 (Enforce)
  └── T-047 (Routes) → T-048..T-050 (Frontend plan UI)

Phase 4 (Candidates) ← Phase 0 (pgvector)
  └── T-051 (Service) → T-054 (Parse) → T-055 (Embed) → T-056 (Search)
  └── T-057 (Routes) → T-058..T-060 (Frontend candidate UI)

Phase 5 (Interviews) ← Phase 2 + Phase 3 + Phase 4
  └── T-061 (Schedule) → T-064 (Result) → T-065 (Decision)
  └── T-066 (Notification) → T-067..T-070 (Emails + in-app)
  └── T-071 (Routes) → T-072..T-076 (Frontend interview UI)

Phase 6 (Reports) ← Phase 2 + Phase 5
  └── T-077..T-080 (Endpoints)
  └── T-081 (Routes) → T-082..T-084 (Frontend dashboards)
```

---

_Last updated: 2026-05-28_
