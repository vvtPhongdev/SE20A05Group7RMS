# API Contracts — Works Reruiter

**Updated:** 2026-05-23
**Gateway:** `services/gateway/` (:3001)
**Swagger:** `http://localhost:3001/api` (auto-generated)

---

## Contract Architecture

All API contracts originate from `@wr/contracts` and flow to two consumers:

```
@wr/contracts (Zod schemas + enums)
    ├──→ Gateway (class-validator DTOs, validated at HTTP layer)
    └──→ Webapp (Zod .parse() at fetch layer)
```

**Strict rules:**
- `@wr/contracts` is the SINGLE SOURCE OF TRUTH for all types/enums
- Gateway DTOs must mirror contract schemas exactly
- Microservices never validate inbound TCP messages (already validated by gateway)

## Zod Schema → Endpoint Mapping

| Zod Schema | Used By | Endpoint |
|------------|---------|----------|
| `RegisterUserSchema` | Auth | `POST /auth/register` |
| `LoginSchema` | Auth | `POST /auth/login` |
| `RefreshTokenSchema` | Auth | `POST /auth/refresh` |
| `ForgotPasswordSchema` | Auth | `POST /auth/forgot-password` |
| `ResetPasswordSchema` | Auth | `POST /auth/reset-password` |
| `CreateUserSchema` | Admin | `POST /users` (admin-only) |
| `CreateOrganizationSchema` | Identity | `POST /organizations` |
| `AddOrganizationMemberSchema` | Identity | `POST /organizations/:id/members` |
| `CreateDepartmentSchema` | Identity | `POST /organizations/:id/departments` |
| `UpdateDepartmentSchema` | Identity | `PATCH /organizations/:orgId/departments/:deptId` |
| `CreateApprovalChainSchema` | Identity | `POST /organizations/:id/approval-chains` |
| `CreateHiringRequestSchema` | Recruiting | `POST /hiring-requests` |
| `UpdateHiringRequestSchema` | Recruiting | `PATCH /hiring-requests/:id` |
| `SubmitHiringRequestSchema` | Recruiting | `PATCH /hiring-requests/:id/submit` |
| `ApproveRejectRequestSchema` | Recruiting | `PATCH /hiring-requests/:id/approve` |
| `CreateRoleSchema` | Recruiting | `POST /roles` |
| `CreateApplicationSchema` | Recruiting | `POST /applications` |
| `UpdateApplicationStatusSchema` | Recruiting | `PATCH /applications/:id/status` |
| `TalentSearchSchema` | Recruiting | `POST /talent-search` |
| `EvaluationPayloadSchema` | Worker | BullMQ job payload |
| `UpdateCandidateProfileSchema` | Profiles | `PATCH /candidate-profiles/:id` |
| `DocumentUploadSchema` | Profiles | `POST /documents` |
| `CreateInviteSchema` | Recruiting | `POST /invites` |
| `RespondToInviteSchema` | Recruiting | `PATCH /invites/:id/respond` |
| `CreateReviewerFeedbackSchema` | Review | `POST /feedback` |
| `GeneratePacketSchema` | Review | `POST /packets` |
| `SharePacketSchema` | Review | `POST /packets/:id/share` |

## Gateway Endpoints by Controller

### Health (`/health`)

| Method | Endpoint | Auth | Role | Zod Schema | Description |
|--------|----------|------|------|------------|-------------|
| `GET` | `/health` | ❌ | Any | — | Health check |

### Auth (`/api/auth/`)

| Method | Endpoint | Auth | Role | Zod Schema | Description |
|--------|----------|------|------|------------|-------------|
| `POST` | `/auth/register` | ❌ | Any | `RegisterUserSchema` | Register new user |
| `POST` | `/auth/login` | ❌ | Any | `LoginSchema` | Login → JWT pair |
| `POST` | `/auth/refresh` | ❌ | Any | `RefreshTokenSchema` | Refresh access token |
| `POST` | `/auth/forgot-password` | ❌ | Any | `ForgotPasswordSchema` | Send verification code |
| `POST` | `/auth/reset-password` | ❌ | Any | `ResetPasswordSchema` | Reset password with code |
| `POST` | `/auth/logout` | ✅ | Any | — | Invalidate refresh token |

### Users (`/api/users/`)

| Method | Endpoint | Auth | Role | Zod Schema | Description |
|--------|----------|------|------|------------|-------------|
| `GET` | `/users/me` | ✅ | Any | — | Current user profile |
| `PATCH` | `/users/me` | ✅ | Any | `CreateUserSchema.partial()` | Update own profile |
| `GET` | `/users` | ✅ | ADMIN | — | List users (admin) |
| `GET` | `/users/:id` | ✅ | ADMIN | — | Get user by ID (admin) |

