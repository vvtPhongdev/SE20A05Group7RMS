# API Contracts

## Gateway HTTP Endpoints

### Auth (Identity Service)

| Method | Path                    | Role   | Description                 |
| ------ | ----------------------- | ------ | --------------------------- |
| POST   | `/auth/register`        | Public | User registration           |
| POST   | `/auth/login`           | Public | Login → JWT + refresh token |
| POST   | `/auth/refresh`         | Public | Refresh token rotation      |
| POST   | `/auth/logout`          | Auth   | Invalidate refresh token    |
| POST   | `/auth/forgot-password` | Public | Send password reset OTP     |
| POST   | `/auth/reset-password`  | Public | Reset password with OTP     |
| GET    | `/auth/me`              | Auth   | Get current user profile    |

### Users & Organization (Identity Service)

| Method | Path                | Role              | Description              |
| ------ | ------------------- | ----------------- | ------------------------ |
| GET    | `/users`            | ADMIN             | List all users           |
| PATCH  | `/users/:id/role`   | ADMIN             | Update user role         |
| PATCH  | `/users/:id/status` | ADMIN             | Activate/deactivate user |
| GET    | `/organizations`    | ADMIN             | List organizations       |
| POST   | `/organizations`    | ADMIN             | Create organization      |
| GET    | `/departments`      | ADMIN, HR_MANAGER | List departments         |
| POST   | `/departments`      | ADMIN             | Create department        |
| PATCH  | `/departments/:id`  | ADMIN             | Update department        |

### Recruitment Requests (Recruiting Service)

| Method | Path                                        | Role                               | Description                        |
| ------ | ------------------------------------------- | ---------------------------------- | ---------------------------------- |
| POST   | `/recruitment-requests`                     | DEPARTMENT_HEAD                    | Create new request (DRAFT)         |
| GET    | `/recruitment-requests`                     | All (filtered by role)             | List requests                      |
| GET    | `/recruitment-requests/:id`                 | Auth                               | Get request details                |
| PATCH  | `/recruitment-requests/:id`                 | DEPARTMENT_HEAD                    | Update draft request               |
| POST   | `/recruitment-requests/:id/submit`          | DEPARTMENT_HEAD                    | Submit (DRAFT → PENDING_HR_REVIEW) |
| POST   | `/recruitment-requests/:id/forward-to-boss` | HR_MANAGER                         | Forward (→ PENDING_BOSS_APPROVAL)  |
| POST   | `/recruitment-requests/:id/approve`         | ADMIN                              | Approve request                    |
| POST   | `/recruitment-requests/:id/reject`          | ADMIN                              | Reject request (with reason)       |
| GET    | `/recruitment-requests/:id/logs`            | DEPARTMENT_HEAD, HR_MANAGER, ADMIN | Get audit trail                    |
| GET    | `/recruitment-requests/:id/tracking`        | DEPARTMENT_HEAD                    | Get tracking dashboard data        |

### Recruitment Plans (Recruiting Service)

| Method | Path                                              | Role              | Description                   |
| ------ | ------------------------------------------------- | ----------------- | ----------------------------- |
| POST   | `/recruitment-requests/:id/plan`                  | HR_MANAGER        | Create overall plan           |
| GET    | `/recruitment-requests/:id/plan`                  | HR_MANAGER, ADMIN | Get plan details              |
| PATCH  | `/recruitment-requests/:id/plan`                  | HR_MANAGER        | Update plan                   |
| POST   | `/recruitment-requests/:id/plan/submit`           | HR_MANAGER        | Submit plan for approval      |
| POST   | `/recruitment-requests/:id/plan/approve`          | ADMIN             | Approve plan → ACTIVE         |
| POST   | `/recruitment-requests/:id/plan/request-revision` | ADMIN             | Request revision (with notes) |
| POST   | `/recruitment-requests/:id/plan/tasks`            | HR_MANAGER        | Add task to plan              |
| PATCH  | `/plan-tasks/:taskId`                             | HR_MANAGER        | Update task                   |
| PATCH  | `/plan-tasks/:taskId/status`                      | HR_MANAGER        | Update task status            |

### Interviews (Recruiting Service)

