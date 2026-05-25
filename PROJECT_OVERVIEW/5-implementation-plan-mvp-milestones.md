# 5. Implementation Plan (MVP Milestones)

## Milestone 0: Foundation ✅ (Implemented — Stories 1-1, 1-2)
- Monorepo workspace verification (all packages build + typecheck)
- Enterprise domain enums: `UserRole` (5 roles), `HiringRequestStatus`, `ApprovalLevel`, `RecruitmentStatus`
- "Case Review Ivory" design token system (`packages/ui/src/styles/tokens.css`)
- CSS reset + IBM Plex Sans/Mono fonts (`packages/ui/src/styles/reset.css`)
- 13 Radix UI primitive wrappers (Button, Input, Textarea, Select, Badge, StatusBadge, Tooltip, Dialog, Tabs, DropdownMenu, Separator, ScrollArea, Toast)

## Milestone 1: Evidence Extraction
- JD Wizard (paste/upload → AI parse → review)
- Profile Builder Wizard (CV upload → AI parse → confirm/edit)
- CAR triple extraction pipeline
- Source-linked evidence provenance

## Milestone 2: Capability Matching ✅ (Implemented)
- Skill Knowledge Graph (~200 nodes, ~180 edges in `packages/ai`)
- Composite matching scorer (vector + graph + coverage)
- BullMQ embedding worker (`@xenova/transformers` for `all-MiniLM-L6-v2`)
- Talent Search API (`POST /api/talent/search`, `GET /api/talent/expand`)
- Query expansion: role name → list of concrete skills via BFS

## Milestone 3: Gap, Risk & Ramp-up ✅ (Implemented)
- Gap classification (4 taxonomic categories: TOOL, PARADIGM, OPS_CLOUD, ARCHITECTURE)
- Severity assignment (CRITICAL / MODERATE / MINOR) with weak-match downgrade
- Readiness label assignment (7 deterministic labels)
- Coverage scoring

## Milestone 4: Explainability UX
- Evidence debugger (click → source → approve/reject/comment)
- Interview focus question generation (deterministic, gap-derived)
- AI Honesty Spectrum visual states

## Milestone 5: Enterprise Hiring Workflow
- Organization + department structure
- Multi-level approval chain (max 3 levels)
- Hiring request submission + approval/rejection/revision
- Recruitment opening from approved requests
- Role-based access control (Department Head, Hiring Manager, HR Recruiter, Candidate, Admin)

## Milestone 6: Two-Sided Marketplace Flow
- Smart applications (self-assessment + cover note)
- Pipeline Kanban for recruiters
- Application tracker for candidates
- Edge case handling (parse rescue, inline override, insufficient evidence)

## Milestone 7: Discovery Loop
- Talent search with explainable match reasons
- Candidate invites
- Job saving and recommendations
- Discovery feeds as primary navigation surface

---
