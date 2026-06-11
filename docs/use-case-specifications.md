# Use Case Specifications - Recruitment Management System (RMS)

Created By: Business Analyst / 2026-06-08

## UC-01 - Register Account

| Field | Description |
|---|---|
| UC ID and Name | UC-01 - Register Account |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | Candidate |
| Trigger | Candidate selects Sign Up and submits registration information. |
| Description | Allows a new candidate to create an account before using candidate self-service features. |
| Preconditions | Candidate is not logged in; registration page is available. |
| Postconditions | Registration information is stored pending email verification; OTP is sent to the candidate email. |
| Normal Flow | 1. Candidate opens Sign Up. <br> 2. Candidate enters email, display name, password, and role. <br> 3. System validates input. <br> 4. System creates pending account. <br> 5. System sends OTP verification email. <br> 6. System redirects candidate to email verification screen. |
| Alternative Flows | A1. Candidate already has an account: system prompts candidate to login instead. |
| Exceptions | E1. Email already exists: system rejects registration and displays error. <br> E2. Invalid input: system highlights invalid fields. <br> E3. Email service unavailable: system stores request state and informs user to retry OTP sending. |
| Priority | High |
| Frequency of Use | Whenever a new candidate joins the system. |
| Business Rules | Email must be unique. Password must satisfy system validation rules. Candidate registration must be verified by OTP before full access. |
| Other Information | Implemented through public authentication endpoints. |
| Assumptions | SMTP/notification service is configured and reachable. |

## UC-02 - Verify Registration Email

| Field | Description |
|---|---|
| UC ID and Name | UC-02 - Verify Registration Email |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | Candidate |
| Trigger | Candidate enters OTP received by email. |
| Description | Confirms ownership of the registered email address and activates candidate access. |
| Preconditions | Candidate has submitted registration and received OTP. |
| Postconditions | Candidate account is verified; candidate may access the candidate dashboard. |
| Normal Flow | 1. Candidate opens OTP verification screen. <br> 2. Candidate enters OTP code. <br> 3. System validates OTP. <br> 4. System marks account as verified. <br> 5. System signs candidate in or redirects to login/dashboard. |
| Alternative Flows | A1. Candidate requests resend OTP: system sends a new OTP if allowed. |
| Exceptions | E1. OTP invalid: system displays verification error. <br> E2. OTP expired: system requires resend. |
| Priority | High |
| Frequency of Use | Once per registration, with possible resend attempts. |
| Business Rules | OTP must match the latest active code and be within expiry time. |
| Other Information | OTP screen is represented as a popup/verification step in the screen flow. |
| Assumptions | Candidate has access to the registered mailbox. |

## UC-03 - Login

| Field | Description |
|---|---|
| UC ID and Name | UC-03 - Login |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | Admin, Department Head, HR Manager, Candidate |
| Trigger | User submits email and password on Login screen. |
| Description | Authenticates a user and routes them to the dashboard matching their role. |
| Preconditions | User has an active account. Gateway and Identity service are available. |
| Postconditions | Access token and refresh token are issued; user is redirected to the proper role dashboard. |
| Normal Flow | 1. User opens Login screen. <br> 2. User enters email and password. <br> 3. System validates credentials. <br> 4. System generates JWT access token and refresh token. <br> 5. System returns authenticated user profile. <br> 6. Frontend redirects user based on role. |
| Alternative Flows | A1. User selects Forgot Password before logging in. |
| Exceptions | E1. Invalid credentials: system displays login error. <br> E2. Inactive account: system prevents access. <br> E3. Unknown role: system redirects to Unauthorized screen. |
| Priority | High |
| Frequency of Use | Daily or whenever session expires. |
| Business Rules | Only authenticated users can access protected screens. Role determines landing dashboard and allowed routes. |
| Other Information | JWT is validated at Gateway by global authentication guard. |
| Assumptions | JWT secret and token expiry are configured correctly in environment variables. |

## UC-04 - Refresh Session

| Field | Description |
|---|---|
| UC ID and Name | UC-04 - Refresh Session |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | Authenticated User |
| Trigger | Access token expires while the user still has a valid refresh token. |
| Description | Issues a new access token and rotates refresh token without requiring login again. |
| Preconditions | User owns a valid refresh token stored in Redis. |
| Postconditions | Old refresh token is revoked; new access and refresh tokens are issued. |
| Normal Flow | 1. Client sends refresh token. <br> 2. System hashes and verifies refresh token in Redis. <br> 3. System loads user profile. <br> 4. System deletes old refresh token. <br> 5. System issues new token pair. |
| Alternative Flows | None. |
| Exceptions | E1. Refresh token expired or missing: system returns unauthorized. <br> E2. User no longer exists: system revokes token and returns unauthorized. |
| Priority | High |
| Frequency of Use | Automatically during active sessions. |
| Business Rules | Refresh tokens must be random, hashed at rest, stored with TTL, and rotated on use. |
| Other Information | Supports stateless JWT access control. |
| Assumptions | Redis is available. |