| Method | Path                              | Role              | Description               |
| ------ | --------------------------------- | ----------------- | ------------------------- |
| POST   | `/interviews`                     | HR_MANAGER        | Schedule interview        |
| GET    | `/interviews`                     | HR_MANAGER, ADMIN | List interviews           |
| GET    | `/interviews/:id`                 | Auth              | Get interview details     |
| PATCH  | `/interviews/:id`                 | HR_MANAGER        | Update interview          |
| POST   | `/interviews/:id/cancel`          | HR_MANAGER        | Cancel interview          |
| POST   | `/interviews/:id/reschedule`      | HR_MANAGER        | Reschedule                |
| POST   | `/interviews/:id/result`          | HR_MANAGER        | Record result (PASS/FAIL) |
| POST   | `/interviews/:id/hiring-decision` | ADMIN             | Final hiring decision     |
| GET    | `/interviews/available-slots`     | HR_MANAGER        | Get available time slots  |

### Candidates & CV (Profiles Service)

| Method | Path                      | Role              | Description              |
| ------ | ------------------------- | ----------------- | ------------------------ |
| GET    | `/candidates`             | HR_MANAGER        | List candidates          |
| GET    | `/candidates/:id`         | HR_MANAGER, ADMIN | Get candidate profile    |
| POST   | `/candidates/upload-cv`   | CANDIDATE         | Upload CV (PDF/DOCX)     |
| GET    | `/candidates/:id/cv`      | HR_MANAGER        | Get CV document          |
| POST   | `/candidates/search`      | HR_MANAGER        | Vector search candidates |
| PATCH  | `/candidates/:id/profile` | CANDIDATE         | Update profile           |

### Notifications (Notification Service)

| Method | Path                          | Role | Description               |
| ------ | ----------------------------- | ---- | ------------------------- |
| GET    | `/notifications`              | Auth | List user's notifications |
| PATCH  | `/notifications/:id/read`     | Auth | Mark as read              |
| PATCH  | `/notifications/read-all`     | Auth | Mark all as read          |
| GET    | `/notifications/unread-count` | Auth | Get unread count          |

### Reports (Recruiting Service)

| Method | Path                      | Role                   | Description               |
| ------ | ------------------------- | ---------------------- | ------------------------- |
| GET    | `/reports/annual`         | ADMIN                  | Annual recruitment report |
| GET    | `/reports/department/:id` | ADMIN, DEPARTMENT_HEAD | Department report         |
| GET    | `/reports/time-to-hire`   | ADMIN                  | Time-to-hire metrics      |
| GET    | `/reports/pipeline`       | HR_MANAGER             | Pipeline overview         |

---

## TCP Message Patterns

### Identity Service (TCP :3010)

```typescript
// Commands
{
  cmd: 'identity.register';
}
{
  cmd: 'identity.login';
}
{
  cmd: 'identity.refresh_token';
}
{
  cmd: 'identity.logout';
}
{
  cmd: 'identity.forgot_password';
}
{
  cmd: 'identity.reset_password';
}
{
  cmd: 'identity.get_user';
}
{
  cmd: 'identity.list_users';
}
{
  cmd: 'identity.update_user_role';
}

// Organization & Department
{
  cmd: 'identity.create_organization';
}
{
  cmd: 'identity.list_organizations';
}
{
  cmd: 'identity.create_department';
}
{
  cmd: 'identity.list_departments';
}
{
  cmd: 'identity.update_department';
}
```

### Recruiting Service (TCP :3011)

```typescript
// Recruitment Requests
{
  cmd: 'recruiting.create_request';
}
{
  cmd: 'recruiting.list_requests';
}
{
  cmd: 'recruiting.get_request';
}
{
  cmd: 'recruiting.update_request';
}
{
  cmd: 'recruiting.submit_request';
}
{
  cmd: 'recruiting.forward_to_boss';
}
{
  cmd: 'recruiting.approve_request';
}
{
  cmd: 'recruiting.reject_request';
}
{
  cmd: 'recruiting.get_request_logs';
}
{
  cmd: 'recruiting.get_tracking';
}

// Plans
{
  cmd: 'recruiting.create_plan';
}
{
  cmd: 'recruiting.get_plan';
}
{
  cmd: 'recruiting.update_plan';
}
{
  cmd: 'recruiting.submit_plan';
}
{
  cmd: 'recruiting.approve_plan';
}
{
  cmd: 'recruiting.request_plan_revision';
}
{
  cmd: 'recruiting.add_task';
}
{
  cmd: 'recruiting.update_task';
}

// Interviews
{
  cmd: 'recruiting.schedule_interview';
}
{
  cmd: 'recruiting.list_interviews';
}
{
  cmd: 'recruiting.get_interview';
}
{
  cmd: 'recruiting.update_interview';
}
{
  cmd: 'recruiting.cancel_interview';
}
{
  cmd: 'recruiting.reschedule_interview';
}
{
  cmd: 'recruiting.record_result';
}
{
  cmd: 'recruiting.hiring_decision';
}
{
  cmd: 'recruiting.get_available_slots';
}

// Reports
{
  cmd: 'recruiting.annual_report';
}
{
  cmd: 'recruiting.department_report';
}
{
  cmd: 'recruiting.time_to_hire';
}
{
  cmd: 'recruiting.pipeline_overview';
}
```