### Organizations (`/api/organizations/`)

| Method | Endpoint | Auth | Role | Zod Schema | Description |
|--------|----------|------|------|------------|-------------|
| `POST` | `/organizations` | ✅ | ADMIN | `CreateOrganizationSchema` | Create organization |
| `GET` | `/organizations` | ✅ | Any | — | List user's organizations |
| `GET` | `/organizations/:id` | ✅ | Any | — | Get organization details |
| `POST` | `/organizations/:id/members` | ✅ | ADMIN | `AddOrganizationMemberSchema` | Add member |
| `DELETE` | `/organizations/:id/members/:userId` | ✅ | ADMIN | — | Remove member |

### Departments (`/api/organizations/:orgId/departments/`)

| Method | Endpoint | Auth | Role | Zod Schema | Description |
|--------|----------|------|------|------------|-------------|
| `POST` | `/organizations/:orgId/departments` | ✅ | ADMIN | `CreateDepartmentSchema` | Create department |
| `GET` | `/organizations/:orgId/departments` | ✅ | Any | — | List departments |
| `GET` | `/organizations/:orgId/departments/:deptId` | ✅ | Any | — | Get department details |
| `PATCH` | `/organizations/:orgId/departments/:deptId` | ✅ | ADMIN | `UpdateDepartmentSchema` | Update department |
| `DELETE` | `/organizations/:orgId/departments/:deptId` | ✅ | ADMIN | — | Delete department |

### Approval Chains (`/api/organizations/:orgId/approval-chains/`)

| Method | Endpoint | Auth | Role | Zod Schema | Description |
|--------|----------|------|------|------------|-------------|
| `POST` | `/organizations/:orgId/approval-chains` | ✅ | ADMIN | `CreateApprovalChainSchema` | Create approval chain |
| `GET` | `/organizations/:orgId/approval-chains` | ✅ | Any | — | List approval chains |
| `GET` | `/organizations/:orgId/approval-chains/:id` | ✅ | Any | — | Get chain details + levels |
| `DELETE` | `/organizations/:orgId/approval-chains/:id` | ✅ | ADMIN | — | Delete chain |

### Hiring Requests (`/api/hiring-requests/`)

| Method | Endpoint | Auth | Role | Zod Schema | Description |
|--------|----------|------|------|------------|-------------|
| `POST` | `/hiring-requests` | ✅ | DEPT_HEAD | `CreateHiringRequestSchema` | Create hiring request (DRAFT) |
| `GET` | `/hiring-requests` | ✅ | DEPT_HEAD, HM, RECRUITER | — | List requests (role-filtered) |
| `GET` | `/hiring-requests/:id` | ✅ | DEPT_HEAD, HM, RECRUITER | — | Get request details |
| `PATCH` | `/hiring-requests/:id` | ✅ | DEPT_HEAD | `UpdateHiringRequestSchema` | Update draft request |
| `PATCH` | `/hiring-requests/:id/submit` | ✅ | DEPT_HEAD | — | Submit for approval |
| `PATCH` | `/hiring-requests/:id/approve` | ✅ | HM | `ApproveRejectRequestSchema` | Approve request |
| `PATCH` | `/hiring-requests/:id/reject` | ✅ | HM | `ApproveRejectRequestSchema` | Reject request |
| `PATCH` | `/hiring-requests/:id/revise` | ✅ | HM | `ApproveRejectRequestSchema` | Request revision |

### Roles (`/api/roles/`)

| Method | Endpoint | Auth | Role | Zod Schema | Description |
|--------|----------|------|------|------------|-------------|
| `POST` | `/roles` | ✅ | RECRUITER | `CreateRoleSchema` | Create role from approved request |
| `GET` | `/roles` | ✅ | Any | — | List roles (filtered) |
| `GET` | `/roles/:id` | ✅ | Any | — | Get role + capability model |
| `PATCH` | `/roles/:id` | ✅ | RECRUITER | `CreateRoleSchema.partial()` | Update role |
| `POST` | `/roles/:id/publish` | ✅ | RECRUITER | — | Publish for candidates |

### Applications (`/api/applications/`)