## UC-05 - Logout

| Field | Description |
|---|---|
| UC ID and Name | UC-05 - Logout |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | Authenticated User |
| Trigger | User selects Logout. |
| Description | Ends the current user session and revokes the refresh token. |
| Preconditions | User has an active session. |
| Postconditions | Refresh token is removed from Redis; client clears local session state. |
| Normal Flow | 1. User clicks Logout. <br> 2. System shows confirmation. <br> 3. User confirms. <br> 4. Client sends refresh token to logout endpoint. <br> 5. System revokes refresh token. <br> 6. Client clears token and redirects to Login. |
| Alternative Flows | A1. User cancels confirmation: session remains active. |
| Exceptions | E1. Refresh token already invalid: system still returns success for idempotency. |
| Priority | High |
| Frequency of Use | Whenever users finish a working session. |
| Business Rules | Logout should be idempotent and should not reveal whether a refresh token existed. |
| Other Information | Confirmation is represented as a popup in screen flow. |
| Assumptions | Client can clear locally stored auth state. |

## UC-06 - Reset Password

| Field | Description |
|---|---|
| UC ID and Name | UC-06 - Reset Password |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | User |
| Trigger | User selects Forgot Password. |
| Description | Allows a user to reset password using email OTP verification. |
| Preconditions | User account exists and email service is available. |
| Postconditions | User password is updated; user can login using new password. |
| Normal Flow | 1. User opens Forgot Password. <br> 2. User enters email. <br> 3. System sends OTP. <br> 4. User enters OTP and new password. <br> 5. System validates OTP. <br> 6. System updates password hash. <br> 7. System redirects user to Login. |
| Alternative Flows | A1. User requests a new OTP if the previous one expires. |
| Exceptions | E1. Invalid OTP: system rejects reset. <br> E2. Weak password: system displays validation error. |
| Priority | High |
| Frequency of Use | Occasionally, when users forget passwords. |
| Business Rules | OTP must expire after a configured time. Password must be stored as a hash, never plaintext. |
| Other Information | Uses public auth endpoints. |
| Assumptions | User has access to registered email. |

## UC-07 - Manage Users and Roles

| Field | Description |
|---|---|
| UC ID and Name | UC-07 - Manage Users and Roles |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | Admin |
| Trigger | Admin opens User Management screen. |
| Description | Enables Admin to list users, create users, update profile data, assign roles, activate or deactivate users. |
| Preconditions | Admin is authenticated and authorized with ADMIN role. |
| Postconditions | User records and access roles are updated. |
| Normal Flow | 1. Admin opens Users screen. <br> 2. System displays paginated users. <br> 3. Admin searches or filters by role/status. <br> 4. Admin selects a user. <br> 5. Admin updates role, status, or details. <br> 6. System validates and saves changes. |
| Alternative Flows | A1. Admin creates a new internal user. <br> A2. Admin deactivates instead of deleting user. |
| Exceptions | E1. Invalid role: system rejects update. <br> E2. Unauthorized role: system returns forbidden. |
| Priority | High |
| Frequency of Use | Weekly or whenever organizational access changes. |
| Business Rules | Only ADMIN can manage users and roles. Role values must be ADMIN, DEPARTMENT_HEAD, HR_MANAGER, or CANDIDATE. |
| Other Information | Controlled by Gateway RolesGuard. |
| Assumptions | User data is stored in shared PostgreSQL through Identity service. |

## UC-08 - Manage Organizations and Departments

