# Use Case Specifications - Recruitment Management System (RMS)

Created By: Business Analyst / SE20A05 Group 7
Last Updated: 2026-07-06
Scope: Full system use case catalog based on current repository source code, Gateway routes, project documentation, and the unified HR role model.

## 1. Actors

| Actor | Description |
| --- | --- |
| Admin | Quản trị hệ thống, quản lý người dùng/phòng ban, duyệt yêu cầu/kế hoạch, ra quyết định tuyển dụng cuối cùng, xem báo cáo. |
| HR | Điều phối tuyển dụng: review request, lập kế hoạch, phân công task, quản lý campaign, CV, phỏng vấn, offer và pipeline. |
| Department Head | Tạo nhu cầu tuyển dụng, theo dõi tiến độ, tham gia hội đồng phỏng vấn và gửi feedback. |
| Candidate | Đăng ký tài khoản, quản lý hồ sơ/CV, theo dõi thông báo/phỏng vấn, phản hồi offer. |
| System / Worker | Tác nhân nền xử lý CV, embedding, email, notification, reminder, audit log và health check. |

## 2. Use Case Catalog

| UC ID | Use Case | Primary Actor | Module / Feature |
| --- | --- | --- | --- |
| UC-01 | Register Account | Candidate | Auth |
| UC-02 | Verify Registration Email / Resend OTP | Candidate | Auth |
| UC-03 | Login | All Users | Auth |
| UC-04 | Login/Register with Supabase or Google Session | All Users | Auth |
| UC-05 | Refresh Session | Authenticated User | Auth |
| UC-06 | Logout | Authenticated User | Auth |
| UC-07 | Reset Password | All Users | Auth |
| UC-08 | View and Update Own Profile | Authenticated User | Identity |
| UC-09 | Connect Google Calendar and Create Meet Link | Admin, HR, Department Head | Identity / Calendar |
| UC-10 | Manage Users and Roles | Admin | Identity |
| UC-11 | Check User Email Availability | Admin, Public Registration Flow | Identity |
| UC-12 | Manage Organizations | Admin | Identity |
| UC-13 | Manage Organization Settings | Admin | Identity |
| UC-14 | Manage Departments | Admin | Identity |
| UC-15 | Manage Department Team Members | Department Head | Identity |
| UC-16 | Create Recruitment Request | Department Head | Recruiting |
| UC-17 | Update Recruitment Request | Department Head, HR | Recruiting |
| UC-18 | Submit Recruitment Request | Department Head | Recruiting |
| UC-19 | Assign Recruitment Request to HR | Admin, HR | Recruiting |
| UC-20 | Return Recruitment Request for Revision | HR | Recruiting |
| UC-21 | Request Changes from HR | Admin | Recruiting |
| UC-22 | Forward Recruitment Request to Admin | HR | Recruiting |
| UC-23 | Make Recruitment Request Decision | Admin, HR (workflow-scoped) | Recruiting |
| UC-24 | Track Recruitment Request and Audit Logs | Admin, HR, Department Head | Recruiting / Audit |
| UC-25 | Create Overall Plan | HR | Planning |
| UC-26 | Submit / Resubmit Overall Plan | HR | Planning |
| UC-27 | Approve / Reject Overall Plan | Admin | Planning |
| UC-28 | Start Campaign | HR | Planning |
| UC-29 | Create and Update Task Plan | HR | Task Planning |
| UC-30 | Assign HR Task | HR | Task Planning |
| UC-31 | Update Task Status | HR | Task Planning |
| UC-32 | Manage Roles / Job Descriptions | Authenticated User | Recruiting |
| UC-33 | Manage Job Postings and Media | HR, Admin | Job Posting |
| UC-34 | Browse Public Job Postings | Candidate, Public User | Job Posting |
| UC-35 | Manage Applications | Authenticated User | Applications |
| UC-36 | Manage Invites | Authenticated User | Applications |
| UC-37 | Trigger and View Evaluations | Authenticated User | Evaluations |
| UC-38 | Manage Candidate Profile and Avatar | Candidate, HR, Admin | Profiles |
| UC-39 | Upload and Manage Candidate CV | Candidate | CV |
| UC-40 | View Latest Candidate CV | Admin, HR, Department Head | CV |
| UC-41 | Parse CV and Generate Embeddings | System / Worker | CV / AI |
| UC-42 | Search and Screen CV | HR, Admin | CV / AI |
| UC-43 | Search Talent and Record Search Feedback | HR, Admin | Talent Search |
| UC-44 | Expand Talent Query / Export Feedback Triplets | HR, Admin | Talent Search |
| UC-45 | Upload and View Documents / Evidence | Authenticated User | Profiles / Evidence |
| UC-46 | Schedule Interview | HR | Interview |
| UC-47 | Candidate Confirm / Request Reschedule / Cancel Interview | Candidate | Interview |
| UC-48 | Reschedule or Cancel Interview | HR, Admin (cancel) | Interview |
| UC-49 | Send Interview Invitations and View Email Logs | HR, Admin | Interview / Notification |
| UC-50 | View Completed Interviews and Interview Details | Admin, HR, Department Head | Interview |
| UC-51 | Submit Interview Panel Feedback | HR, Department Head | Interview Results |
| UC-52 | Record Interview Result and Final Recommendation | HR | Interview Results |
| UC-53 | Admin Review Interview Results | Admin | Interview Results |
| UC-54 | Make Final Hiring Decision / Request More Information | Admin | Hiring Decision |
| UC-55 | Generate, View and Send Offer Letter | HR, Admin | Offers |
| UC-56 | Respond to Offer | Candidate | Offers |
| UC-57 | Manage Notifications | Authenticated User | Notifications |
| UC-58 | View Dashboards | All Users | Dashboard |
| UC-59 | View Reports and Export Annual Report | Admin, HR, Department Head | Reports |
| UC-60 | Access Protected Route / API | Authenticated User | Security |
| UC-61 | Monitor System Health | Admin, System | Health |

## 3. Detailed Use Cases

### UC-01 - Register Account

| Field | Description |
| --- | --- |
| Primary Actor | Candidate |
| Trigger | Candidate opens Sign Up and submits registration information. |
| Description | Creates a new account request and starts email verification. |
| Preconditions | Candidate is not logged in; email is not already registered. |
| Postconditions | Account registration data is stored; OTP is sent. |
| Normal Flow | 1. Candidate opens Sign Up. <br> 2. Candidate enters display name, email, password and account type. <br> 3. System validates input. <br> 4. System creates pending account / registration state. <br> 5. System sends OTP email. |
| Alternative Flows | A1. Candidate signs up with supported Supabase/Google session. |
| Exceptions | E1. Email already exists. <br> E2. Invalid input. <br> E3. Email service unavailable. |
| Related Endpoints | `POST /api/v1/auth/register`, `POST /api/v1/auth/supabase-register` |

