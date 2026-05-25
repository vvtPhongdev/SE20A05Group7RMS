# 2. Features

## Enterprise Hiring Workflow (4-Role Model)

| Feature | Role(s) | Description |
|---------|---------|-------------|
| **Hiring Request** | Department Head | Create hiring requests with JD drafts, staffing justification, and department context |
| **Approval Chain** | Hiring Manager | Multi-level approval (max 3 levels, configurable per department): approve, reject, or request revision |
| **Recruitment Execution** | HR Recruiter | Open recruitment from approved request → publish job → source candidates → manage pipeline |

## HR Recruiter Features

| Feature | Description |
|---------|-------------|
| **JD Wizard** | Multi-step job creation: paste JD → AI parses capability groups → recruiter reviews/edits → set constraints → publish |
| **Discovery Feed** | Browse candidate cards with readiness badges, capability tags, AI summaries. Filter by capability match |
| **Profile Review** | Full-page candidate profile with evidence timeline, capability analysis, gap table, interview focus |
| **Evidence Debugger** | Click any AI claim to see raw evidence. Approve, reject, or comment — like a GitHub PR review |
| **Pipeline Kanban** | Visual board: Applied → AI Screened → Reviewing → Interview → Offer → Hired |
| **Decision Packets** | Export defensible hiring packages with readiness, evidence, gaps, risks, and interview focus |
| **Talent Search** | Search candidates globally or scoped to a role. Explainable match reasons on every result |
| **Candidate Invites** | Invite candidates to apply for specific roles without pretending evaluation is complete |

## Candidate Features

| Feature | Description |
|---------|-------------|
| **Profile Builder Wizard** | Upload CV → AI parses into capability cards → confirm/edit each → add salary, availability, preferences |
| **Capability Mirror** | "What AI Sees": Backend strong, Frontend moderate, DevOps insufficient. Each claim links to CV source |
| **Job Discovery Feed** | Jobs ranked by profile match. Each card shows Strong/Partial/Stretch + matching capabilities + gaps |
| **Smart Application** | Before applying, see match analysis per capability group. Add context for gaps + cover note |
| **Application Tracker** | Vertical timeline: Submitted → AI Screening → Recruiter Reviewing → Interview → Offer |
| **Profile Strength Meter** | Ring chart showing evidence coverage across capability groups. Drives profile completion |
| **Gap Coaching** *(Tier 2)* | Growth recommendations with learning resources when gaps are identified |

## Edge Case Handling

| Scenario | UX Response |
|----------|-------------|
| **Parse failure** | Alert + large Textarea fallback for manual text paste → pipeline reruns |
| **Inline AI override** | Reject findings with strikethrough styling + real-time badge recalculation |
| **Insufficient evidence** | Skeleton placeholders + badge + CTA to request more information |

---