| Field | Description |
|---|---|
| UC ID and Name | UC-08 - Manage Organizations and Departments |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | Admin |
| Trigger | Admin opens organization or department management function. |
| Description | Allows Admin to maintain organizations, department hierarchy, and department head assignment. |
| Preconditions | Admin is authenticated and authorized. |
| Postconditions | Organization and department data are created or updated. |
| Normal Flow | 1. Admin opens Settings or Department section. <br> 2. System displays existing organizations/departments. <br> 3. Admin creates or updates a department. <br> 4. Admin optionally assigns department head. <br> 5. System validates assigned user role. <br> 6. System saves department data. |
| Alternative Flows | A1. HR Manager views department list for recruitment coordination. |
| Exceptions | E1. Assigned user is not DEPARTMENT_HEAD: system rejects assignment. <br> E2. Duplicate department code/name: system rejects save. |
| Priority | High |
| Frequency of Use | During setup and organizational changes. |
| Business Rules | Department head assignment must reference a user with DEPARTMENT_HEAD role. Only ADMIN can create/update departments. |
| Other Information | Departments are used to scope requests and reports. |
| Assumptions | Organization exists before department creation. |

## UC-09 - Create Recruitment Request

| Field | Description |
|---|---|
| UC ID and Name | UC-09 - Create Recruitment Request |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | Department Head |
| Trigger | Department Head selects Create Request. |
| Description | Allows Department Head to create a staffing request for their department. |
| Preconditions | Department Head is authenticated and assigned to a department. |
| Postconditions | Draft recruitment request is created. |
| Normal Flow | 1. Department Head opens Create Request screen. <br> 2. Enters position, headcount, urgency, requirements, notes, and expected timeline. <br> 3. System validates required fields. <br> 4. System saves request as DRAFT. |
| Alternative Flows | A1. Department Head saves draft without submitting. |
| Exceptions | E1. Missing required field: system displays validation error. <br> E2. User has no department: system prevents request creation. |
| Priority | High |
| Frequency of Use | Whenever a department needs new staff. |
| Business Rules | Only DEPARTMENT_HEAD can create recruitment requests. Initial status must be DRAFT. |
| Other Information | Request is later submitted to HR review. |
| Assumptions | Department data is accurate. |

## UC-10 - Edit Draft Recruitment Request

| Field | Description |
|---|---|
| UC ID and Name | UC-10 - Edit Draft Recruitment Request |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | Department Head |
| Trigger | Department Head opens an existing draft or revision-needed request. |
| Description | Allows Department Head to update request content before submission or resubmission. |
| Preconditions | Request belongs to the actor's department and is editable. |
| Postconditions | Request details are updated. |
| Normal Flow | 1. Department Head opens My Requests. <br> 2. Selects editable request. <br> 3. Updates request information. <br> 4. System validates changes. <br> 5. System saves updated draft. |
| Alternative Flows | A1. Department Head cancels edits and returns to request list. |
| Exceptions | E1. Request not in editable state: system rejects update. <br> E2. User is not owner/department head: system returns forbidden. |
| Priority | Medium |
| Frequency of Use | Before submission or after revision request. |
| Business Rules | Only DRAFT or REVISION_NEEDED requests may be edited by Department Head. |
| Other Information | Audit logs should capture significant updates. |
| Assumptions | Request lifecycle state is reliable. |

## UC-11 - Submit Recruitment Request

| Field | Description |
|---|---|
| UC ID and Name | UC-11 - Submit Recruitment Request |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | Department Head |
| Trigger | Department Head clicks Submit on a draft request. |
| Description | Sends a recruitment request to HR Manager for review. |
| Preconditions | Request exists, belongs to actor's department, and is in DRAFT or revised state. |
| Postconditions | Request status changes to pending HR review; HR receives notification. |
| Normal Flow | 1. Department Head reviews request. <br> 2. Clicks Submit. <br> 3. System validates completeness. <br> 4. System updates request status. <br> 5. System creates audit log. <br> 6. System notifies HR Manager. |
| Alternative Flows | None. |
| Exceptions | E1. Incomplete request: system blocks submission. <br> E2. Request already submitted: system displays current status. |
| Priority | High |
| Frequency of Use | Each time a department initiates hiring. |
| Business Rules | Submitted request cannot be edited unless revision is requested. |
| Other Information | Status drives downstream workflow. |
| Assumptions | Notification service is available or queue-backed. |

## UC-12 - Review and Forward Recruitment Request

| Field | Description |
|---|---|
| UC ID and Name | UC-12 - Review and Forward Recruitment Request |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | HR Manager |
| Trigger | HR Manager opens Request Queue. |
| Description | Allows HR Manager to review department requests and forward valid requests to Admin/Boss. |
| Preconditions | HR Manager is authenticated; request is pending HR review. |
| Postconditions | Request is forwarded for Admin approval or remains pending with required corrections. |
| Normal Flow | 1. HR Manager opens Request Queue. <br> 2. System lists submitted requests. <br> 3. HR Manager opens request detail. <br> 4. HR Manager reviews feasibility and completeness. <br> 5. HR Manager forwards request to Boss. <br> 6. System updates status and creates notification. |
| Alternative Flows | A1. HR Manager requests clarification from Department Head. |
| Exceptions | E1. Request not found: system displays error. <br> E2. User lacks HR_MANAGER role: system returns forbidden. |
| Priority | High |
| Frequency of Use | Daily during recruitment operations. |
| Business Rules | HR Manager cannot approve final request; only forwards to Admin/Boss. |
| Other Information | Supports approval chain Department Head -> HR Manager -> Admin. |
| Assumptions | HR Manager has visibility into assigned or relevant requests. |