### UC-02 - Verify Registration Email / Resend OTP

| Field | Description |
| --- | --- |
| Primary Actor | Candidate |
| Trigger | Candidate enters OTP from email or requests a new OTP. |
| Description | Confirms email ownership and activates registration. |
| Preconditions | Candidate submitted registration and OTP exists. |
| Postconditions | Account is verified; user may log in or continue session. |
| Normal Flow | 1. Candidate opens OTP verification screen. <br> 2. Candidate enters OTP. <br> 3. System validates code and expiry. <br> 4. System activates account. |
| Alternative Flows | A1. Candidate requests resend OTP; system sends a new code if allowed. |
| Exceptions | E1. OTP invalid. <br> E2. OTP expired. <br> E3. Email delivery fails. |
| Related Endpoints | `POST /api/v1/auth/verify-register`, `POST /api/v1/auth/resend-register-otp` |

### UC-03 - Login

| Field | Description |
| --- | --- |
| Primary Actor | Admin, HR, Department Head, Candidate |
| Trigger | User submits email/password. |
| Description | Authenticates the user and routes to the role-specific dashboard. |
| Preconditions | User account exists and is active. |
| Postconditions | Access token and refresh token are issued. |
| Normal Flow | 1. User opens Login. <br> 2. User enters credentials. <br> 3. System validates credentials. <br> 4. System returns token pair and user profile. <br> 5. Frontend redirects by role. |
| Alternative Flows | A1. User chooses password reset instead of login. |
| Exceptions | E1. Invalid credentials. <br> E2. Inactive account. <br> E3. Unknown/unauthorized role. |
| Related Endpoints | `POST /api/v1/auth/login` |

### UC-04 - Login/Register with Supabase or Google Session

| Field | Description |
| --- | --- |
| Primary Actor | Admin, HR, Department Head, Candidate |
| Trigger | User continues authentication through Supabase/Google-backed session. |
| Description | Completes login or registration using external identity session data. |
| Preconditions | Supabase/Google provider is configured; session is valid. |
| Postconditions | User profile is matched or created; token/session state is established. |
| Normal Flow | 1. User selects Google/Supabase sign-in. <br> 2. Provider authenticates user. <br> 3. System receives session/profile. <br> 4. System matches existing user or completes registration. |
| Alternative Flows | A1. Existing Google user is routed directly to dashboard. |
| Exceptions | E1. Account not registered. <br> E2. Provider session invalid. |
| Related Endpoints | `POST /api/v1/auth/supabase-login`, `POST /api/v1/auth/supabase-register` |

### UC-05 - Refresh Session

| Field | Description |
| --- | --- |
| Primary Actor | Authenticated User |
| Trigger | Access token expires while refresh token is still valid. |
| Description | Issues a new token pair without requiring the user to log in again. |
| Preconditions | Refresh token exists and has not expired/revoked. |
| Postconditions | New access/refresh token pair is issued; old refresh token is rotated. |
| Normal Flow | 1. Client sends refresh token. <br> 2. System verifies token hash/TTL. <br> 3. System loads user. <br> 4. System rotates token pair. |
| Exceptions | E1. Refresh token expired. <br> E2. User no longer exists. |
| Related Endpoints | `POST /api/v1/auth/refresh` |

### UC-06 - Logout

| Field | Description |
| --- | --- |
| Primary Actor | Authenticated User |
| Trigger | User selects Logout. |
| Description | Ends the active session and revokes refresh token state. |
| Preconditions | User has an active session. |
| Postconditions | Refresh token is invalidated; client clears session data. |
| Normal Flow | 1. User clicks Logout. <br> 2. Client calls logout endpoint. <br> 3. System invalidates refresh token. <br> 4. Frontend redirects to public page/login. |
| Exceptions | E1. Token already invalid; user is still logged out locally. |
| Related Endpoints | `POST /api/v1/auth/logout` |

### UC-07 - Reset Password

| Field | Description |
| --- | --- |
| Primary Actor | Any User |
| Trigger | User selects Forgot Password or submits reset OTP. |
| Description | Sends password reset OTP and updates password after verification. |
| Preconditions | Email belongs to a user account. |
| Postconditions | Password hash is updated; user can log in with new password. |
| Normal Flow | 1. User requests password reset. <br> 2. System sends OTP. <br> 3. User enters OTP and new password. <br> 4. System validates and updates password. |
| Exceptions | E1. Unknown email. <br> E2. OTP invalid/expired. <br> E3. Password fails validation. |
| Related Endpoints | `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password` |

### UC-08 - View and Update Own Profile

| Field | Description |
| --- | --- |
| Primary Actor | Authenticated User |
| Trigger | User opens profile/settings page. |
| Description | Allows a signed-in user to view or update their own profile fields. |
| Preconditions | User is authenticated. |
| Postconditions | Updated profile data is persisted and returned to frontend. |
| Normal Flow | 1. User opens profile. <br> 2. System loads current profile. <br> 3. User edits permitted fields. <br> 4. System validates and saves changes. |
| Exceptions | E1. Invalid field value. <br> E2. User not authenticated. |
| Related Endpoints | `GET /api/v1/me`, `GET /api/v1/me/profile`, `PATCH /api/v1/me/profile`, `GET /api/v1/me/id` |

### UC-09 - Connect Google Calendar and Create Meet Link

| Field | Description |
| --- | --- |
| Primary Actor | Admin, HR, Department Head |
| Trigger | User requests calendar authorization or Meet link generation. |
| Description | Supports Google Calendar integration for interview scheduling. |
| Preconditions | User has internal role; Google integration env is configured. |
| Postconditions | Calendar refresh token is stored or Meet link is created. |
| Normal Flow | 1. User requests auth URL. <br> 2. User completes OAuth callback. <br> 3. System stores refresh token. <br> 4. User creates Meet link for interview. |
| Exceptions | E1. OAuth callback invalid. <br> E2. Google API unavailable. |
| Related Endpoints | `GET /api/v1/google-calendar/auth-url`, `GET /api/v1/oauth2callback`, `POST /api/v1/google-calendar/meet` |

### UC-10 - Manage Users and Roles

| Field | Description |
| --- | --- |
| Primary Actor | Admin |
| Trigger | Admin opens Users management. |
| Description | Admin lists, creates, updates, deletes, activates/deactivates users, and changes roles. |
| Preconditions | Admin is authenticated. |
| Postconditions | User records and role/status settings are updated. |
| Normal Flow | 1. Admin opens Users. <br> 2. System lists users with filters. <br> 3. Admin creates/updates user or role/status. <br> 4. System validates and persists change. |
| Exceptions | E1. Email duplicate. <br> E2. Invalid role. <br> E3. User not found. |
| Related Endpoints | `GET /api/v1/users`, `POST /api/v1/users`, `GET /api/v1/users/:id`, `PATCH /api/v1/users/:id`, `DELETE /api/v1/users/:id`, `PATCH /api/v1/users/:id/role`, `PATCH /api/v1/users/:id/status` |