| Method | Endpoint | Auth | Role | Zod Schema | Description |
|--------|----------|------|------|------------|-------------|
| `POST` | `/applications` | ✅ | CANDIDATE | `CreateApplicationSchema` | Apply to role |
| `GET` | `/applications` | ✅ | CANDIDATE, RECRUITER | — | List applications |
| `GET` | `/applications/:id` | ✅ | Any | — | Get application details |
| `PATCH` | `/applications/:id/status` | ✅ | RECRUITER | `UpdateApplicationStatusSchema` | Update status |
| `PATCH` | `/applications/:id/withdraw` | ✅ | CANDIDATE | — | Withdraw application |

### Evaluations (`/api/evaluations/`)

| Method | Endpoint | Auth | Role | Zod Schema | Description |
|--------|----------|------|------|------------|-------------|
| `POST` | `/evaluations` | ✅ | RECRUITER, HM | — | Trigger evaluation run |
| `GET` | `/evaluations/:id` | ✅ | RECRUITER, HM | — | Get evaluation results |
| `GET` | `/evaluations/:id/evidence` | ✅ | RECRUITER, HM | — | List evidence records |
| `GET` | `/evaluations/:id/gaps` | ✅ | RECRUITER, HM | — | List gap findings |
| `GET` | `/evaluations/:id/explanation` | ✅ | RECRUITER, HM | — | Get explanation box |
| `GET` | `/evaluations/:id/interview-focus` | ✅ | RECRUITER, HM | — | Get interview focus items |

### Talent Search (`/api/talent-search/`)

| Method | Endpoint | Auth | Role | Zod Schema | Description |
|--------|----------|------|------|------------|-------------|
| `POST` | `/talent-search` | ✅ | RECRUITER | `TalentSearchSchema` | Hybrid search (RRF) |

### Invites (`/api/invites/`)

| Method | Endpoint | Auth | Role | Zod Schema | Description |
|--------|----------|------|------|------------|-------------|
| `POST` | `/invites` | ✅ | RECRUITER | `CreateInviteSchema` | Invite candidate |
| `GET` | `/invites` | ✅ | RECRUITER, CANDIDATE | — | List invites (role-filtered) |
| `PATCH` | `/invites/:id/respond` | ✅ | CANDIDATE | `RespondToInviteSchema` | Accept/decline invite |

### Profiles (`/api/profiles/`)

| Method | Endpoint | Auth | Role | Zod Schema | Description |
|--------|----------|------|------|------------|-------------|
| `POST` | `/candidate-profiles` | ✅ | CANDIDATE | — | Create profile |
| `GET` | `/candidate-profiles/me` | ✅ | CANDIDATE | — | Get own profile |
| `PATCH` | `/candidate-profiles/:id` | ✅ | CANDIDATE | `UpdateCandidateProfileSchema` | Update profile |
| `POST` | `/documents` | ✅ | CANDIDATE | `DocumentUploadSchema` | Upload CV document |
| `GET` | `/documents/:id` | ✅ | CANDIDATE | — | Get document + parse status |
| `DELETE` | `/documents/:id` | ✅ | CANDIDATE | — | Delete document |

### Review (`/api/review/`)

| Method | Endpoint | Auth | Role | Zod Schema | Description |
|--------|----------|------|------|------------|-------------|
| `POST` | `/feedback` | ✅ | RECRUITER, HM | `CreateReviewerFeedbackSchema` | Submit feedback |
| `GET` | `/feedback/:applicationId` | ✅ | RECRUITER, HM | — | List feedback |
| `POST` | `/packets` | ✅ | RECRUITER | `GeneratePacketSchema` | Generate candidate packet |
| `GET` | `/packets/:id` | ✅ | RECRUITER, HM | — | Get candidate packet |
| `POST` | `/packets/:id/share` | ✅ | RECRUITER | `SharePacketSchema` | Share with team members |

## Message Patterns (TCP)

Each gateway endpoint maps to a `@MessagePattern` in the target microservice:

### Identity Service Patterns

| Pattern | Description |
|---------|-------------|
| `identity.auth.register` | User registration |
| `identity.auth.login` | Login → JWT |
| `identity.auth.refresh` | Refresh token |
| `identity.auth.forgot-password` | Send reset code |
| `identity.auth.reset-password` | Reset password |
| `identity.auth.logout` | Invalidate token |
| `identity.users.me` | Get current user |
| `identity.users.update` | Update user |
| `identity.users.list` | List users (admin) |
| `identity.organizations.create` | Create org |
| `identity.organizations.list` | List orgs |
| `identity.organizations.get` | Get org details |
| `identity.organizations.members.add` | Add member |
| `identity.organizations.members.remove` | Remove member |
| `identity.departments.create` | Create department |
| `identity.departments.list` | List departments |
| `identity.departments.get` | Get department |
| `identity.departments.update` | Update department |
| `identity.departments.delete` | Delete department |
| `identity.approval-chains.create` | Create chain |
| `identity.approval-chains.list` | List chains |
| `identity.approval-chains.get` | Get chain |
| `identity.approval-chains.delete` | Delete chain |