## UC-13 - Approve or Reject Recruitment Request

| Field | Description |
|---|---|
| UC ID and Name | UC-13 - Approve or Reject Recruitment Request |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | Admin |
| Trigger | Admin opens Approval Queue. |
| Description | Allows Admin/Boss to approve, reject, or request revision for recruitment requests. |
| Preconditions | Admin is authenticated; request is pending Boss approval. |
| Postconditions | Request status becomes approved, rejected, or revision needed; involved users are notified. |
| Normal Flow | 1. Admin opens Approval Queue. <br> 2. System displays pending requests. <br> 3. Admin opens request details. <br> 4. Admin reviews business need and constraints. <br> 5. Admin selects Approve or Reject. <br> 6. System records decision, reason if any, audit log, and notifications. |
| Alternative Flows | A1. Admin requests revision instead of final approve/reject. |
| Exceptions | E1. Request not in approval state: system blocks decision. <br> E2. Missing rejection/revision reason: system prompts for reason. |
| Priority | High |
| Frequency of Use | Daily or weekly depending on hiring volume. |
| Business Rules | Only ADMIN can issue final request approval or rejection. Rejection/revision must include a reason. |
| Other Information | Decision is visible in tracking and reports. |
| Assumptions | Admin has authority to approve recruitment budget/headcount. |

## UC-14 - Track Recruitment Request

| Field | Description |
|---|---|
| UC ID and Name | UC-14 - Track Recruitment Request |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | Department Head |
| Trigger | Department Head opens My Requests. |
| Description | Allows Department Head to monitor lifecycle status, owner, progress, and audit trail of department requests. |
| Preconditions | Department Head is authenticated and has submitted or draft requests. |
| Postconditions | Request progress is displayed. |
| Normal Flow | 1. Department Head opens My Requests. <br> 2. System displays filtered request list. <br> 3. Department Head selects a request. <br> 4. System displays status, tracking data, audit trail, and related interviews. |
| Alternative Flows | A1. Department Head filters by status. |
| Exceptions | E1. No requests exist: system displays empty state. |
| Priority | High |
| Frequency of Use | Frequently during active recruitment. |
| Business Rules | Department Head can only view own department request scope. |
| Other Information | Admin and HR can also view request lists according to role scope. |
| Assumptions | Audit and status data are updated consistently. |

## UC-15 - Create and Submit Recruitment Plan

| Field | Description |
|---|---|
| UC ID and Name | UC-15 - Create and Submit Recruitment Plan |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | HR Manager |
| Trigger | HR Manager starts planning after request approval. |
| Description | Allows HR Manager to create an overall recruitment plan and submit it for Admin approval. |
| Preconditions | Recruitment request is approved. HR Manager is authenticated. |
| Postconditions | Plan is created and submitted for Admin approval. |
| Normal Flow | 1. HR Manager opens Campaigns. <br> 2. Selects approved request. <br> 3. Creates overall plan with campaign dates and scope. <br> 4. Adds execution details. <br> 5. Submits plan for approval. <br> 6. System notifies Admin. |
| Alternative Flows | A1. HR Manager saves plan as draft before submitting. |
| Exceptions | E1. Request not approved: system prevents plan creation. <br> E2. Invalid dates: system displays validation error. |
| Priority | High |
| Frequency of Use | For every approved recruitment request. |
| Business Rules | No recruitment execution may start without an approved plan. |
| Other Information | Implements plan-locked execution model. |
| Assumptions | HR Manager has enough information to plan campaign timeline. |

## UC-16 - Approve or Request Revision for Recruitment Plan