### UC-11 - Check User Email Availability

| Field | Description |
| --- | --- |
| Primary Actor | Admin, Public Registration Flow |
| Trigger | Email field needs uniqueness validation. |
| Description | Checks whether an email already belongs to an existing user. |
| Preconditions | Email input is provided. |
| Postconditions | Availability/exists result is returned. |
| Normal Flow | 1. Client submits email. <br> 2. System validates email format. <br> 3. System checks user table. <br> 4. System returns result. |
| Exceptions | E1. Invalid email format. |
| Related Endpoints | `GET /api/v1/users/email-exists` |

### UC-12 - Manage Organizations

| Field | Description |
| --- | --- |
| Primary Actor | Admin |
| Trigger | Admin opens organization administration. |
| Description | Creates, lists, views and updates organizations. |
| Preconditions | Admin is authenticated. |
| Postconditions | Organization data is persisted. |
| Normal Flow | 1. Admin opens Organizations. <br> 2. System lists records. <br> 3. Admin creates or edits organization. <br> 4. System validates and saves. |
| Exceptions | E1. Duplicate slug/name. <br> E2. Organization not found. |
| Related Endpoints | `POST /api/v1/organizations`, `GET /api/v1/organizations`, `GET /api/v1/organizations/:id`, `PATCH /api/v1/organizations/:id` |

### UC-13 - Manage Organization Settings

| Field | Description |
| --- | --- |
| Primary Actor | Admin |
| Trigger | Admin updates configurable organization settings. |
| Description | Stores organization-level settings used by workflows and UI. |
| Preconditions | Organization exists; Admin is authenticated. |
| Postconditions | Settings JSON is updated. |
| Normal Flow | 1. Admin opens settings. <br> 2. Admin updates setting values. <br> 3. System validates payload. <br> 4. System persists settings. |
| Exceptions | E1. Organization not found. <br> E2. Invalid settings payload. |
| Related Endpoints | `PATCH /api/v1/organizations/:id/settings` |

### UC-14 - Manage Departments

| Field | Description |
| --- | --- |
| Primary Actor | Admin |
| Trigger | Admin opens department management. |
| Description | Creates, lists, updates and deletes departments and department hierarchy/head. |
| Preconditions | Admin is authenticated; organization exists. |
| Postconditions | Department records are updated. |
| Normal Flow | 1. Admin lists departments. <br> 2. Admin creates/updates/deletes department. <br> 3. System validates organization, code and head user. <br> 4. System saves change. |
| Exceptions | E1. Duplicate department code. <br> E2. Invalid head user. <br> E3. Department not found. |
| Related Endpoints | `POST /api/v1/departments`, `GET /api/v1/departments`, `GET /api/v1/departments/:id`, `PATCH /api/v1/departments/:id`, `DELETE /api/v1/departments/:id` |

### UC-15 - Manage Department Team Members

| Field | Description |
| --- | --- |
| Primary Actor | Department Head |
| Trigger | Department Head updates department team settings. |
| Description | Adds or manages department members in the department settings screen. |
| Preconditions | Department Head is authenticated and owns/heads the department. |
| Postconditions | Department member/user record is created or updated. |
| Normal Flow | 1. Department Head opens Dept Settings. <br> 2. Adds team member. <br> 3. System validates department scope. <br> 4. System creates member account/profile. |
| Exceptions | E1. Email already exists. <br> E2. Department scope violation. |
| Related Endpoints | `POST /api/v1/dept-head/settings/team-members` |

### UC-16 - Create Recruitment Request

| Field | Description |
| --- | --- |
| Primary Actor | Department Head |
| Trigger | Department Head opens Create Request. |
| Description | Creates a draft staffing request for a department. |
| Preconditions | Department Head is authenticated and assigned to a department. |
| Postconditions | Recruitment request is created in `DRAFT` or submitted state depending on payload/action. |
| Normal Flow | 1. Actor enters position, headcount, urgency, requirements, JD and justification. <br> 2. System validates required fields. <br> 3. System saves request. |
| Exceptions | E1. Missing required field. <br> E2. User has no department. |
| Related Endpoints | `POST /api/v1/recruitment-requests` |

### UC-17 - Update Recruitment Request

| Field | Description |
| --- | --- |
| Primary Actor | Department Head, HR |
| Trigger | Authorized user edits request details. |
| Description | Updates request details while workflow state allows editing. |
| Preconditions | Request exists; actor has permission; status is editable for that actor. |
| Postconditions | Request data is updated and audit/log data may be created. |
| Normal Flow | 1. Actor opens request detail. <br> 2. Actor updates allowed fields. <br> 3. System validates status and ownership. <br> 4. System persists changes. |
| Exceptions | E1. Request not editable. <br> E2. Forbidden actor. |
| Related Endpoints | `GET /api/v1/recruitment-requests/:id`, `PATCH /api/v1/recruitment-requests/:id` |

### UC-18 - Submit Recruitment Request

| Field | Description |
| --- | --- |
| Primary Actor | Department Head |
| Trigger | Department Head submits draft or revised request. |
| Description | Sends request to HR review stage. |
| Preconditions | Request belongs to actor and contains required data. |
| Postconditions | Request status moves to pending HR review; log/notification is created. |
| Normal Flow | 1. Actor reviews request. <br> 2. Clicks Submit. <br> 3. System validates completeness. <br> 4. System updates status and creates log. |
| Exceptions | E1. Request incomplete. <br> E2. Request already submitted. |
| Related Endpoints | `PATCH /api/v1/recruitment-requests/:id/submit` |

### UC-19 - Assign Recruitment Request to HR

| Field | Description |
| --- | --- |
| Primary Actor | Admin, HR |
| Trigger | Authorized user assigns HR owner to a request. |
| Description | Assigns a recruitment request to the responsible HR user. |
| Preconditions | Request exists; assigned HR user is active. |
| Postconditions | Reviewed/assigned HR ownership is stored; notification/log may be created. |
| Normal Flow | 1. Actor selects request. <br> 2. Chooses HR assignee. <br> 3. System validates assignee role and active status. <br> 4. System updates request. |
| Exceptions | E1. Assignee invalid/inactive. <br> E2. Request not found. |
| Related Endpoints | `PATCH /api/v1/recruitment-requests/:id/assign` |

### UC-20 - Return Recruitment Request for Revision

| Field | Description |
| --- | --- |
| Primary Actor | HR |
| Trigger | HR finds request incomplete or unsuitable for forwarding. |
| Description | Sends request back to Department Head with revision feedback. |
| Preconditions | Request is pending HR review and actor is HR. |
| Postconditions | Request status becomes revision-needed or equivalent; feedback/log is stored. |
| Normal Flow | 1. HR reviews request. <br> 2. HR enters feedback. <br> 3. System validates reason. <br> 4. System updates status and notifies Department Head. |
| Exceptions | E1. Missing feedback. <br> E2. Invalid workflow state. |
| Related Endpoints | `PATCH /api/v1/recruitment-requests/:id/return-for-revision` |

