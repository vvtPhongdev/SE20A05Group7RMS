#!/bin/bash
# Create GitHub issues T-023 to T-034 for Works Reruiter
# Repo: vvtPhongdev/SE20A05Group7RMS

REPO="vvtPhongdev/SE20A05Group7RMS"

create_issue() {
  local title="$1"
  local body="$2"
  echo "Creating: $title"
  gh issue create --repo "$REPO" --title "$title" --body "$body" 2>&1
  echo "---"
  sleep 2
}

# T-025
create_issue \
  "T-025: Implement AuthService.login() — verify credentials, issue JWT pair" \
  "## Task T-025

**Phase:** 1 — Identity Service | **Priority:** P0 | **Service:** services/identity/ | **Depends on:** T-024

### Description
Implement user login: validate via LoginSchema, find user by email, verify bcrypt password, issue JWT access (1h) + refresh token (30d Redis), return AuthTokenResponse.

### Message Pattern
\`identity.auth.login\`

### Acceptance Criteria
- [ ] Valid credentials return token pair
- [ ] Invalid email/password returns 401 UNAUTHORIZED
- [ ] Unit tests for success + failure cases"

# T-026
create_issue \
  "T-026: Implement AuthService.refresh() — validate refresh token in Redis, rotate" \
  "## Task T-026

**Phase:** 1 — Identity Service | **Priority:** P0 | **Service:** services/identity/ | **Depends on:** T-024

### Description
Implement token refresh: validate refresh token exists in Redis, invalidate old token, generate new access+refresh pair, store new refresh in Redis.

### Message Pattern
\`identity.auth.refresh\`

### Acceptance Criteria
- [ ] Valid refresh token returns new pair
- [ ] Old refresh token invalidated after use (rotation)
- [ ] Expired/invalid token returns 401
- [ ] Unit tests for rotation + expiry"

# T-027
create_issue \
  "T-027: Implement AuthService.forgotPassword() — generate code, store in Redis, send email" \
  "## Task T-027

**Phase:** 1 — Identity Service | **Priority:** P0 | **Service:** services/identity/ | **Depends on:** T-024

### Description
Implement forgot password: generate 6-digit code, store in Redis with 15-min TTL keyed by email, send code via email (SMTP).

### Message Pattern
\`identity.auth.forgot-password\`

### Acceptance Criteria
- [ ] 6-digit code generated and stored in Redis (15 min TTL)
- [ ] Email sent with verification code
- [ ] Non-existent email returns success (no email leak)
- [ ] Rate limited: max 5 requests per 15 min per email"

# T-028
create_issue \
  "T-028: Implement AuthService.resetPassword() — validate code, update hash, clear tokens" \
  "## Task T-028

**Phase:** 1 — Identity Service | **Priority:** P0 | **Service:** services/identity/ | **Depends on:** T-027

### Description
Implement password reset: validate 6-digit code from Redis, hash new password (bcrypt 12 rounds), update User.passwordHash, delete ALL refresh tokens for user.

### Message Pattern
\`identity.auth.reset-password\`

### Acceptance Criteria
- [ ] Valid code + new password resets successfully
- [ ] Invalid/expired code returns 400
- [ ] All existing refresh tokens cleared (force re-login)
- [ ] Unit tests for valid + invalid code"

# T-029
create_issue \
  "T-029: Implement AuthService.logout() — clear refresh token from Redis" \
  "## Task T-029

**Phase:** 1 — Identity Service | **Priority:** P0 | **Service:** services/identity/ | **Depends on:** T-024

### Description
Implement logout: delete the specific refresh token from Redis for the current user session.

### Message Pattern
\`identity.auth.logout\`

### Acceptance Criteria
- [ ] Refresh token removed from Redis
- [ ] Subsequent refresh attempts with old token fail
- [ ] Returns 200 success"

# T-030
create_issue \
  "T-030: Implement JwtAuthGuard — validate Bearer token, attach request.user" \
  "## Task T-030

**Phase:** 1 — Identity Service | **Priority:** P0 | **Service:** services/gateway/src/guards/

### Description
Implement NestJS guard that:
1. Extracts Bearer token from Authorization header
2. Validates JWT signature + expiry using shared JWT_SECRET
3. Decodes payload (sub, email, role, organizationId)
4. Attaches decoded user to \`request.user\`
5. Returns 401 if token missing/invalid/expired

### Acceptance Criteria
- [ ] Valid JWT passes guard and populates request.user
- [ ] Missing Authorization header returns 401
- [ ] Expired token returns 401
- [ ] Invalid signature returns 401
- [ ] Works with @Public() decorator to skip"

# T-031
create_issue \
  "T-031: Implement RolesGuard — check @Roles() decorator vs request.user.role" \
  "## Task T-031

**Phase:** 1 — Identity Service | **Priority:** P0 | **Service:** services/gateway/src/guards/

### Description
Implement NestJS guard that:
1. Reads \`@Roles()\` metadata from the handler/controller
2. If no roles specified, allow access
3. Compares request.user.role against allowed roles
4. Returns 403 FORBIDDEN if role not authorized

### Acceptance Criteria
- [ ] Matching role passes guard
- [ ] Non-matching role returns 403
- [ ] No @Roles() decorator = allow all authenticated users
- [ ] Works with all 5 roles: ADMIN, DEPARTMENT_HEAD, HIRING_MANAGER, RECRUITER, CANDIDATE"

# T-032
create_issue \
  "T-032: Implement @Public() decorator — skip JWT guard for open endpoints" \
  "## Task T-032

**Phase:** 1 — Identity Service | **Priority:** P0 | **Service:** services/gateway/src/decorators/

### Description
Create a custom decorator \`@Public()\` that sets Reflector metadata to signal JwtAuthGuard to skip validation. Apply to: POST /auth/register, POST /auth/login, POST /auth/refresh, POST /auth/forgot-password, POST /auth/reset-password, GET /health.

### Acceptance Criteria
- [ ] @Public() decorator created using SetMetadata
- [ ] JwtAuthGuard checks for IS_PUBLIC metadata and skips if present
- [ ] All auth endpoints and health check marked as @Public()"

# T-033
create_issue \
  "T-033: Implement @CurrentUser() param decorator — extract user from request" \
  "## Task T-033

**Phase:** 1 — Identity Service | **Priority:** P0 | **Service:** services/gateway/src/decorators/

### Description
Create a custom parameter decorator \`@CurrentUser()\` that extracts the decoded JWT user from the request object. Usage: \`@CurrentUser() user: JwtPayload\`.

### Acceptance Criteria
- [ ] Decorator extracts user from request.user
- [ ] Returns full JWT payload (sub, email, role, organizationId, displayName)
- [ ] Type-safe with JwtPayload interface
- [ ] Can optionally extract single field: @CurrentUser('sub') userId: string"

# T-034
create_issue \
  "T-034: Apply global JwtAuthGuard in gateway bootstrap" \
  "## Task T-034

**Phase:** 1 — Identity Service | **Priority:** P0 | **Service:** services/gateway/src/main.ts

### Description
Apply JwtAuthGuard globally in the gateway bootstrap so all endpoints require authentication by default. Only endpoints decorated with @Public() bypass the guard.

### Acceptance Criteria
- [ ] \`app.useGlobalGuards(new JwtAuthGuard(reflector))\` in main.ts
- [ ] All endpoints return 401 without valid JWT
- [ ] @Public() endpoints work without JWT
- [ ] @Roles() guard also applied globally (after JwtAuthGuard)
- [ ] Integration test: unauthenticated request → 401
- [ ] Integration test: authenticated request → passes to controller"

echo ""
echo "✅ All issues T-025 to T-034 created!"