| Field | Description |
|---|---|
| UC ID and Name | UC-16 - Approve or Request Revision for Recruitment Plan |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | Admin |
| Trigger | Admin receives submitted plan approval request. |
| Description | Allows Admin to review recruitment plan and either approve it or request revision. |
| Preconditions | Plan has been submitted by HR Manager. |
| Postconditions | Plan becomes approved/active or revision needed; HR Manager is notified. |
| Normal Flow | 1. Admin opens Approval Queue. <br> 2. Opens submitted plan. <br> 3. Reviews timeline, task scope, and resource assumptions. <br> 4. Approves plan. <br> 5. System marks plan active and unlocks execution. |
| Alternative Flows | A1. Admin requests revision with notes. |
| Exceptions | E1. Plan already approved/rejected: system prevents duplicate action. <br> E2. Missing revision notes: system prompts Admin. |
| Priority | High |
| Frequency of Use | For every recruitment campaign. |
| Business Rules | Only ADMIN can approve recruitment plans. Approved plan is required before CV search/interview execution. |
| Other Information | Plan revision dialog appears as popup. |
| Assumptions | Admin has enough context to evaluate plan feasibility. |

## UC-17 - Manage Plan Tasks

| Field | Description |
|---|---|
| UC ID and Name | UC-17 - Manage Plan Tasks |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | HR Manager |
| Trigger | HR Manager opens Task Planner. |
| Description | Allows HR Manager to add, update, assign, and track recruitment execution tasks. |
| Preconditions | Recruitment plan exists and is editable or active. |
| Postconditions | Task plan is updated and task statuses reflect execution progress. |
| Normal Flow | 1. HR Manager opens Task Planner. <br> 2. Selects campaign/plan. <br> 3. Adds task or updates existing task. <br> 4. Assigns owner and due date. <br> 5. Updates task status as work progresses. <br> 6. System saves task changes. |
| Alternative Flows | A1. HR Manager updates only task status. |
| Exceptions | E1. Plan is locked or invalid state: system blocks changes. |
| Priority | High |
| Frequency of Use | Daily during active campaigns. |
| Business Rules | Tasks must belong to a valid recruitment plan. Task changes must respect plan-lock rules. |
| Other Information | Typical tasks include job posting, CV collection, screening, and interview coordination. |
| Assumptions | HR team uses the task plan as operational source of truth. |

## UC-18 - Update Candidate Profile

| Field | Description |
|---|---|
| UC ID and Name | UC-18 - Update Candidate Profile |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | Candidate |
| Trigger | Candidate opens My Profile. |
| Description | Allows candidate to maintain personal information, experience, and skills. |
| Preconditions | Candidate is authenticated. |
| Postconditions | Candidate profile is updated. |
| Normal Flow | 1. Candidate opens My Profile. <br> 2. Updates contact information, experience, and skills. <br> 3. System validates input. <br> 4. System saves profile. |
| Alternative Flows | A1. Candidate updates missing information from notification link. |
| Exceptions | E1. Invalid data format: system displays validation error. |
| Priority | Medium |
| Frequency of Use | Occasionally, whenever candidate information changes. |
| Business Rules | Candidate may update only their own profile. |
| Other Information | HR and Admin may view candidate profile according to role permissions. |
| Assumptions | Profile ownership is correctly linked to user account. |

## UC-19 - Upload CV

| Field | Description |
|---|---|
| UC ID and Name | UC-19 - Upload CV |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | Candidate |
| Trigger | Candidate selects Upload CV. |
| Description | Allows candidate to upload PDF/DOCX CV for parsing and search indexing. |
| Preconditions | Candidate is authenticated. File meets accepted format requirements. |
| Postconditions | CV document is stored; parsing and embedding job is queued or completed. |
| Normal Flow | 1. Candidate opens Upload CV. <br> 2. Selects CV file. <br> 3. System validates file type and size. <br> 4. System uploads document. <br> 5. System parses text. <br> 6. System generates embedding for semantic search. <br> 7. System confirms successful upload/indexing. |
| Alternative Flows | A1. Parsing runs asynchronously and status is shown later. |
| Exceptions | E1. Unsupported file format: system rejects upload. <br> E2. Parsing fails: system records failure status and notifies candidate/HR if needed. |
| Priority | High |
| Frequency of Use | Whenever candidate applies or updates CV. |
| Business Rules | Only CANDIDATE can upload their own CV. CV must be indexed before semantic search can fully use it. |
| Other Information | Worker and AI packages handle parsing/embedding. |
| Assumptions | Storage, queue, and worker are available. |

## UC-20 - Search and Review Candidates