### Profiles Service (TCP :3012)

```typescript
{
  cmd: 'profiles.list_candidates';
}
{
  cmd: 'profiles.get_candidate';
}
{
  cmd: 'profiles.upload_cv';
}
{
  cmd: 'profiles.get_cv';
}
{
  cmd: 'profiles.search_candidates';
} // Vector search
{
  cmd: 'profiles.update_profile';
}
```

### Notification Service (TCP :3013)

```typescript
{
  cmd: 'notification.send';
}
{
  cmd: 'notification.send_email';
}
{
  cmd: 'notification.list_notifications';
}
{
  cmd: 'notification.mark_read';
}
{
  cmd: 'notification.mark_all_read';
}
{
  cmd: 'notification.unread_count';
}
```

---

## Role-Based Access Matrix

| Endpoint Group          | ADMIN    | DEPARTMENT_HEAD | HR_MANAGER    | CANDIDATE |
| ----------------------- | -------- | --------------- | ------------- | --------- |
| Auth                    | ✅       | ✅              | ✅            | ✅        |
| User Management         | ✅       | ❌              | ❌            | ❌        |
| Create Request          | ❌       | ✅              | ❌            | ❌        |
| View Requests           | ✅ (all) | ✅ (own dept)   | ✅ (assigned) | ❌        |
| Approve/Reject Request  | ✅       | ❌              | ❌            | ❌        |
| Forward to Boss         | ❌       | ❌              | ✅            | ❌        |
| Create/Update Plan      | ❌       | ❌              | ✅            | ❌        |
| Approve Plan            | ✅       | ❌              | ❌            | ❌        |
| Schedule Interview      | ❌       | ❌              | ✅            | ❌        |
| Record Interview Result | ❌       | ❌              | ✅            | ❌        |
| Final Hiring Decision   | ✅       | ❌              | ❌            | ❌        |
| Upload CV               | ❌       | ❌              | ❌            | ✅        |
| Search Candidates       | ❌       | ❌              | ✅            | ❌        |
| View Reports            | ✅       | ✅ (own dept)   | ✅ (pipeline) | ❌        |
| Notifications           | ✅       | ✅              | ✅            | ✅        |
| Tracking Dashboard      | ❌       | ✅              | ❌            | ❌        |

## Requirement v1.0 workflow contracts (T-085)

### Interview schedule panel

`POST /api/v1/interviews/schedules` requires `interviewers` to contain at least two distinct UUIDs. Every member must exist, be active, and have one of these roles: `ADMIN`, `HR_LEADER`, `HR_RECRUITER`, or `DEPARTMENT_HEAD`.

Successful responses include:

```json
{
  "interviewers": ["uuid-1", "uuid-2"],
  "panel": [
    {
      "id": "uuid-1",
      "displayName": "Interviewer",
      "email": "user@example.com",
      "role": "HR_LEADER"
    }
  ]
}
```

### Candidate offer response

`POST /api/v1/hiring-decisions/:requestId` requires the following additional fields when `decision` is `HIRE`: `candidateId`, `compensation`, and ISO-8601 `startDate`. The selected candidate must have a PASS result. The mutation atomically creates a `SENT` offer, email log, candidate notification, application/request transitions, and request log before queueing delivery.

`POST /api/v1/offers/:id/respond` is candidate-only and ownership checked.

```json
{ "response": "ACCEPT", "note": "I accept the offer." }
```

Only `SENT` offers can be answered. The response is immutable after the first answer.

### Realtime tracking

`GET /api/v1/reports/realtime-tracking` returns an array with `requestId`, `position`, `departmentName`, `status`, `currentOwner`, `pendingAction`, `headcount`, `hiredCount`, `taskProgress`, `interviewProgress`, `offerProgress`, `latestLog`, and `lastUpdatedAt`. Scope is enforced by the authenticated role. HR Leaders receive HR-managed requests plus requests they review or handle through an assigned task/interview; unassigned drafts are excluded.

### Task reminders

Task reminder jobs use the shared payload `{ taskPlanId, reminderKey, scheduledFor }`, where `reminderKey` is `24h-before` or `deadline`. `(taskPlanId, reminderKey)` is unique and delivery attempts are traceable through `TaskReminder` and `EmailLog`. Only incomplete tasks in approved plans and active recruitment requests are eligible. Queue failures return the reminder to `PENDING` and reuse its existing email log on retry.
