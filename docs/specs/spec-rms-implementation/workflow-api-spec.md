# Workflow And API Spec

## Canonical Roles

Use the implemented role set:

| Role | Purpose |
| --- | --- |
| `ADMIN` | Boss/admin approval, final decision, reporting, user/org management. |
| `HR_LEADER` | HR manager/leader who reviews requests, creates plans, assigns recruiters, sends offers. |
| `HR_RECRUITER` | HR staff who executes assigned tasks, handles candidates, schedules or records interviews where permitted. |
| `DEPARTMENT_HEAD` | Creates requests, tracks status, joins technical interview feedback. |
| `CANDIDATE` | Uploads CV, confirms/reschedules/cancels interview, responds to offer. |

Older docs using `HR_MANAGER` should be updated to `HR_LEADER` unless the intent is specifically recruiter execution, in which case use `HR_RECRUITER`.

## State Machine

```text
DRAFT
-> PENDING_HR_REVIEW
-> PENDING_BOSS_APPROVAL
-> APPROVED
-> PLANNING
-> PLAN_PENDING_APPROVAL
-> ACTIVE
-> INTERVIEWING
-> DECISION_PENDING
-> HIRED / NOT_HIRED
-> COMPLETED
```

`REJECTED` is terminal from request approval paths. `NOT_HIRED` can return to `ACTIVE` when HR continues sourcing for the same request.

## Plan-Locked Activities

The following actions must enforce approved request, approved plan, and task assignment preconditions:

- job posting publish or campaign start;
- CV search/screening for a campaign;
- interview scheduling;
- interview invitation sending;
- candidate communication tied to campaign progress.

The service should return a specific failure reason: missing approved request, missing approved plan, missing task assignment, unauthorized assignee, or invalid workflow state.

## Requirement v1.0 Additions

| Requirement | API/data impact |
| --- | --- |
| Interviewer names at schedule time | `POST /api/v1/interviews/schedules` payload includes panel member IDs. Response includes panel member display names. |
| Pass/fail interview email flow | Result/decision actions trigger offer or rejection notification jobs. Email logs are queryable. |
| Candidate offer approval | `POST /api/v1/offers/:id/respond` persists candidate decision, timestamp, and optional note. |
| Recruitment tracking | `GET /api/v1/reports/realtime-tracking` returns current status, owner, task progress, interview progress, and pending action. |
| Deadline/task reminders | Task plan stores deadlines and reminder status; worker or notification service queues reminder emails. |

## Endpoint Source Of Truth

Use `docs/backend-endpoints-summary.md` for implemented Gateway routes. If service code changes an endpoint, update the summary in the same change.

## Minimum Test Coverage

- Guard tests for role access and plan lock rejection.
- State transition unit tests for request, plan, interview, and decision flows.
- Gateway controller tests for route payload forwarding and auth metadata.
- Worker processor tests for CV parse, embedding, and reminder job behavior.
- Frontend tests or manual verification notes for role-scoped screens and candidate offer response.