| Field | Description |
|---|---|
| UC ID and Name | UC-20 - Search and Review Candidates |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | HR Manager |
| Trigger | HR Manager opens Talent Pool or Candidate Search. |
| Description | Allows HR Manager to list candidates, view profiles/CVs, and perform semantic CV search. |
| Preconditions | HR Manager is authenticated. Candidate profiles and CV embeddings exist. |
| Postconditions | HR Manager identifies candidates suitable for interview or further review. |
| Normal Flow | 1. HR Manager opens Candidate Search. <br> 2. Enters role, skills, or search criteria. <br> 3. System performs vector/semantic search. <br> 4. System displays matching candidates. <br> 5. HR Manager opens profile and CV details. <br> 6. HR Manager selects candidates for next step. |
| Alternative Flows | A1. HR Manager browses Talent Pool without semantic search. |
| Exceptions | E1. No matching candidates: system displays empty results. <br> E2. CV not indexed: system excludes or flags candidate. |
| Priority | High |
| Frequency of Use | Daily during active recruitment. |
| Business Rules | HR Manager can search candidates. AI is used for search assistance, not final hiring decision. |
| Other Information | Uses pgvector and local embedding utilities. |
| Assumptions | Embedding data is available and up to date. |

## UC-21 - Schedule Interview

| Field | Description |
|---|---|
| UC ID and Name | UC-21 - Schedule Interview |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | HR Manager |
| Trigger | HR Manager selects candidate and schedules interview. |
| Description | Allows HR Manager to arrange interview time, participants, and notifications. |
| Preconditions | Candidate is selected; approved plan allows interview execution. |
| Postconditions | Interview is scheduled and invitations are sent. |
| Normal Flow | 1. HR Manager opens Interview Schedule. <br> 2. Selects candidate and related request/campaign. <br> 3. Checks available time slots. <br> 4. Selects interview date/time and participants. <br> 5. System validates conflicts. <br> 6. System creates interview record. <br> 7. System sends invitations to candidate, department panel, and relevant stakeholders. |
| Alternative Flows | A1. HR Manager saves draft schedule before sending invitations. |
| Exceptions | E1. Time conflict: system asks HR to choose another slot. <br> E2. Email dispatch fails: system records failure and allows retry. |
| Priority | High |
| Frequency of Use | For each shortlisted candidate. |
| Business Rules | Interview scheduling must comply with approved recruitment plan. |
| Other Information | Invitation dialog is modeled as popup. |
| Assumptions | Participant email/contact data is available. |

## UC-22 - Reschedule or Cancel Interview

| Field | Description |
|---|---|
| UC ID and Name | UC-22 - Reschedule or Cancel Interview |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | HR Manager |
| Trigger | HR Manager changes or cancels an existing interview. |
| Description | Allows HR Manager to update interview timing or cancel interview when needed. |
| Preconditions | Interview exists and is not completed. |
| Postconditions | Interview schedule is updated/cancelled; participants are notified. |
| Normal Flow | 1. HR Manager opens Interview Schedule. <br> 2. Selects interview. <br> 3. Chooses Reschedule or Cancel. <br> 4. System validates current state. <br> 5. System updates interview record. <br> 6. System notifies participants. |
| Alternative Flows | A1. HR Manager only edits participant notes or metadata. |
| Exceptions | E1. Interview already completed: system blocks reschedule/cancel. |
| Priority | Medium |
| Frequency of Use | Occasionally during interview coordination. |
| Business Rules | Completed interviews cannot be cancelled or rescheduled. |
| Other Information | Notifications should explain schedule changes. |
| Assumptions | Calendar availability data is reliable. |

## UC-23 - Participate in Interview Panel

| Field | Description |
|---|---|
| UC ID and Name | UC-23 - Participate in Interview Panel |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | Department Head |
| Trigger | Department Head receives interview invitation. |
| Description | Allows Department Head to view interview details and participate in candidate assessment. |
| Preconditions | Department Head is included as interview participant. |
| Postconditions | Department Head is informed and prepared for interview. |
| Normal Flow | 1. Department Head receives notification/email. <br> 2. Opens Interviews screen. <br> 3. Views interview schedule and candidate details. <br> 4. Participates in interview panel. <br> 5. Provides specialist assessment input if required. |
| Alternative Flows | A1. Department Head requests HR to reschedule externally. |
| Exceptions | E1. Interview access denied: system prevents viewing unrelated interviews. |
| Priority | Medium |
| Frequency of Use | For interviews involving department expertise. |
| Business Rules | Department Head can access only interviews related to their department/request scope. |
| Other Information | HR Manager records official result. |
| Assumptions | Department Head receives invite before interview date. |

## UC-24 - Record Interview Result