### UC-21 - Request Changes from HR

| Field | Description |
| --- | --- |
| Primary Actor | Admin |
| Trigger | Admin requires HR to amend a forwarded request. |
| Description | Sends request back from Admin review to HR for additional changes. |
| Preconditions | Request is under Admin decision stage. |
| Postconditions | Request status and log reflect requested changes. |
| Normal Flow | 1. Admin opens approval detail. <br> 2. Admin requests changes with reason. <br> 3. System validates reason and updates request. <br> 4. System notifies HR. |
| Exceptions | E1. Missing reason. <br> E2. Invalid request state. |
| Related Endpoints | `PATCH /api/v1/recruitment-requests/:id/request-changes` |

### UC-22 - Forward Recruitment Request to Admin

| Field | Description |
| --- | --- |
| Primary Actor | HR |
| Trigger | HR completes review and forwards request. |
| Description | Moves request from HR review to Admin approval. |
| Preconditions | Request is pending HR review and actor has HR role. |
| Postconditions | Request status becomes pending Admin/Boss approval; notification/log is created. |
| Normal Flow | 1. HR opens request. <br> 2. HR reviews feasibility. <br> 3. HR forwards to Admin. <br> 4. System updates status and notifies Admin. |
| Exceptions | E1. Request not in review state. <br> E2. Actor lacks permission. |
| Related Endpoints | `PATCH /api/v1/recruitment-requests/:id/forward-to-admin` |

### UC-23 - Make Recruitment Request Decision

| Field | Description |
| --- | --- |
| Primary Actor | Admin, HR (workflow-scoped) |
| Trigger | Authorized decision-maker selects approve/reject/revision action. |
| Description | Records decision for a recruitment request. |
| Preconditions | Request is in a decision-capable state. |
| Postconditions | Request status, approval record, request log and notifications are updated. |
| Normal Flow | 1. Actor opens request detail. <br> 2. Actor selects decision. <br> 3. System validates reason when needed. <br> 4. System persists decision and logs transition. |
| Exceptions | E1. Missing reason. <br> E2. Stale state / duplicate decision. |
| Related Endpoints | `PATCH /api/v1/recruitment-requests/:id/decision` |

### UC-24 - Track Recruitment Request and Audit Logs

| Field | Description |
| --- | --- |
| Primary Actor | Admin, HR, Department Head |
| Trigger | User opens tracking, dashboard or audit view. |
| Description | Displays status timeline, latest logs, owner, tasks, interviews and offer counters. |
| Preconditions | User is authenticated and scoped to the request/report. |
| Postconditions | Tracking data is displayed. |
| Normal Flow | 1. User opens tracking screen. <br> 2. System checks role/scope. <br> 3. System reads RequestLog/AuditLog and related counters. <br> 4. System displays timeline. |
| Exceptions | E1. User lacks access. <br> E2. Request/log not found. |
| Related Endpoints | `GET /api/v1/recruitment-requests`, `GET /api/v1/reports/realtime-tracking`, `GET /api/v1/audit-logs` |

### UC-25 - Create Overall Plan

| Field | Description |
| --- | --- |
| Primary Actor | HR |
| Trigger | HR starts planning for an approved request. |
| Description | Creates campaign-level timeline and plan metadata. |
| Preconditions | Recruitment request is approved; no conflicting plan exists. |
| Postconditions | Overall plan is created and linked to request. |
| Normal Flow | 1. HR opens approved campaign/request. <br> 2. Enters start/end dates and notes. <br> 3. System validates timeline. <br> 4. System creates plan. |
| Exceptions | E1. Request not approved. <br> E2. Invalid date range. |
| Related Endpoints | `POST /api/v1/overall-plan`, `GET /api/v1/overall-plan/by-request/:requestId` |

### UC-26 - Submit / Resubmit Overall Plan

| Field | Description |
| --- | --- |
| Primary Actor | HR |
| Trigger | HR submits a draft/revised plan for Admin approval. |
| Description | Moves overall plan into approval workflow. |
| Preconditions | Plan exists; required task plan data is present. |
| Postconditions | Plan status becomes pending approval. |
| Normal Flow | 1. HR reviews plan and tasks. <br> 2. HR submits or resubmits plan. <br> 3. System validates completeness. <br> 4. System updates status and notifies Admin. |
| Exceptions | E1. Missing required tasks. <br> E2. Invalid plan state. |
| Related Endpoints | `PATCH /api/v1/overall-plan/:id/submit`, `PATCH /api/v1/overall-plan/:id/resubmit` |

### UC-27 - Approve / Reject Overall Plan

| Field | Description |
| --- | --- |
| Primary Actor | Admin |
| Trigger | Admin reviews submitted plan. |
| Description | Approves plan to unlock campaign execution or rejects with revision notes. |
| Preconditions | Plan is pending approval. |
| Postconditions | Plan becomes approved or rejected; related users are notified. |
| Normal Flow | 1. Admin opens plan detail. <br> 2. Admin approves or rejects. <br> 3. System validates reason for rejection. <br> 4. System updates plan status. |
| Exceptions | E1. Missing rejection reason. <br> E2. Invalid plan state. |
| Related Endpoints | `PATCH /api/v1/overall-plan/:id/approve`, `PATCH /api/v1/overall-plan/:id/reject` |

### UC-28 - Start Campaign

| Field | Description |
| --- | --- |
| Primary Actor | HR |
| Trigger | HR starts an approved overall plan. |
| Description | Moves campaign into active execution stage and notifies assigned HR members. |
| Preconditions | Overall plan is approved. |
| Postconditions | Campaign/request becomes active; downstream activities are unlocked. |
| Normal Flow | 1. HR opens approved plan. <br> 2. Clicks Start Campaign. <br> 3. System validates approval state. <br> 4. System updates campaign status and sends notifications. |
| Exceptions | E1. Plan not approved. <br> E2. Required task assignments missing. |
| Related Endpoints | `PATCH /api/v1/overall-plan/:id/start-campaign` |

### UC-29 - Create and Update Task Plan

| Field | Description |
| --- | --- |
| Primary Actor | HR |
| Trigger | HR manages campaign tasks. |
| Description | Creates or updates tasks within an overall plan. |
| Preconditions | Overall plan exists; actor has HR role. |
| Postconditions | Task plan is created/updated. |
| Normal Flow | 1. HR opens Task Planner. <br> 2. Enters task type, dates, assignee and notes. <br> 3. System validates dates and assignee. <br> 4. System saves task. |
| Exceptions | E1. Task outside plan timeline. <br> E2. Assignee invalid/inactive. |
| Related Endpoints | `POST /api/v1/task-plan`, `GET /api/v1/task-plan`, `PATCH /api/v1/task-plan/:id` |

