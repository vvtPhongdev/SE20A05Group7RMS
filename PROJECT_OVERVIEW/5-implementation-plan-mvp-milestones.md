# 5. Implementation Plan (MVP Milestones)

## Milestone 0: Foundation

- Monorepo workspace verification (all packages build + typecheck)
- Domain enums: `UserRole` (4 roles), `RecruitmentRequestStatus`, `PlanStatus`, `InterviewStatus`
- Design token system (`packages/ui/src/styles/tokens.css`)
- CSS reset + IBM Plex Sans/Mono fonts
- Radix UI primitive wrappers (Button, Input, Textarea, Select, Badge, StatusBadge, Tooltip, Dialog, Tabs, DropdownMenu, Separator, ScrollArea, Toast)
- Docker Compose (PostgreSQL 16 pgvector + Redis 7)
- Prisma schema + initial migration

## Milestone 1: Identity & Auth

- User registration with role selection (Department Head, HR Manager, Admin, Candidate)
- Login / logout with JWT + refresh token rotation
- Password reset flow (email OTP)
- Role-based guards (JwtAuthGuard, RolesGuard)
- Organization + Department structure management

## Milestone 2: Recruitment Request & Approval

- Trưởng Phòng Ban creates recruitment request (DRAFT → PENDING_APPROVAL)
- Phòng Tuyển Dụng receives and reviews request
- Phòng Tuyển Dụng forwards to Admin/Boss for approval
- Admin/Boss approves or rejects request
- Real-time notification to all stakeholders on status change
- Request tracking dashboard for Department Head

## Milestone 3: Recruitment Planning

- HR Manager creates **kế hoạch tổng thể** (overall plan: start date → end date)
- HR Manager creates **kế hoạch triển khai** (detailed task assignments):
  - Job posting assignment
  - CV collection & screening assignment
  - Interview coordination assignment
  - Expected timeline per position
- Admin/Boss reviews and approves plan before campaign activation
- Plan enforcement: recruitment activities locked until plan is approved
- Plan timeline enforcement: activities must fall within the overall plan dates

## Milestone 4: Candidate & CV Management

- Candidate uploads CV (PDF/DOCX) via standardized form
- BullMQ worker: CV parsing → structured data extraction
- BullMQ worker: Vector embedding generation (RMS custom ONNX embedding model)
- CV data stored as structured JSONB + vector embeddings in PostgreSQL
- HR uses Vector Search (semantic search) to find matching candidates
- Candidate profile management (view, update)

## Milestone 5: Interview & Decision

- Interview scheduling with calendar integration
- Smart interview scheduling — auto-suggest available time slots based on interviewer calendars
- Send interview invitation to Candidate (email notification)
- Send interview invitation + schedule to Department Head / Boss (for panel interviews)
- Record interview results (PASS / FAIL with notes)
- Admin/Boss reviews interview results for final hiring decision
- **If PASS:** Send Offer Letter with compensation details
- **If FAIL:** Send polite rejection email with appropriate reasons

## Milestone 6: Reporting & Analytics

- Annual recruitment report for Admin/Boss:
  - Total positions opened vs filled
  - Time-to-hire metrics
  - Department-wise hiring statistics
  - HR team performance analysis
  - Company growth rate analysis
- Real-time dashboards per role:
  - Department Head: request status + hire progress
  - HR Manager: pipeline overview + task progress
  - Admin/Boss: strategic overview + approval queue

---