| Field | Description |
|---|---|
| UC ID and Name | UC-24 - Record Interview Result |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | HR Manager |
| Trigger | Interview is completed. |
| Description | Allows HR Manager to record pass/fail result and interview notes. |
| Preconditions | Interview exists and has occurred. |
| Postconditions | Interview result is saved and made available for Admin review. |
| Normal Flow | 1. HR Manager opens Interview Results. <br> 2. Selects completed interview. <br> 3. Enters PASS/FAIL, notes, and feedback. <br> 4. System validates required fields. <br> 5. System saves result and audit log. <br> 6. System notifies Admin for final decision if required. |
| Alternative Flows | A1. HR Manager saves partial notes before finalizing result. |
| Exceptions | E1. Missing result value: system blocks submission. <br> E2. Interview not completed: system blocks result recording. |
| Priority | High |
| Frequency of Use | After each interview. |
| Business Rules | HR Manager records operational interview result; Admin makes final hiring decision. |
| Other Information | Result contributes to reports and final decision. |
| Assumptions | Interview feedback has been collected from panel. |

## UC-25 - Make Final Hiring Decision

| Field | Description |
|---|---|
| UC ID and Name | UC-25 - Make Final Hiring Decision |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | Admin |
| Trigger | Admin reviews completed interview result. |
| Description | Allows Admin/Boss to make final hire or reject decision. |
| Preconditions | Interview result exists and is ready for review. |
| Postconditions | Candidate outcome is decided; offer or rejection communication can proceed. |
| Normal Flow | 1. Admin opens Interview Results. <br> 2. Reviews candidate profile, CV, result, and notes. <br> 3. Selects HIRE or REJECT. <br> 4. System records final decision. <br> 5. System notifies HR Manager for offer/rejection processing. |
| Alternative Flows | A1. Admin requests additional review or revision of notes. |
| Exceptions | E1. Missing interview result: system prevents final decision. |
| Priority | High |
| Frequency of Use | For every candidate reaching final stage. |
| Business Rules | Only ADMIN can make final hiring decision. AI search results must not replace human decision. |
| Other Information | Final decision is audit-relevant. |
| Assumptions | Admin has authority over final recruitment decision. |

## UC-26 - Send Offer or Rejection Communication

| Field | Description |
|---|---|
| UC ID and Name | UC-26 - Send Offer or Rejection Communication |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | HR Manager |
| Trigger | Admin final decision is available. |
| Description | Allows HR Manager to send offer letter for hired candidates or rejection email for rejected candidates. |
| Preconditions | Final hiring decision exists. |
| Postconditions | Candidate receives offer or rejection; email log is recorded. |
| Normal Flow | 1. HR Manager opens Interview Results or candidate outcome. <br> 2. Reviews Admin decision. <br> 3. Generates offer letter if HIRE, or prepares rejection email if REJECT. <br> 4. Sends communication. <br> 5. System records email delivery log and notification. |
| Alternative Flows | A1. HR Manager previews and edits offer content before sending. |
| Exceptions | E1. Email dispatch fails: system records failure and allows retry. |
| Priority | High |
| Frequency of Use | For every final candidate outcome. |
| Business Rules | Offer is sent only after Admin HIRE decision. Rejection communication should include appropriate reason or template. |
| Other Information | Offer response is handled by Candidate. |
| Assumptions | Email templates and SMTP provider are configured. |

## UC-27 - Respond to Offer

| Field | Description |
|---|---|
| UC ID and Name | UC-27 - Respond to Offer |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | Candidate |
| Trigger | Candidate receives an offer notification/email. |
| Description | Allows candidate to accept or decline an employment offer. |
| Preconditions | Offer letter has been sent to candidate. Candidate is authenticated or uses valid response mechanism. |
| Postconditions | Offer status is updated as accepted or declined; HR/Admin are notified. |
| Normal Flow | 1. Candidate opens Inbox Alerts. <br> 2. Opens offer notification. <br> 3. Reviews offer details. <br> 4. Selects Accept or Decline. <br> 5. System records response. <br> 6. System notifies HR Manager and updates recruitment status. |
| Alternative Flows | A1. Candidate requests clarification outside the system before responding. |
| Exceptions | E1. Offer expired: system prevents response and informs candidate. |
| Priority | High |
| Frequency of Use | For each candidate receiving offer. |
| Business Rules | Candidate can respond only to their own active offer. |
| Other Information | Offer response dialog is represented as popup. |
| Assumptions | Offer expiry policy is defined by organization. |

## UC-28 - Manage Notifications