### UC-30 - Assign HR Task

| Field | Description |
| --- | --- |
| Primary Actor | HR |
| Trigger | HR assigns an approved campaign task. |
| Description | Updates task assignee for campaign execution. |
| Preconditions | Task exists; assignee is active HR. |
| Postconditions | Task assigned user is updated and notified. |
| Normal Flow | 1. HR selects task. <br> 2. Chooses assignee. <br> 3. System validates HR role and active status. <br> 4. System updates task assignment. |
| Exceptions | E1. Invalid assignee. <br> E2. Task not found. |
| Related Endpoints | `PATCH /api/v1/task-plan/:id/assign-recruiter` |

### UC-31 - Update Task Status

| Field | Description |
| --- | --- |
| Primary Actor | HR |
| Trigger | Assigned HR progresses or completes a task. |
| Description | Updates task status in campaign workflow. |
| Preconditions | Task exists and user has permission. |
| Postconditions | Task status is updated; audit/reminder state may change. |
| Normal Flow | 1. HR opens task list. <br> 2. Changes status. <br> 3. System validates ownership/role. <br> 4. System saves status. |
| Exceptions | E1. Invalid status transition. <br> E2. Actor not allowed. |
| Related Endpoints | `PATCH /api/v1/task-plan/:id/status` |

### UC-32 - Manage Roles / Job Descriptions

| Field | Description |
| --- | --- |
| Primary Actor | Authenticated User |
| Trigger | User manages role/JD records used by recruiting workflows. |
| Description | Creates and queries role or job description records. |
| Preconditions | User is authenticated. |
| Postconditions | Role/JD data is created or retrieved. |
| Normal Flow | 1. User submits role/JD data. <br> 2. System validates fields. <br> 3. System stores or returns role/JD records. |
| Exceptions | E1. Invalid payload. <br> E2. Role/JD not found. |
| Related Endpoints | `POST /api/v1/roles`, `GET /api/v1/roles`, `GET /api/v1/roles/:id` |

### UC-33 - Manage Job Postings and Media

| Field | Description |
| --- | --- |
| Primary Actor | HR, Admin |
| Trigger | HR/Admin creates, updates, publishes or closes a job posting. |
| Description | Manages job postings derived from approved recruitment requests and campaign plans. |
| Preconditions | Actor has HR/Admin role; request/plan preconditions are satisfied where required. |
| Postconditions | Job posting is created, updated, published or closed. |
| Normal Flow | 1. Actor opens job posting workspace. <br> 2. Enters title, description, requirements, dates, visibility and media. <br> 3. System validates plan-lock and payload. <br> 4. System saves/publishes/closes posting. |
| Exceptions | E1. Plan-lock not satisfied. <br> E2. Invalid media/file data. |
| Related Endpoints | `POST /api/v1/job-postings`, `POST /api/v1/job-postings/media`, `GET /api/v1/job-postings`, `GET /api/v1/job-postings/:id`, `PATCH /api/v1/job-postings/:id`, `POST /api/v1/job-postings/:id/publish`, `POST /api/v1/job-postings/:id/close` |

### UC-34 - Browse Public Job Postings

| Field | Description |
| --- | --- |
| Primary Actor | Candidate, Public User |
| Trigger | User opens public job posting list/detail. |
| Description | Shows published job postings available to candidates. |
| Preconditions | Job posting exists and is public/published. |
| Postconditions | Public job information is displayed. |
| Normal Flow | 1. User opens public jobs page. <br> 2. System lists public postings. <br> 3. User opens a posting detail. |
| Exceptions | E1. Posting not published or not found. |
| Related Endpoints | `GET /api/v1/public/job-postings` |

### UC-35 - Manage Applications

| Field | Description |
| --- | --- |
| Primary Actor | Candidate, HR, Admin |
| Trigger | Candidate applies or authorized user manages applications. |
| Description | Creates, lists, views and updates candidate applications. |
| Preconditions | Actor is authenticated; candidate/request exists. |
| Postconditions | Application is created or status is updated. |
| Normal Flow | 1. Actor creates or opens applications. <br> 2. System scopes records by role. <br> 3. Actor views/updates status where allowed. |
| Exceptions | E1. Duplicate request-candidate application. <br> E2. Actor lacks permission. |
| Related Endpoints | `POST /api/v1/applications`, `GET /api/v1/applications`, `GET /api/v1/applications/:id`, `PATCH /api/v1/applications/:id/status` |

### UC-36 - Manage Invites

| Field | Description |
| --- | --- |
| Primary Actor | Authenticated User |
| Trigger | User creates or views invitation records. |
| Description | Supports candidate/user invitation workflows. |
| Preconditions | User is authenticated and target record exists. |
| Postconditions | Invite is created or listed. |
| Normal Flow | 1. User creates invite. <br> 2. System validates recipient/context. <br> 3. System stores invite. <br> 4. User lists existing invites. |
| Exceptions | E1. Invalid recipient. <br> E2. Duplicate invite. |
| Related Endpoints | `POST /api/v1/invites`, `GET /api/v1/invites` |

### UC-37 - Trigger and View Evaluations

| Field | Description |
| --- | --- |
| Primary Actor | Authenticated User |
| Trigger | User triggers candidate/role evaluation or views evaluation result. |
| Description | Creates evaluation run and retrieves evaluation output. |
| Preconditions | User is authenticated; evaluation target exists. |
| Postconditions | Evaluation run is stored and can be viewed. |
| Normal Flow | 1. User triggers evaluation. <br> 2. System creates evaluation run. <br> 3. User opens result. <br> 4. System returns evaluation details. |
| Exceptions | E1. Target not found. <br> E2. Evaluation service unavailable. |
| Related Endpoints | `POST /api/v1/evaluations`, `GET /api/v1/evaluations/:id` |

### UC-38 - Manage Candidate Profile and Avatar

| Field | Description |
| --- | --- |
| Primary Actor | Candidate, HR, Admin |
| Trigger | Candidate updates own profile or authorized user reviews candidate profile. |
| Description | Manages profile data and avatar file. |
| Preconditions | Candidate profile exists; actor is authorized. |
| Postconditions | Profile/avatar is retrieved or updated. |
| Normal Flow | 1. Actor opens profile. <br> 2. System returns scoped profile data. <br> 3. Candidate updates personal fields/avatar or HR/Admin updates allowed profile data. |
| Exceptions | E1. Profile not found. <br> E2. File type invalid. <br> E3. Actor not authorized. |
| Related Endpoints | `GET /api/v1/candidate-profiles/me`, `PATCH /api/v1/candidate-profiles/me`, `GET /api/v1/candidate-profiles/me/avatar`, `POST /api/v1/candidate-profiles/me/avatar`, `DELETE /api/v1/candidate-profiles/me/avatar`, `GET /api/v1/candidate-profiles`, `GET /api/v1/candidate-profiles/:id`, `GET /api/v1/candidate-profiles/:id/avatar`, `PATCH /api/v1/candidate-profiles/:id` |

