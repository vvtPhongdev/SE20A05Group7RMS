# Task: Implement Requirement v1.0 Workflow Enhancements

## Task ID

`T-085`

## Source Requirement

Source: `docs/requirement_v1.0.md`

1. Interview schedule must include interviewer names at scheduling time. Usually at least 2 interviewers.
2. When candidate passes or fails interview, send email to candidate. Pass flow includes offer; candidate approval/acceptance must be stored.
3. Add recruitment process tracking.
4. Send email notifications for deadlines/tasks to responsible users, for example campaign posting deadline reminders.

## Goal

Complete the v1.0 recruitment workflow integration so interview scheduling, interview outcome communication, candidate offer response, recruitment tracking, and task/deadline reminders work end to end across backend services, Gateway APIs, frontend screens, database records, and documentation.

## Current Context

The codebase already has partial support for this requirement:

| Area | Existing support |
| --- | --- |
| Roles | `packages/contracts/src/enums/index.ts` uses `ADMIN`, `HR_LEADER`, `HR_RECRUITER`, `DEPARTMENT_HEAD`, `CANDIDATE`. |
| Interview schedule | `InterviewSchedule.interviewers` already exists in `packages/database/prisma/schema.prisma`. |
| Interview service | Scheduling, candidate confirmation, reschedule/cancel, result APIs exist under `services/interview/src/modules`. |
| Offer flow | `OfferLetter`, `OfferStatus`, `OfferResponse`, and offer endpoints already exist. |
| Notification storage | `Notification` and `EmailLog` models already exist. |
| Gateway endpoints | Interview, offers, reports/tracking, and notifications are documented in `docs/backend-endpoints-summary.md`. |
| Frontend | HR interview scheduling/results, candidate notifications/interview details, dashboards, and admin approval screens already exist. |

This task should complete and harden the workflow rather than rewrite it.

## Production Implementation Guide

This section is the handoff for developers. Follow it in order. Do not start with UI changes; lock the contracts and backend behavior first, then wire UI.

### Engineering Rules For This Task

- Use `@wr/contracts` for all enums, DTO schemas, and shared payload types. Do not define role/status strings locally.
- Use `PrismaService` injection. Do not instantiate `PrismaClient` directly.
- Only Gateway controllers expose HTTP decorators. Microservice controllers use TCP message patterns.
- All frontend calls go through Gateway `/api/v1/*`.
- Preserve plan-lock: no interview scheduling, candidate communication, or campaign task action can bypass approved request + approved plan + required task assignment.
- Mutations that update workflow state and write logs must use `prisma.$transaction`.
- Email sending must be async through BullMQ where possible. API calls should create `EmailLog`/notification records and queue jobs, not block on SMTP.
- Every production mutation must write either `RequestLog` or audit log metadata sufficient for tracking and debugging.

### Recommended Implementation Order

1. **Contracts**
   - Add missing DTO/Zod schemas in `packages/contracts/src`.
   - Add any missing enum values for reminder notifications/templates.
   - Export new job payload schemas/types from contracts and `packages/queue`.