| Field | Description |
|---|---|
| UC ID and Name | UC-28 - Manage Notifications |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | Authenticated User |
| Trigger | User opens Notifications or Inbox Alerts. |
| Description | Allows users to view notifications, unread count, and mark notifications as read. |
| Preconditions | User is authenticated. |
| Postconditions | Notifications are displayed and read status may be updated. |
| Normal Flow | 1. User opens notification screen. <br> 2. System lists notifications for current user. <br> 3. User opens a notification. <br> 4. User marks notification as read or marks all as read. <br> 5. System updates read status and unread count. |
| Alternative Flows | A1. User navigates from notification to related request/interview/offer. |
| Exceptions | E1. Notification not found or not owned by user: system denies access. |
| Priority | Medium |
| Frequency of Use | Daily. |
| Business Rules | Users can only view and update their own notifications. |
| Other Information | Notifications are used across request, plan, interview, and offer workflows. |
| Assumptions | Notification service stores recipient user ID. |

## UC-29 - View Dashboards

| Field | Description |
|---|---|
| UC ID and Name | UC-29 - View Dashboards |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | Admin, Department Head, HR Manager, Candidate |
| Trigger | User logs in or opens dashboard route. |
| Description | Provides role-specific overview of relevant recruitment data and actions. |
| Preconditions | User is authenticated and has a valid role. |
| Postconditions | Dashboard matching user role is displayed. |
| Normal Flow | 1. User logs in. <br> 2. System reads user role from authenticated profile. <br> 3. System redirects to role dashboard. <br> 4. Dashboard loads role-relevant widgets and navigation. |
| Alternative Flows | A1. User manually opens dashboard route and is redirected based on role. |
| Exceptions | E1. Wrong role for route: system shows Unauthorized. |
| Priority | High |
| Frequency of Use | Every login/session. |
| Business Rules | Admin, Department Head, HR Manager, and Candidate must have separate navigation and landing screens. |
| Other Information | Frontend ProtectedRoute enforces route-level access. |
| Assumptions | User role in token/profile is correct. |

## UC-30 - View Reports

| Field | Description |
|---|---|
| UC ID and Name | UC-30 - View Reports |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | Admin, HR Manager, Department Head |
| Trigger | Authorized user opens Reports screen. |
| Description | Allows authorized users to view recruitment performance reports. |
| Preconditions | User is authenticated and authorized for report type. |
| Postconditions | Requested report is displayed. |
| Normal Flow | 1. User opens report screen. <br> 2. System checks role and scope. <br> 3. User selects report/filter period. <br> 4. System retrieves report data. <br> 5. System displays metrics and summaries. |
| Alternative Flows | A1. User exports report if export function is enabled. |
| Exceptions | E1. User lacks permission: system returns forbidden. <br> E2. No data for selected range: system displays empty report state. |
| Priority | Medium |
| Frequency of Use | Weekly/monthly or during management review. |
| Business Rules | ADMIN can view annual, department, and time-to-hire reports. HR_MANAGER can view pipeline reports. DEPARTMENT_HEAD can view own department report. |
| Other Information | Reports support strategic recruitment monitoring. |
| Assumptions | Data is synchronized from request, plan, interview, and decision workflows. |

## UC-31 - Access Protected Route

| Field | Description |
|---|---|
| UC ID and Name | UC-31 - Access Protected Route |
| Created By | Business Analyst / 2026-06-08 |
| Primary Actor | Authenticated User |
| Trigger | User navigates to a protected route or calls protected API endpoint. |
| Description | Ensures protected resources require valid JWT and, where configured, correct role. |
| Preconditions | Protected route/API exists. |
| Postconditions | Access is granted or denied according to authentication and authorization rules. |
| Normal Flow | 1. User requests protected screen/API. <br> 2. System checks access token. <br> 3. System validates JWT signature and expiry. <br> 4. System extracts user role. <br> 5. System checks required role if configured. <br> 6. System grants access. |
| Alternative Flows | A1. Route has no role restriction: any authenticated user may access. |
| Exceptions | E1. Missing/expired token: system returns unauthorized. <br> E2. Role mismatch: system returns forbidden or redirects Unauthorized. |
| Priority | High |
| Frequency of Use | Every protected screen/API request. |
| Business Rules | Public endpoints bypass JWT. Protected endpoints require JWT. Role-specific endpoints require matching role. |
| Other Information | Implemented by Gateway JwtAuthGuard and RolesGuard; frontend also uses ProtectedRoute. |
| Assumptions | JWT secret is secure and configured consistently across Identity and Gateway. |