### UC-39 - Upload and Manage Candidate CV

| Field | Description |
| --- | --- |
| Primary Actor | Candidate |
| Trigger | Candidate uploads, replaces or deletes CV. |
| Description | Stores candidate CV file and metadata. |
| Preconditions | Candidate is authenticated and file type/size is allowed. |
| Postconditions | CV record is created/updated/deleted and processing may be started. |
| Normal Flow | 1. Candidate opens Upload CV. <br> 2. Selects file. <br> 3. System validates file. <br> 4. System stores file and metadata. |
| Exceptions | E1. Invalid file type/size. <br> E2. Storage failure. |
| Related Endpoints | `GET /api/v1/candidate/cvs`, `POST /api/v1/candidate/cvs`, `PATCH /api/v1/candidate/cvs/:id/file`, `DELETE /api/v1/candidate/cvs/:id` |

### UC-40 - View Latest Candidate CV

| Field | Description |
| --- | --- |
| Primary Actor | Admin, HR, Department Head |
| Trigger | Authorized internal user opens candidate CV. |
| Description | Retrieves latest CV metadata or file for a candidate. |
| Preconditions | Candidate exists; actor has role-based access. |
| Postconditions | Latest CV data/file is returned. |
| Normal Flow | 1. User opens candidate profile. <br> 2. System checks role/scope. <br> 3. System returns latest CV metadata or streams file. |
| Exceptions | E1. CV not found. <br> E2. Unauthorized access. |
| Related Endpoints | `GET /api/v1/candidate/cvs/candidate/:candidateId/latest`, `GET /api/v1/candidate/cvs/candidate/:candidateId/latest/file` |

### UC-41 - Parse CV and Generate Embeddings

| Field | Description |
| --- | --- |
| Primary Actor | System / Worker |
| Trigger | CV is uploaded or processing job is queued. |
| Description | Extracts CV text/structured data and generates vector embeddings. |
| Preconditions | CV file is stored and readable; worker dependencies are available. |
| Postconditions | CandidateCV processing status, structured data and CvEmbedding records are updated. |
| Normal Flow | 1. Worker receives job. <br> 2. Extracts raw text. <br> 3. Parses structured resume data. <br> 4. Generates chunks and embeddings. <br> 5. Stores results and audit status. |
| Exceptions | E1. File cannot be parsed. <br> E2. Embedding generation fails. <br> E3. Job retry limit reached. |
| Related Components | `services/worker`, `packages/ai`, `candidate_cvs`, `cv_embeddings` |

### UC-42 - Search and Screen CV

| Field | Description |
| --- | --- |
| Primary Actor | HR, Admin |
| Trigger | User searches candidate CVs or screens candidate against a role. |
| Description | Finds CVs using query/filter and records screening status/analysis. |
| Preconditions | Actor is authenticated; candidate/profile/CV exists. |
| Postconditions | Search results or screening result is returned; screening state may update. |
| Normal Flow | 1. User submits query/filter or screen request. <br> 2. System validates access. <br> 3. System searches CV/profile data. <br> 4. System returns ranked or screened result. |
| Exceptions | E1. No matching CV. <br> E2. Candidate profile not found. |
| Related Endpoints | `POST /api/v1/cv/search`, `POST /api/v1/cv/:candidateProfileId/screen` |

### UC-43 - Search Talent and Record Search Feedback

| Field | Description |
| --- | --- |
| Primary Actor | HR, Admin |
| Trigger | User performs AI/vector talent search or gives feedback on search results. |
| Description | Searches candidate pool using natural language, skill graph and vector matching; stores feedback for improvement. |
| Preconditions | Candidate data and embeddings are available. |
| Postconditions | SearchRun and optional feedback records are stored. |
| Normal Flow | 1. User enters search query and filters. <br> 2. System expands skills and searches candidates. <br> 3. System returns ranked results. <br> 4. User records feedback on result relevance. |
| Exceptions | E1. Vector data unavailable. <br> E2. Invalid feedback payload. |
| Related Endpoints | `POST /api/v1/talent/search`, `POST /api/v1/talent/feedback` |

### UC-44 - Expand Talent Query / Export Feedback Triplets

| Field | Description |
| --- | --- |
| Primary Actor | HR, Admin |
| Trigger | User expands a skill query or exports feedback data. |
| Description | Supports explainable talent search and training/export workflows. |
| Preconditions | User is authenticated; export requires appropriate role. |
| Postconditions | Expanded query or feedback triplets are returned. |
| Normal Flow | 1. User requests query expansion/export. <br> 2. System validates role. <br> 3. System returns expanded skills or exported triplet data. |
| Exceptions | E1. Insufficient permission. <br> E2. No feedback data. |
| Related Endpoints | `GET /api/v1/talent/expand`, `GET /api/v1/talent/feedback/export-triplets` |

### UC-45 - Upload and View Documents / Evidence

| Field | Description |
| --- | --- |
| Primary Actor | Authenticated User |
| Trigger | User uploads document or views document/evidence records. |
| Description | Stores and retrieves recruitment documents and evidence records used in matching/evaluation. |
| Preconditions | User is authenticated; file/payload is valid. |
| Postconditions | Document/evidence record is created or returned. |
| Normal Flow | 1. User uploads or lists documents. <br> 2. System validates payload and role. <br> 3. System stores/returns document metadata. <br> 4. User can view evidence list/detail. |
| Exceptions | E1. Invalid file. <br> E2. Document/evidence not found. |
| Related Endpoints | `POST /api/v1/documents`, `GET /api/v1/documents`, `GET /api/v1/documents/:id`, `GET /api/v1/evidence`, `GET /api/v1/evidence/:id` |

### UC-46 - Schedule Interview

| Field | Description |
| --- | --- |
| Primary Actor | HR |
| Trigger | HR schedules an interview for a candidate. |
| Description | Creates interview schedule with candidate, request, date/time, duration, location and interviewer panel. |
| Preconditions | Campaign/request is in interview-capable state; plan-lock is satisfied; at least two active internal interviewers are selected. |
| Postconditions | InterviewSchedule is created; invitation can be sent. |
| Normal Flow | 1. HR selects candidate/request. <br> 2. Enters schedule details and panel. <br> 3. System validates panel, conflicts and plan-lock. <br> 4. System creates schedule. |
| Exceptions | E1. Time conflict. <br> E2. Panel has fewer than two valid interviewers. <br> E3. Plan-lock violation. |
| Related Endpoints | `POST /api/v1/interviews/schedules`, `GET /api/v1/interviews/schedules/:id`, `GET /api/v1/interviews/requests/:requestId/schedules` |

### UC-47 - Candidate Confirm / Request Reschedule / Cancel Interview