### Recruiting Service Patterns

| Pattern | Description |
|---------|-------------|
| `recruiting.hiring-requests.create` | Create hiring request |
| `recruiting.hiring-requests.list` | List requests |
| `recruiting.hiring-requests.get` | Get request |
| `recruiting.hiring-requests.update` | Update draft |
| `recruiting.hiring-requests.submit` | Submit for approval |
| `recruiting.hiring-requests.approve` | Approve |
| `recruiting.hiring-requests.reject` | Reject |
| `recruiting.hiring-requests.revise` | Request revision |
| `recruiting.roles.create` | Create role |
| `recruiting.roles.list` | List roles |
| `recruiting.roles.get` | Get role |
| `recruiting.roles.update` | Update role |
| `recruiting.roles.publish` | Publish role |
| `recruiting.applications.create` | Apply |
| `recruiting.applications.list` | List apps |
| `recruiting.applications.get` | Get app |
| `recruiting.applications.update-status` | Update status |
| `recruiting.applications.withdraw` | Withdraw |
| `recruiting.evaluations.run` | Trigger evaluation |
| `recruiting.evaluations.get` | Get results |
| `recruiting.evaluations.evidence` | Get evidence |
| `recruiting.evaluations.gaps` | Get gaps |
| `recruiting.evaluations.explanation` | Get explanation |
| `recruiting.evaluations.interview-focus` | Get focus items |
| `recruiting.talent-search.search` | Hybrid search |
| `recruiting.invites.create` | Create invite |
| `recruiting.invites.list` | List invites |
| `recruiting.invites.respond` | Accept/decline |

### Profiles Service Patterns

| Pattern | Description |
|---------|-------------|
| `profiles.candidates.create` | Create profile |
| `profiles.candidates.get` | Get profile |
| `profiles.candidates.update` | Update profile |
| `profiles.documents.upload` | Upload CV |
| `profiles.documents.get` | Get document |
| `profiles.documents.delete` | Delete document |

### Review Service Patterns

| Pattern | Description |
|---------|-------------|
| `review.feedback.submit` | Submit feedback |
| `review.feedback.list` | List feedback |
| `review.packets.generate` | Generate packet |
| `review.packets.get` | Get packet |
| `review.packets.share` | Share packet |

## BullMQ Job Types

| Queue | Job Type | Trigger | Payload Schema | Description |
|-------|----------|---------|---------------|-------------|
| `cv-parse` | `parse-cv` | Document upload | `DocumentParsePayloadSchema` | Extract text, parse CV |
| `cv-parse` | `extract-evidence` | Parse complete | `BaseJobPayloadSchema` | Extract evidence records |
| `embedding` | `generate-embeddings` | Evidence extracted | `BaseJobPayloadSchema` | MiniLM-L6-v2 vectors |
| `evaluation` | `run-evaluation` | Evaluation triggered | `EvaluationPayloadSchema` | Hybrid match + score |

## Authentication & Authorization

### JWT Token Structure
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "RECRUITER",
  "organizationId": "org-uuid",
  "iat": 1716500000,
  "exp": 1716503600
}
```

### Role-Based Access Control (RBAC)

| Role | Auth Pages | Dashboard | Hiring Req | Roles | Applications | Talent Search | Evaluation | Admin |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `CANDIDATE` | ✅ | ✅ | ❌ | Read | Own | ❌ | Read own | ❌ |
| `RECRUITER` | ✅ | ✅ | Read | CRUD | Read all | ✅ | Full | ❌ |
| `HIRING_MANAGER` | ✅ | ✅ | Approve/Reject | Read | Read | ❌ | Read | ❌ |
| `DEPARTMENT_HEAD` | ✅ | ✅ | Create/Submit | ❌ | ❌ | ❌ | ❌ | ❌ |
| `ADMIN` | ✅ | ✅ | Read all | Read | Read | ❌ | ❌ | ✅ |

## Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "constraints": { "isEmail": "email must be valid" } }
    ],
    "requestId": "req_abc123"
  }
}
```

Well-known error codes: `VALIDATION_ERROR`, `FAILED_VALIDATION`, `FAILED_PARSE`, `FAILED_PROCESSING`, `OUT_OF_SCOPE`, `INSUFFICIENT_EVIDENCE`, `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `CONFLICT`, `INTERNAL_ERROR`.