2. **Database**
   - Add only the missing fields/tables listed in [Required Data Model Additions](#required-data-model-additions).
   - Run Prisma migration and generate client.
   - Add seed data for 2 interviewers, assigned task plans, and at least one offer-ready candidate.

3. **Backend Services**
   - Enforce interview panel validation in `services/interview`.
   - Complete offer/rejection communication and response persistence in `services/recruiting`.
   - Add tracking query in `services/recruiting`.
   - Add task reminder scheduling/processing in `services/recruiting`, `packages/queue`, and `services/worker`.

4. **Gateway**
   - Ensure all public API routes match `docs/backend-endpoints-summary.md`.
   - Add Swagger/API docs for new payload fields.
   - Confirm guards and `@Roles(...)` match this task.

5. **Frontend**
   - Update HR scheduling flows to require panel selection.
   - Add candidate offer response UI if missing.
   - Update dashboards to consume tracking data.
   - Show reminder status in HR task/campaign views.

6. **Tests and Docs**
   - Add unit tests before declaring done.
   - Run typecheck/lint/build.
   - Update endpoint and workflow docs in the same PR.

## Required Data Model Additions

Before coding services, inspect `packages/database/prisma/schema.prisma`. Existing models cover most of this task, but production implementation needs explicit persistence for offer response and reminder idempotency.

### Offer Response Persistence

`OfferLetter` currently has `status` and `respondedAt`. Add fields if they are not already present:

```prisma
model OfferLetter {
  // existing fields...
  response     String?   @map("response") // OfferResponse enum: ACCEPT / DECLINE
  responseNote String?   @map("response_note") @db.Text
  respondedAt  DateTime? @map("responded_at")
}
```

Rules:

- `response` is nullable until candidate responds.
- `responseNote` is optional.
- Do not create a second offer for the same `(requestId, candidateId)`.
- Keep existing `@@unique([requestId, candidateId])`.

### Task Reminder Idempotency

Use one of these two production-safe options. Prefer **Option A** because it is auditable and avoids overloading `EmailLog`.

**Option A: dedicated reminder table**

```prisma
model TaskReminder {
  id           String   @id @default(uuid())
  taskPlanId   String   @map("task_plan_id")
  reminderKey  String   @map("reminder_key") // e.g. "24h-before", "deadline"
  scheduledFor DateTime @map("scheduled_for")
  sentAt       DateTime? @map("sent_at")
  status       String   @default("PENDING") // PENDING / SENT / FAILED / SKIPPED
  emailLogId   String?  @map("email_log_id")
  errorMessage String?  @map("error_message") @db.Text
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  taskPlan TaskPlan @relation(fields: [taskPlanId], references: [id], onDelete: Cascade)

  @@unique([taskPlanId, reminderKey], map: "uq_task_reminders_task_key")
  @@index([scheduledFor], map: "idx_task_reminders_scheduled_for")
  @@map("task_reminders")
}
```

**Option B: fields on `TaskPlan`**

```prisma
model TaskPlan {
  // existing fields...
  reminder24hSentAt      DateTime? @map("reminder_24h_sent_at")
  reminderDeadlineSentAt DateTime? @map("reminder_deadline_sent_at")
}
```

Option B is simpler but less extensible. Use it only if the team does not need configurable reminders.

### Notification Template Types

Add enum values if missing:

```typescript
export enum NotificationType {
  // existing values...
  TASK_REMINDER = 'TASK_REMINDER',
}

export enum EmailTemplateType {
  // existing values...
  TASK_DEADLINE_REMINDER = 'TASK_DEADLINE_REMINDER',
}
```

### Queue Job Types

Add queue/job constants in `packages/queue/src/index.ts`:

```typescript
export const QUEUE_NAMES = {
  // existing queues...
  TASK_REMINDER: 'task-reminder',
} as const;

export const JOB_NAMES = {
  // existing jobs...
  SEND_TASK_REMINDER: 'send-task-reminder',
} as const;
```

Add a shared payload schema in `packages/contracts/src`:

```typescript
export const TaskReminderJobPayloadSchema = z.object({
  taskPlanId: z.string().uuid(),
  reminderKey: z.enum(['24h-before', 'deadline']),
  scheduledFor: z.string().datetime(),
});

export type TaskReminderJobPayload = z.infer<typeof TaskReminderJobPayloadSchema>;
```

Export the schema/type through `@wr/queue`.

## Backend Coding Guide

### R1 Backend: Interview Panel Validation

Apply in `services/interview/src/modules/schedules/schedules.service.ts`.

Add a helper near the existing plan-lock/conflict helpers:

```typescript
private async assertValidInterviewers(interviewerIds: string[]) {
  const uniqueIds = [...new Set(interviewerIds ?? [])];

  if (uniqueIds.length < 2) {
    throw new RpcException({
      status: HttpStatus.BAD_REQUEST,
      message: 'At least 2 interviewers are required to schedule an interview',
    });
  }

  const users = await this.prisma.user.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, role: true, isActive: true, displayName: true, email: true },
  });

  if (users.length !== uniqueIds.length) {
    throw new RpcException({
      status: HttpStatus.BAD_REQUEST,
      message: 'One or more interviewers do not exist',
    });
  }

  const invalid = users.find(
    (user) =>
      !user.isActive ||
      ![UserRole.HR_LEADER, UserRole.HR_RECRUITER, UserRole.DEPARTMENT_HEAD, UserRole.ADMIN].includes(
        user.role as UserRole,
      ),
  );

  if (invalid) {
    throw new RpcException({
      status: HttpStatus.BAD_REQUEST,
      message: 'Interviewers must be active internal users',
    });
  }

  return users;
}
```

In the schedule creation method:

1. Parse and validate `requestId`, `candidateId`, `scheduledAt`, `duration`, `location`, `interviewers`.
2. Call `assertPlanLocked(requestId)`.
3. Call `assertValidInterviewers(interviewers)`.
4. Call existing conflict detection with the unique interviewer IDs.
5. Create `InterviewSchedule` and include request/candidate.
6. Create request log/audit log.
7. Send in-app notifications to candidate, request owner, and panel members.
8. Return a normalized DTO that includes:

```typescript
{
  id,
  requestId,
  candidateId,
  scheduledAt,
  duration,
  location,
  status,
  interviewers: string[],
  panel: Array<{ id: string; displayName: string; email: string; role: string }>,
}
```

Do not silently add the current HR user as the only interviewer. That violates requirement v1.0.

### R2 Backend: Decision, Offer, And Rejection Flow

Recommended ownership:

- `services/interview`: records interview facts and panel recommendation.
- `services/recruiting`: owns final hiring decision, offer generation, offer response, and request/application status changes.
- `services/notification` + `services/worker`: render/send emails and create in-app notifications.

#### Admin Hiring Decision

Apply in `services/recruiting/src/modules/hiring-decisions/hiring-decision.service.ts`.

The `HIRE` path must run in a transaction:

```typescript
await this.prisma.$transaction(async (tx) => {
  // 1. validate request is DECISION_PENDING / INTERVIEW_COMPLETED-compatible
  // 2. validate candidate belongs to request/application
  // 3. update RecruitmentRequest to OFFER_EXTENDED or HIRED depending current workflow
  // 4. update Application to OFFER_EXTENDED
  // 5. create RequestLog action HIRING_DECISION_HIRE
  // 6. create Notification for candidate and HR owner
});
```

The `REJECT` path must run in a transaction:

```typescript
await this.prisma.$transaction(async (tx) => {
  // 1. validate request and candidate/application
  // 2. update Application to NOT_HIRED / rejected status
  // 3. update RecruitmentRequest to NOT_HIRED or ACTIVE if more hiring continues
  // 4. create RequestLog action HIRING_DECISION_REJECT
  // 5. create EmailLog with REJECTION template body
  // 6. create Notification for candidate
});
```

Queue the email after the transaction commits. If queueing fails, keep `EmailLog.status = PENDING` or mark it `FAILED` with `errorMessage`; do not roll back the hiring decision only because SMTP/Redis failed.

#### Offer Send

Apply in `services/recruiting/src/modules/offers/offer-letter.service.ts`.

`send(id, sentById)` should:

1. Load offer with request and candidate.
2. Reject if offer is not `DRAFT`.
3. Render offer template through notification service.
4. Use a transaction to:
   - create `EmailLog` with `PENDING`;
   - update offer to `SENT`;
   - set `sentAt`;
   - update request/application to `OFFER_EXTENDED`;
   - create `RequestLog` action `OFFER_LETTER_SENT`;
   - create candidate notification.
5. Add BullMQ `EMAIL_SEND` job with `jobId = email-log-${emailLog.id}`.

#### Offer Response

Apply in `services/recruiting/src/modules/offers/offer-letter.service.ts`.

`respond(id, candidateUserId, payload)` must:

1. Validate offer exists and belongs to candidate user.
2. Reject if offer status is not `SENT`.
3. Validate `payload.response` is `ACCEPT` or `DECLINE`.
4. Use a transaction:
   - update offer `status` to `ACCEPTED` or `DECLINED`;
   - write `response`, `responseNote`, `respondedAt`;
   - update application status;
   - update request status:
     - accept: `OFFER_ACCEPTED` or `HIRED` depending existing state model;
     - decline: `OFFER_DECLINED`, `NOT_HIRED`, or `ACTIVE` if HR continues sourcing;
   - create `RequestLog` action `OFFER_ACCEPTED` or `OFFER_DECLINED`;
   - notify HR leader/recruiter/admin as needed.

Do not let HR/Admin respond on behalf of the candidate through this endpoint.

### R3 Backend: Realtime Tracking

Apply in `services/recruiting/src/modules/reports/reports.service.ts` and Gateway report routes.

Create or harden method:

```typescript
async getRealtimeTracking(payload: {
  actorUserId: string;
  actorRole: UserRole;
  departmentId?: string;
}) {
  // 1. Build role-scoped RecruitmentRequest where clause.
  // 2. Include department, creator, reviewer, approver, overallPlan/tasks,
  //    interviews/results, applications/offers, recent request logs.
  // 3. Map each request to dashboard DTO.
}
```

Role scoping:

| Role | Scope |
| --- | --- |
| `ADMIN` | all requests |
| `HR_LEADER` | all HR-managed requests, plus requests assigned/reviewed by the user if assignment exists |
| `HR_RECRUITER` | requests with task assigned to user or interviews handled by user |
| `DEPARTMENT_HEAD` | requests created by user or matching user department |
| `CANDIDATE` | not allowed on this endpoint |

Dashboard DTO:

```typescript
type RealtimeTrackingItem = {
  requestId: string;
  position: string;
  departmentName: string;
  status: string;
  currentOwner: 'DEPARTMENT_HEAD' | 'HR_LEADER' | 'HR_RECRUITER' | 'ADMIN' | 'CANDIDATE' | 'SYSTEM';
  pendingAction: string;
  headcount: number;
  hiredCount: number;
  taskProgress: { total: number; completed: number; overdue: number };
  interviewProgress: { scheduled: number; completed: number; cancelled: number };
  offerProgress: { sent: number; accepted: number; declined: number };
  latestLog?: { action: string; at: string; performedById: string };
  lastUpdatedAt: string;
};
```

`pendingAction` mapping:

| Status | pendingAction |
| --- | --- |
| `DRAFT` | `SUBMIT_REQUEST` |
| `PENDING_HR_REVIEW` | `HR_REVIEW` |
| `PENDING_BOSS_APPROVAL` | `ADMIN_APPROVAL` |
| `APPROVED` | `CREATE_PLAN` |
| `PLANNING` | `SUBMIT_PLAN` |
| `PLAN_PENDING_APPROVAL` | `PLAN_APPROVAL` |
| `ACTIVE` | `SOURCE_OR_SCREEN_CANDIDATES` |
| `INTERVIEWING` | `INTERVIEW_RESULT` |
| `DECISION_PENDING` | `HIRING_DECISION` |
| `OFFER_EXTENDED` | `OFFER_RESPONSE` |
| `OFFER_ACCEPTED` | `COMPLETE_HIRING` |
| `NOT_HIRED` | `CONTINUE_OR_CLOSE` |
| `COMPLETED` | `NONE` |

### R4 Backend: Task Deadline Reminders

Implement production reminders in three parts.

#### Part 1: Schedule Reminder Records

Apply in `services/recruiting/src/modules/task-plan/task-plan.service.ts`.

When creating/updating a task:

1. Validate dates are within overall plan, as current code does.
2. Create/update reminder records for:
   - `24h-before`: `endDate - 24 hours`, only if in the future.
   - `deadline`: `endDate`.
3. Use unique key `(taskPlanId, reminderKey)` to avoid duplicates.

Pseudo-code:

```typescript
private async upsertTaskReminders(tx: Prisma.TransactionClient, task: TaskPlan) {
  const reminders = [
    { key: '24h-before', scheduledFor: new Date(task.endDate.getTime() - 24 * 60 * 60 * 1000) },
    { key: 'deadline', scheduledFor: task.endDate },
  ].filter((item) => item.scheduledFor > new Date());

  for (const reminder of reminders) {
    await tx.taskReminder.upsert({
      where: { taskPlanId_reminderKey: { taskPlanId: task.id, reminderKey: reminder.key } },
      create: { taskPlanId: task.id, reminderKey: reminder.key, scheduledFor: reminder.scheduledFor },
      update: { scheduledFor: reminder.scheduledFor, status: 'PENDING' },
    });
  }
}
```

#### Part 2: Queue Reminder Jobs

Either:

- add delayed BullMQ jobs when task/reminder records are created, or
- add a periodic worker scan for due `TaskReminder` rows.

Recommended for reliability: periodic scan. Delayed jobs can be lost or become hard to reconcile after deployment changes.

Add `services/worker/src/processors/task-reminder.processor.ts`:

```typescript
export async function processTaskReminderJob(payload: TaskReminderJobPayload) {
  // 1. Load TaskReminder + TaskPlan + assignedTo + overallPlan.request.
  // 2. If reminder is not PENDING, return.
  // 3. If task status is COMPLETED, mark reminder SKIPPED.
  // 4. Create EmailLog PENDING.
  // 5. Queue or directly call email-send logic based on existing worker style.
  // 6. Create Notification TASK_REMINDER.
  // 7. Mark TaskReminder SENT with sentAt and emailLogId.
}
```

Add worker bootstrap in `services/worker/src/main.ts` for `QUEUE_NAMES.TASK_REMINDER`.

#### Part 3: Reminder Scanner

Add one of:

- a worker queue job that scans every N minutes;
- a service endpoint/cron if the team already has scheduler infrastructure.

Minimum scanner query:

```typescript
const due = await prisma.taskReminder.findMany({
  where: {
    status: 'PENDING',
    scheduledFor: { lte: new Date() },
    taskPlan: { status: { not: TaskStatus.COMPLETED } },
  },
  take: 100,
});
```

For each due reminder, enqueue `SEND_TASK_REMINDER` with `jobId = task-reminder-${reminder.id}`.

## Frontend Coding Guide

### HR Interview Scheduling

Apply in `webapp/src/features/hr/pages/HRInterviewSchedule.tsx`.

- Load interviewer options from `/users/interviewers`.
- Store `selectedInterviewerIds`.
- Disable schedule submit until at least 2 are selected.
- Display selected panel names in schedule preview.
- Show backend validation errors directly.
- After create success, refresh schedules and clear form.

Apply in `webapp/src/features/hr/pages/CandidateSearch.tsx`.

- Remove one-click schedule path that sends `interviewers: [user.id]`, or replace it with a panel picker.
- If keeping quick schedule, require choosing a second interviewer before POST.
- Prefer navigating to `/hr/interviews` with candidate/request preselected if the page cannot support panel selection cleanly.

### Candidate Interview Details

Apply in `webapp/src/features/candidate/pages/CandidateInterviewDetails.tsx`.

- Render `panel` from API response if present.
- Fall back to IDs only if the old API response is still being migrated.
- Candidate can confirm/reschedule/cancel only allowed statuses.

### Candidate Offer Response

Add or update candidate screen reachable from notifications/dashboard:

- Fetch offer by ID via `GET /api/v1/offers/:id`.
- Show position, department, compensation, start date, content, and status.
- Show Accept and Decline actions only for `SENT` offers owned by current candidate.
- POST to `/offers/:id/respond`.
- After response, show immutable accepted/declined state and timestamp.

Candidate dashboard should route offer notifications to this screen instead of a generic details page.

### Tracking Dashboards

Apply to:

- `webapp/src/features/dept-head/pages/DeptHeadDashboard.tsx`
- `webapp/src/features/hr/pages/HRDashBoard.tsx`
- `webapp/src/features/admin/pages/AdminDashboard.tsx`
- campaign/request detail pages where useful

Implementation:

- Fetch `/reports/realtime-tracking`.
- Render counts for task progress, interview progress, offer progress.
- Show `pendingAction` as the main next-step label.
- Filter client-side only for presentation; authorization scoping belongs in backend.
- Include loading, empty, error, and unauthorized states.

### Task Reminder Visibility

Apply in:

- `webapp/src/features/hr/pages/HRTaskPlanner.tsx`
- `webapp/src/features/hr/pages/HRCampaignDetail.tsx`
- `webapp/src/features/hr/pages/HRSystemNotifications.tsx`

Show:

- task owner;
- due date;
- status;
- overdue marker;
- reminder sent status if available from API;
- notification item with link back to campaign/task.

## Gateway Coding Guide

Update controllers only as HTTP adapters:

- `services/gateway/src/controllers/interview.controller.ts`
- `services/gateway/src/controllers/recruiting.controller.ts`
- `services/gateway/src/controllers/identity.controller.ts`

Gateway responsibilities:

- apply `@Roles(...)`;
- parse route params/query/body;
- attach current user context;
- forward payload to TCP services;
- document Swagger metadata if existing style supports it.

Gateway must not duplicate business rules such as plan-lock, final decision state transitions, or reminder idempotency. Those belong in services.

## Production Safety Checklist

Before merge:

- Existing active interviews with one interviewer are not broken in read views. Enforce 2-interviewer rule only for new schedules unless a migration is planned.
- Offer response migration is nullable/backward compatible.
- Reminder jobs are idempotent using unique keys/job IDs.
- API response shape additions are backward compatible where possible.
- Transaction boundaries prevent partial status/log updates.
- Failed email delivery does not corrupt recruitment workflow state.
- Role scoping is tested for `ADMIN`, `HR_LEADER`, `HR_RECRUITER`, and `DEPARTMENT_HEAD`.
- No endpoint lets Candidate access another candidate's offer/interview.

## Scope

### R1. Interview Panel Required During Scheduling

**Spec**

- HR must select interviewers when creating an interview schedule.
- The schedule payload must include interviewer IDs.
- The UI must show interviewer names, not only IDs.
- Default business rule: require at least 2 interviewers.
- If the team decides to allow single-interviewer exceptions, the exception must be explicit in API payload and audit metadata.

**Where to apply**

| Layer | Files / modules |
| --- | --- |
| Contracts | `packages/contracts/src/enums/index.ts`, relevant DTO/schema files under `packages/contracts/src` |
| Database | `packages/database/prisma/schema.prisma` model `InterviewSchedule` |
| Interview service | `services/interview/src/modules/schedules/schedules.service.ts`, `schedules.controller.ts`, `schedules.service.spec.ts` |
| Gateway | `services/gateway/src/controllers/interview.controller.ts`, `services/gateway/src/controllers/identity.controller.ts` for `/users/interviewers` |
| Frontend | `webapp/src/features/hr/pages/HRInterviewSchedule.tsx`, `webapp/src/features/hr/pages/CandidateSearch.tsx`, `webapp/src/features/candidate/pages/CandidateInterviewDetails.tsx` |
| Docs | `docs/backend-endpoints-summary.md`, `docs/api-contracts.md`, this task document |

**Implementation notes**

- Validate `interviewers` is a non-empty array of active internal users.
- Enforce minimum length `>= 2` unless exception handling is implemented.
- Reject inactive users and candidate users as interviewers.
- Keep existing conflict detection for candidate and interviewer schedules.
- Ensure candidate-facing response includes `panel` with interviewer display names/email/role where safe.
- Update `CandidateSearch.tsx`, which currently schedules with only the current HR user, to use the same panel-selection rule or route users to the full scheduling page.

### R2. Pass/Fail Email And Offer Response Flow

**Spec**

- When interview/final decision is pass/hire, system sends offer email to candidate.
- Candidate can accept or decline offer.
- Candidate response is stored.
- When interview/final decision is fail/reject, system sends rejection email to candidate.
- Email delivery attempts are logged in `EmailLog`.
- In-app notification is also created for candidate where supported.

**Where to apply**

| Layer | Files / modules |
| --- | --- |
| Contracts | `OfferStatus`, `OfferResponse`, `EmailTemplateType`, notification DTOs |
| Database | `OfferLetter`, `EmailLog`, `Notification`, `RequestLog`, `Application` status fields |
| Interview result | `services/interview/src/modules/results/interview-result.service.ts`, `results.controller.ts`, tests |
| Recruiting decision | `services/recruiting/src/modules/hiring-decisions/hiring-decision.service.ts` |
| Offers | `services/recruiting/src/modules/offers/offer-letter.service.ts`, offer controller/module tests |
| Notification | `services/notification/src/modules/notifications`, email template/render handlers |
| Worker | `services/worker/src/processors/email-send.processor.ts` |
| Gateway | `services/gateway/src/controllers/recruiting.controller.ts`, `services/gateway/src/controllers/interview.controller.ts` |
| Frontend | `webapp/src/features/hr/pages/HRInterviewResults.tsx`, `webapp/src/features/admin/pages/AdminInterviewResults.tsx`, candidate offer/notification screens |

**Implementation notes**

- Decide final trigger point: interview result submission, Admin hiring decision, or both. Recommended: interview result records panel recommendation; Admin hiring decision triggers offer/rejection.
- `POST /api/v1/hiring-decisions/:requestId` should move request/application to `OFFER_EXTENDED` or rejection state and create the expected communication job.
- `POST /api/v1/offers/:id/send` should create `EmailLog`, queue email, set offer `SENT`, and notify candidate.
- `POST /api/v1/offers/:id/respond` should store `ACCEPTED`/`DECLINED`, set `respondedAt`, update request/application state, and write `RequestLog`.
- If current `OfferLetter` cannot store response type directly, add a nullable response field or dedicated response model before implementing persistence.

### R3. Recruitment Process Tracking

**Spec**

- Users can track recruitment process state in near real time.
- Tracking must show current request status, current owner/stage, task progress, interview progress, offer/decision state, and logs.
- Scope must respect role:
  - `ADMIN`: all requests.
  - `HR_LEADER`: campaigns under HR management.
  - `HR_RECRUITER`: assigned task/campaign scope.
  - `DEPARTMENT_HEAD`: own department/request scope.

**Where to apply**

| Layer | Files / modules |
| --- | --- |
| Recruiting reports | `services/recruiting/src/modules/reports/reports.service.ts` |
| Recruitment requests | `services/recruiting/src/modules/recruitment-requests/recruitment-requests.service.ts` |
| Task plans | `services/recruiting/src/modules/task-plan/task-plan.service.ts` |
| Gateway | `services/gateway/src/controllers/recruiting.controller.ts` report/tracking routes |
| Frontend | `webapp/src/features/dept-head/pages/DeptHeadDashboard.tsx`, `DeptHeadRequests.tsx`, `webapp/src/features/hr/pages/HRDashBoard.tsx`, `HRCampaigns.tsx`, `HRCampaignDetail.tsx`, `webapp/src/features/admin/pages/AdminDashboard.tsx`, `AdminAllRequests.tsx` |
| Docs | `docs/backend-endpoints-summary.md`, `docs/enterprise-hiring-workflow.md` |

**Implementation notes**

- Use `RequestLog` as the canonical timeline source.
- Include progress counters: `headcount`, hired count, active candidates, completed interviews, open tasks, overdue tasks.
- Include `pendingAction` such as `HR_REVIEW`, `ADMIN_APPROVAL`, `PLAN_APPROVAL`, `INTERVIEW_RESULT`, `OFFER_RESPONSE`.
- Use `GET /api/v1/reports/realtime-tracking` as the primary endpoint unless existing service code has a more specific route.

### R4. Deadline And Task Email Reminders

**Spec**

- Task owners receive email reminders for assigned tasks/deadlines.
- Reminder examples: campaign/job posting deadline, CV screening deadline, interview coordination deadline.
- Reminder jobs must be idempotent enough to avoid duplicate spam for the same task/reminder window.
- Reminder delivery attempts are logged.

**Where to apply**

| Layer | Files / modules |
| --- | --- |
| Contracts | Add/verify notification type/template for task/deadline reminder |
| Database | `TaskPlan`, `Notification`, `EmailLog`; add reminder metadata if current fields are insufficient |
| Recruiting task plan | `services/recruiting/src/modules/task-plan/task-plan.service.ts` |
| Notification | `services/notification/src/modules/notifications` and template renderer |
| Worker/queue | `packages/queue`, `services/worker/src/processors/email-send.processor.ts`, new reminder processor if needed |
| Gateway | task-plan routes in `services/gateway/src/controllers/recruiting.controller.ts` |
| Frontend | `webapp/src/features/hr/pages/HRTaskPlanner.tsx`, `HRCampaignDetail.tsx`, `HRSystemNotifications.tsx` |

**Implementation notes**

- Minimum reminder rule: send reminder before `TaskPlan.endDate` when task is not `COMPLETED`.
- Recommended default cadence: 24 hours before deadline and at deadline if still incomplete.
- Store enough metadata to avoid duplicate reminders. Options:
  - add task reminder fields to `TaskPlan`, or
  - store reminder event keys in `Notification`/`EmailLog` metadata if available, or
  - create a dedicated reminder table.
- If database schema currently lacks metadata for idempotency, create a migration before implementing worker behavior.

## API Contract Updates

Update `docs/backend-endpoints-summary.md` and `docs/api-contracts.md` when implementation changes.

### Interview Scheduling

```http
POST /api/v1/interviews/schedules
Roles: HR_LEADER, HR_RECRUITER
```

Required payload fields:

```json
{
  "requestId": "uuid",
  "candidateId": "uuid",
  "scheduledAt": "2026-06-20T09:00:00.000Z",
  "duration": 60,
  "location": "Room A / meeting URL",
  "interviewers": ["user-id-1", "user-id-2"]
}
```

Validation:

- `interviewers.length >= 2` by default.
- each interviewer is active and has an allowed internal role.
- candidate and interviewers have no conflicting schedule.
- request passes plan-lock rules.

### Hiring Decision

```http
POST /api/v1/hiring-decisions/:requestId
Roles: ADMIN
```

Expected behavior:

- `HIRE`: updates request/application state and enables/sends offer flow.
- `REJECT`: updates request/application state and sends rejection communication.
- writes request log and notification records.

### Offer Response

```http
POST /api/v1/offers/:id/respond
Roles: CANDIDATE
```

Required payload fields:

```json
{
  "response": "ACCEPT",
  "note": "I accept the offer."
}
```

Expected behavior:

- only the offer owner candidate can respond.
- only `SENT` offers can be answered.
- response and `respondedAt` are persisted.
- accepted offer moves workflow toward `OFFER_ACCEPTED`, `HIRED`, or `COMPLETED` according to implemented state rules.

### Realtime Tracking

```http
GET /api/v1/reports/realtime-tracking
Roles: ADMIN, HR_LEADER, HR_RECRUITER, DEPARTMENT_HEAD
```

Response should include:

```json
{
  "items": [
    {
      "requestId": "uuid",
      "position": "Backend Engineer",
      "status": "INTERVIEWING",
      "currentOwner": "HR_RECRUITER",
      "pendingAction": "INTERVIEW_RESULT",
      "headcount": 2,
      "hiredCount": 1,
      "taskProgress": { "total": 4, "completed": 2, "overdue": 1 },
      "interviewProgress": { "scheduled": 3, "completed": 1 },
      "lastUpdatedAt": "2026-06-19T10:00:00.000Z"
    }
  ]
}
```

## Database Changes To Check

Before implementation, verify whether these fields already exist. Add migrations only for missing required data.

| Need | Existing model | Possible change |
| --- | --- | --- |
| Store interviewer IDs | `InterviewSchedule.interviewers String[]` | Add relation table only if richer panel metadata is required. |
| Store offer response | `OfferLetter.status`, `respondedAt` | Add `response` and `responseNote` if not already available. |
| Email delivery log | `EmailLog` | Add template/entity metadata if needed for tracing and idempotency. |
| Task reminder idempotency | `TaskPlan`, `Notification`, `EmailLog` | Add reminder metadata/table if duplicate prevention cannot be implemented safely. |
| Tracking timeline | `RequestLog` | Add missing actions or metadata fields only if current JSON metadata is insufficient. |

## Subtasks

| ID | Task | Depends on |
| --- | --- | --- |
| T-085.1 | Confirm database gaps for panel, offer response, reminder idempotency, and tracking metadata. | T-085 |
| T-085.2 | Update contracts/DTOs for schedule panel validation, offer response, tracking response, and reminder notification payloads. | T-085.1 |
| T-085.3 | Enforce interview panel selection and minimum interviewer rule in service and frontend scheduling flows. | T-085.2 |
| T-085.4 | Complete pass/fail to offer/rejection communication flow and persist candidate response. | T-085.2 |
| T-085.5 | Implement or harden realtime recruitment tracking endpoint and role-scoped dashboards. | T-085.2 |
| T-085.6 | Implement deadline/task reminder queueing, delivery, and duplicate prevention. | T-085.2 |
| T-085.7 | Update docs and endpoint summaries to match implemented behavior. | T-085.3, T-085.4, T-085.5, T-085.6 |
| T-085.8 | Add unit/service/frontend verification for the whole requirement. | T-085.3, T-085.4, T-085.5, T-085.6 |

## Acceptance Criteria

- HR cannot create an interview schedule without valid interviewer selection.
- The normal interview schedule path requires at least 2 interviewers.
- Candidate and interviewer conflicts are rejected or clearly returned before schedule creation.
- Candidate receives interview invitation email and in-app notification when invitation is sent.
- Pass/hire decision creates or sends an offer and logs the email.
- Fail/reject decision sends a rejection email and logs the email.
- Candidate can accept or decline an offer, and the response is persisted with timestamp.
- Tracking dashboard/API shows current state, owner, task progress, interview progress, and pending action.
- Task owners receive deadline reminder email/notification for incomplete tasks.
- Reminder implementation prevents duplicate reminders for the same task/window.
- `docs/backend-endpoints-summary.md`, `docs/api-contracts.md`, and related workflow docs match the implemented behavior.

## Verification Plan

Run after implementation:

```bash
npm run typecheck
npm run lint
npm run build
```

Targeted tests to add or run:

```bash
npm --workspace=@wr/interview test
npm --workspace=@wr/recruiting test
npm --workspace=@wr/notification test
npm --workspace=@wr/worker test
npm --workspace=@wr/gateway test
```

Manual workflow smoke test:

1. Department Head creates and submits request.
2. HR/Admin approve request and plan.
3. HR creates interview with 2 interviewers.
4. Candidate receives invitation and confirms.
5. HR/panel records result.
6. Admin makes final decision.
7. Candidate receives offer or rejection.
8. Candidate accepts/declines offer if hired.
9. Tracking dashboard reflects the latest state.
10. Incomplete task near deadline generates reminder notification/email.

## Open Decisions

- Whether the 2-interviewer rule is absolute or can be bypassed with a recorded exception.
- Exact reminder cadence and escalation rules.
- Required offer fields beyond compensation and start date.
- Whether candidate acceptance should move request directly to `COMPLETED` or first to `OFFER_ACCEPTED`/`HIRED`.