| Field | Description |
| --- | --- |
| Primary Actor | Candidate |
| Trigger | Candidate receives interview schedule. |
| Description | Candidate confirms attendance, requests reschedule or cancels interview with reason. |
| Preconditions | Candidate owns the interview invitation/schedule. |
| Postconditions | Interview state or candidate response state is updated; HR is notified. |
| Normal Flow | 1. Candidate opens interview detail. <br> 2. Chooses confirm/reschedule/cancel. <br> 3. System validates ownership. <br> 4. System updates schedule/request and sends notification. |
| Exceptions | E1. Candidate does not own schedule. <br> E2. Missing reason for change/cancel. |
| Related Endpoints | `POST /api/v1/interviews/schedules/:id/confirm`, `PATCH /api/v1/interviews/schedules/:id/candidate-reschedule`, `PATCH /api/v1/interviews/schedules/:id/candidate-cancel` |

### UC-48 - Reschedule or Cancel Interview

| Field | Description |
| --- | --- |
| Primary Actor | HR, Admin (cancel) |
| Trigger | Internal user needs to change interview schedule. |
| Description | Reschedules or cancels interview and notifies related parties. |
| Preconditions | Interview exists; actor is authorized. |
| Postconditions | Interview status/time is updated; timeline/email/notification records are updated. |
| Normal Flow | 1. Actor opens schedule. <br> 2. Selects reschedule/cancel. <br> 3. Enters new time or reason. <br> 4. System validates and persists changes. |
| Exceptions | E1. Time conflict. <br> E2. Missing cancellation reason. |
| Related Endpoints | `PATCH /api/v1/interviews/schedules/:id/reschedule`, `PATCH /api/v1/interviews/schedules/:id/cancel` |

### UC-49 - Send Interview Invitations and View Email Logs

| Field | Description |
| --- | --- |
| Primary Actor | HR, Admin |
| Trigger | Interview has been scheduled and invitation needs to be sent or audited. |
| Description | Sends interview email invitations and retrieves delivery logs. |
| Preconditions | Interview schedule exists; candidate/panel email data is available. |
| Postconditions | EmailLog records are created and retrievable. |
| Normal Flow | 1. Actor opens schedule. <br> 2. Sends invitations. <br> 3. System creates email jobs/logs. <br> 4. Actor views email logs. |
| Exceptions | E1. Email delivery fails. <br> E2. Schedule not found. |
| Related Endpoints | `POST /api/v1/interviews/schedules/:id/invitations`, `GET /api/v1/interviews/schedules/:id/email-logs` |

### UC-50 - View Completed Interviews and Interview Details

| Field | Description |
| --- | --- |
| Primary Actor | Admin, HR, Department Head |
| Trigger | User opens completed interviews or interview result detail. |
| Description | Displays completed/past interviews with candidate, schedule and feedback details scoped by role. |
| Preconditions | User is authenticated and authorized for interview/request. |
| Postconditions | Interview list/detail is displayed. |
| Normal Flow | 1. User opens interview results/details. <br> 2. System checks role and scope. <br> 3. System returns completed interviews and selected detail. |
| Exceptions | E1. Interview not found. <br> E2. Actor not in permitted scope. |
| Related Endpoints | `GET /api/v1/interviews/completed`, `GET /api/v1/interviews/:id/details`, `GET /api/v1/hr-interview-results`, `GET /api/v1/hr-interview-results/:id`, `GET /api/v1/admin-interview-results`, `GET /api/v1/dept-head-interview-feedback`, `GET /api/v1/dept-head-interview-feedback/:id` |

### UC-51 - Submit Interview Panel Feedback

| Field | Description |
| --- | --- |
| Primary Actor | HR, Department Head |
| Trigger | Evaluator completes interview feedback form. |
| Description | Records individual panel feedback, decision and scores. |
| Preconditions | Interview is completed or feedback is allowed; evaluator is part of scope/panel. |
| Postconditions | InterviewResult/feedback is stored. |
| Normal Flow | 1. Evaluator opens feedback screen. <br> 2. Enters decision, technical/communication/culture scores and notes. <br> 3. System validates evaluator access. <br> 4. System saves feedback. |
| Exceptions | E1. Evaluator not allowed. <br> E2. Missing required notes/scores. |
| Related Endpoints | `POST /api/v1/interviews/:id/my-feedback`, `POST /api/v1/hr-interview-results/:id/my-feedback`, `POST /api/v1/dept-head-interview-feedback/:id/my-feedback` |

### UC-52 - Record Interview Result and Final Recommendation

| Field | Description |
| --- | --- |
| Primary Actor | HR |
| Trigger | HR consolidates panel feedback after interview. |
| Description | Records interview result and final HR recommendation/summary notes. |
| Preconditions | Interview schedule exists and HR is authorized. |
| Postconditions | Result/recommendation is stored; request may move toward decision stage. |
| Normal Flow | 1. HR opens interview result detail. <br> 2. Records result or final recommendation. <br> 3. System validates payload and access. <br> 4. System saves result. |
| Exceptions | E1. Interview not found. <br> E2. Invalid result/recommendation. |
| Related Endpoints | `POST /api/v1/interviews/schedules/:id/results`, `POST /api/v1/interviews/:id/results`, `POST /api/v1/hr-interview-results/:id/final-recommendation` |

### UC-53 - Admin Review Interview Results

| Field | Description |
| --- | --- |
| Primary Actor | Admin |
| Trigger | Admin opens Admin Interview Results. |
| Description | Allows Admin to review completed interviews and choose decision action. |
| Preconditions | Admin is authenticated; interview results exist. |
| Postconditions | Admin sees decision-ready interview results. |
| Normal Flow | 1. Admin opens result list. <br> 2. System loads completed/interview result data. <br> 3. Admin opens detail and reviews feedback. |
| Exceptions | E1. No result data. <br> E2. Admin lacks active account status. |
| Related Endpoints | `GET /api/v1/admin-interview-results` |

### UC-54 - Make Final Hiring Decision / Request More Information

| Field | Description |
| --- | --- |
| Primary Actor | Admin |
| Trigger | Admin decides after reviewing interview results. |
| Description | Admin makes final HIRE/REJECT decision or asks HR for additional information. |
| Preconditions | Request/candidate/interview result exists and is decision-ready. |
| Postconditions | Hiring decision is logged; offer or rejection flow is triggered, or request-info action is stored. |
| Normal Flow | 1. Admin opens decision screen. <br> 2. Selects HIRE, REJECT or request-info. <br> 3. System validates required fields. <br> 4. System updates workflow and creates related notifications/offers/rejections. |
| Exceptions | E1. Missing compensation/start date for HIRE. <br> E2. Missing reason for REJECT/request-info. |
| Related Endpoints | `POST /api/v1/hiring-decisions/:requestId`, `POST /api/v1/hiring-decisions/:requestId/request-info`, `POST /api/v1/admin-interview-results/:requestId/decision`, `POST /api/v1/admin-interview-results/:requestId/request-info` |

### UC-55 - Generate, View and Send Offer Letter

| Field | Description |
| --- | --- |
| Primary Actor | HR, Admin |
| Trigger | Candidate is selected for hire. |
| Description | Generates offer letter, allows review, sends offer and tracks status. |
| Preconditions | Candidate/request decision permits offer; compensation/start date are available. |
| Postconditions | OfferLetter is created/sent; EmailLog/Notification records are updated. |
| Normal Flow | 1. HR/Admin generates offer. <br> 2. Reviews offer detail. <br> 3. Sends offer. <br> 4. System logs send status and notifies candidate. |
| Exceptions | E1. Duplicate offer for same request/candidate. <br> E2. Email send failure. |
| Related Endpoints | `POST /api/v1/offers`, `GET /api/v1/offers/:id`, `POST /api/v1/offers/:id/send` |

### UC-56 - Respond to Offer

| Field | Description |
| --- | --- |
| Primary Actor | Candidate |
| Trigger | Candidate receives an offer. |
| Description | Candidate accepts or declines offer and may add response note. |
| Preconditions | Offer has been sent and belongs to candidate. |
| Postconditions | Offer response, note and timestamp are persisted; HR/Admin are notified. |
| Normal Flow | 1. Candidate opens offer detail. <br> 2. Reviews offer. <br> 3. Selects ACCEPT or DECLINE. <br> 4. System validates ownership and saves response. |
| Exceptions | E1. Offer not owned by candidate. <br> E2. Offer already responded/expired. |
| Related Endpoints | `POST /api/v1/offers/:id/respond` |

### UC-57 - Manage Notifications

| Field | Description |
| --- | --- |
| Primary Actor | Authenticated User |
| Trigger | User opens notification center or notification event occurs. |
| Description | Lists, reads, marks unread, deletes and marks all notifications as read. |
| Preconditions | User is authenticated. |
| Postconditions | Notification state is displayed or updated. |
| Normal Flow | 1. User opens Notifications. <br> 2. System lists own notifications. <br> 3. User marks read/unread, deletes one, or marks all read. |
| Alternative Flows | A1. User receives realtime notification through SSE stream if enabled. |
| Exceptions | E1. Notification not owned by user. <br> E2. Notification not found. |
| Related Endpoints | `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read`, `PATCH /api/v1/notifications/:id/unread`, `DELETE /api/v1/notifications/:id`, `POST /api/v1/notifications/mark-all-read`, `GET /api/v1/notifications/sse` |

### UC-58 - View Dashboards

| Field | Description |
| --- | --- |
| Primary Actor | Admin, HR, Department Head, Candidate |
| Trigger | User logs in or opens dashboard route. |
| Description | Displays role-specific overview and primary actions. |
| Preconditions | User is authenticated with valid role. |
| Postconditions | Correct dashboard and navigation are displayed. |
| Normal Flow | 1. User logs in. <br> 2. Frontend reads role. <br> 3. User is routed to Admin, HR, Department Head or Candidate dashboard. <br> 4. Dashboard loads scoped widgets. |
| Exceptions | E1. Role mismatch for route. <br> E2. Unknown role. |
| Related Screens | `webapp/src/App.tsx`, `webapp/src/metadata.json` |

### UC-59 - View Reports and Export Annual Report

| Field | Description |
| --- | --- |
| Primary Actor | Admin, HR, Department Head |
| Trigger | Authorized user opens reporting screen. |
| Description | Provides admin dashboard metrics, annual report, department statistics, time-to-hire, pipeline overview and realtime tracking. |
| Preconditions | User is authenticated and authorized for selected report. |
| Postconditions | Report data or export file is returned. |
| Normal Flow | 1. User opens report. <br> 2. Selects filter/year/date range. <br> 3. System validates scope. <br> 4. System aggregates and returns report data/export. |
| Exceptions | E1. User lacks permission. <br> E2. No data for selected range. |
| Related Endpoints | `GET /api/v1/reports/admin-dashboard`, `GET /api/v1/reports/annual`, `GET /api/v1/reports/departments`, `GET /api/v1/reports/department/:id`, `GET /api/v1/reports/time-to-hire`, `GET /api/v1/reports/pipeline`, `GET /api/v1/reports/annual/export`, `GET /api/v1/reports/realtime-tracking` |

### UC-60 - Access Protected Route / API

| Field | Description |
| --- | --- |
| Primary Actor | Authenticated User |
| Trigger | User navigates to protected screen or calls protected API. |
| Description | Enforces JWT authentication and role authorization. |
| Preconditions | Protected route/API exists. |
| Postconditions | Request is allowed or denied. |
| Normal Flow | 1. User requests route/API. <br> 2. System validates JWT. <br> 3. System checks required role. <br> 4. System returns resource or denies access. |
| Alternative Flows | A1. Public endpoint bypasses JWT. |
| Exceptions | E1. Missing/expired token. <br> E2. Role mismatch. |
| Related Components | Gateway `JwtAuthGuard`, `RolesGuard`, frontend `ProtectedRoute` |

### UC-61 - Monitor System Health

| Field | Description |
| --- | --- |
| Primary Actor | Admin, System |
| Trigger | Monitoring tool or user calls health endpoint. |
| Description | Reports Gateway and microservice health. |
| Preconditions | Gateway is running. |
| Postconditions | Health response is returned. |
| Normal Flow | 1. Monitoring client calls health endpoint. <br> 2. Gateway checks configured services. <br> 3. System returns health result. |
| Exceptions | E1. One or more service checks fail. |
| Related Endpoints | `GET /api/v1/health` |

## 4. Cross-Cutting Business Rules

| ID | Rule |
| --- | --- |
| BR-01 | All protected APIs require valid JWT. |
| BR-02 | Role-specific APIs require matching role. Current HR role is unified as `HR_LEADER` in code and represented as HR in user-facing documentation. |
| BR-03 | Department Head can create and track recruitment requests for their department scope. |
| BR-04 | HR reviews and operationalizes recruitment workflow but Admin remains final approval/decision owner where required. |
| BR-05 | Rejection, revision, cancellation and request-info actions require a reason. |
| BR-06 | Recruitment execution is plan-locked: downstream actions require approved request, approved overall plan and relevant task plan. |
| BR-07 | Interview schedules require at least two distinct active internal interviewers. |
| BR-08 | Candidate can only manage their own profile, CV, interview responses and offer responses. |
| BR-09 | Offer response can be submitted only by the owner candidate and should persist response, note and timestamp. |
| BR-10 | Request/plan/task/interview/CV status changes must be traceable through RequestLog or AuditLog. |
| BR-11 | AI/vector search supports parsing and discovery; final hiring decisions remain human-controlled. |
| BR-12 | Deadline reminders must be idempotent and skip completed tasks. |
