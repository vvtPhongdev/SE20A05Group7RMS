# Authentication & Authorization Design — Recruitment Workflow Management System

**Created:** 2026-05-23
**Status:** SPECIFICATION (not yet implemented)
**Related:** `services/identity/`, `services/gateway/`, `packages/contracts/src/schemas/`

---

## Architecture Decision

### ADR-005: JWT-based Stateless Auth with Redis Refresh Tokens

**Status:** Accepted
**Decision:** Use short-lived JWTs (1h) for access + long-lived refresh tokens (30d) stored in Redis.

**Rationale:**

- Microservice architecture requires stateless auth → JWT access tokens
- Refresh token rotation provides security without UX friction
- Redis enables instant token revocation (logout, password change)
- No session table needed in Postgres

## Token Strategy

```
┌─────────┐     login      ┌──────────┐    TCP    ┌──────────────┐
│  Webapp  │────────────────│ Gateway  │──────────→│   Identity   │
│ (React)  │    POST /auth  │(NestJS)  │           │  (NestJS µs) │
└────┬─────┘    /login      └────┬─────┘           └──────┬───────┘
     │                           │                        │
     │  ← { accessToken,        │   ← auth.login         │
     │      refreshToken }       │     → { user, tokens } │
     │                           │                        │
     │  GET /api/roles           │                        │
     │  Authorization: Bearer    │                        │
     │  ──────────────────→      │                        │
     │                     JwtGuard                       │
     │                     validates                      │
     │                     locally (no µs call)           │
```

### Access Token (JWT)

- **Algorithm:** HS256 (symmetric, single-issuer)
- **Lifetime:** 1 hour (`JWT_ACCESS_EXPIRY=3600`)
- **Payload:**
  ```json
  {
    "sub": "uuid",
    "email": "user@company.com",
    "displayName": "Nguyen Van A",
    "role": "HR_MANAGER",
    "organizationId": "uuid-or-null",
    "departmentId": "uuid-or-null",
    "iat": 1716500000,
    "exp": 1716503600
  }
  ```
- **Validated by:** Gateway's `JwtAuthGuard` — no microservice call needed

### Refresh Token

- **Format:** 64-byte random hex string (not JWT)
- **Storage:** Redis with TTL: `refresh:{tokenHash} → userId`
- **Lifetime:** 30 days (`JWT_REFRESH_EXPIRY=2592000`)
- **Rotation:** Old token invalidated on refresh, new pair issued
- **Revocation:** Cleared on logout or password change

## Implementation Components

### 1. Identity Service — Auth Module

```
services/identity/src/
├── auth/
│   ├── auth.module.ts          # Imports JwtModule, PassportModule
│   ├── auth.service.ts         # Core auth logic
│   ├── auth.controller.ts      # @MessagePattern handlers
│   ├── strategies/
│   │   └── jwt.strategy.ts     # Passport JWT strategy
│   ├── guards/
│   │   ├── jwt-auth.guard.ts   # Validates access token
│   │   └── roles.guard.ts      # @Roles() decorator guard
│   └── decorators/
│       ├── current-user.ts     # @CurrentUser() param decorator
│       └── roles.ts            # @Roles('HR_MANAGER') decorator
```

### 2. Auth Service Logic

```typescript
// Pseudocode — services/identity/src/auth/auth.service.ts

class AuthService {
  // Register: hash password, create user, issue tokens
  async register(dto: RegisterUserInput): Promise<AuthTokenResponse>;

  // Login: verify email+password, issue tokens
  async login(dto: LoginInput): Promise<AuthTokenResponse>;

  // Refresh: validate refresh token in Redis, rotate, issue new pair
  async refresh(refreshToken: string): Promise<AuthTokenResponse>;

  // Forgot password: generate 6-digit code, store in Redis (15min TTL), send email
  async forgotPassword(email: string): Promise<void>;

  // Reset password: validate code, hash new password, clear all refresh tokens
  async resetPassword(dto: ResetPasswordInput): Promise<void>;

  // Logout: clear refresh token from Redis
  async logout(userId: string, refreshToken: string): Promise<void>;

  // Internal helpers
  private hashPassword(password: string): Promise<string>; // bcrypt, 12 rounds
  private verifyPassword(plain: string, hash: string): Promise<boolean>;
  private issueTokenPair(user: User): Promise<AuthTokenResponse>;
  private storeRefreshToken(userId: string, token: string): Promise<void>;
}
```

### 3. Gateway Guards

```typescript
// services/gateway/src/guards/jwt-auth.guard.ts
// Applied globally or per-controller
// Reads Bearer token from Authorization header
// Validates JWT signature + expiry using shared secret
// Attaches decoded payload to request.user

// services/gateway/src/guards/roles.guard.ts
// Reads @Roles() metadata from handler
// Compares against request.user.role
// Returns 403 if role not authorized
```

### 4. NestJS Dependencies Required

| Package            | Purpose                      |
| ------------------ | ---------------------------- |
| `@nestjs/jwt`      | JWT signing/verification     |
| `@nestjs/passport` | Guard integration            |
| `passport-jwt`     | JWT extraction strategy      |
| `bcrypt`           | Password hashing (12 rounds) |
| `crypto`           | Refresh token generation     |

## Password Security

| Parameter      | Value               | Rationale                       |
| -------------- | ------------------- | ------------------------------- |
| Hash algorithm | bcrypt              | Industry standard, adaptive     |
| Salt rounds    | 12                  | Balance security/performance    |
| Min length     | 8                   | `RegisterUserSchema` validation |
| Max length     | 128                 | Prevent bcrypt DoS              |
| Reset code     | 6 digits            | Simple, time-limited (15 min)   |
| Rate limit     | 5 attempts / 15 min | Brute force prevention          |

## Environment Variables

```env
# JWT
JWT_SECRET=<random-64-char-string>
JWT_ACCESS_EXPIRY=3600
JWT_REFRESH_EXPIRY=2592000

# Redis (for refresh tokens + reset codes)
REDIS_URL=redis://localhost:6379

# Email (for password reset)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@recruitment-rms.com
SMTP_PASS=<secret>
```

## Role-Based Access Control (RBAC)

### Role Hierarchy (4 Roles)

```
ADMIN           → Phê duyệt yêu cầu/kế hoạch, quyết định tuyển dụng, báo cáo chiến lược
DEPARTMENT_HEAD → Tạo/gửi yêu cầu tuyển dụng, theo dõi tiến độ, tham gia phỏng vấn
HR_MANAGER      → Tiếp nhận yêu cầu, lập kế hoạch, tổ chức tuyển dụng, sàng lọc CV
CANDIDATE       → Upload CV, nhận thông báo phỏng vấn/kết quả
```

### Guard Application Strategy

```typescript
// Global JWT guard (applied in gateway bootstrap)
app.useGlobalGuards(new JwtAuthGuard());

// Per-endpoint role restrictions
@Roles('HR_MANAGER', 'ADMIN')
@Post('recruitment-requests/:id/forward-to-boss')
forwardToBoss(@Param('id') id: string) { ... }

// Public endpoints skip JWT guard
@Public()  // custom decorator + metadata
@Post('auth/login')
login(@Body() dto) { ... }
```

## Security Considerations

1. **Token in memory:** Frontend stores access token in memory (not localStorage), refresh token in httpOnly cookie
2. **CORS:** Strict origin whitelist in gateway config
3. **Rate limiting:** `/auth/*` endpoints rate-limited (5 req/15min per IP)
4. **Audit log:** Login/register/password-reset events logged
5. **Multi-org:** User can belong to multiple organizations; JWT carries primary `organizationId`
6. **Token revocation:** Password change invalidates all refresh tokens for that user

## Flow Diagrams

### Registration Flow

```
Client → POST /auth/register { email, displayName, password, role }
  → Gateway validates via RegisterUserSchema
  → Gateway sends TCP: identity.auth.register
  → Identity creates User (passwordHash = bcrypt(password))
  → Identity stores refresh token in Redis
  → Identity returns { accessToken, refreshToken, expiresIn, user }
```

### Login Flow

```
Client → POST /auth/login { email, password }
  → Gateway validates via LoginSchema
  → Gateway sends TCP: identity.auth.login
  → Identity finds User by email
  → Identity verifies bcrypt(password, user.passwordHash)
  → If invalid: throw UNAUTHORIZED
  → Identity stores refresh token in Redis
  → Identity returns { accessToken, refreshToken, expiresIn, user }
```

### Forgot Password Flow

```
Client → POST /auth/forgot-password { email }
  → Identity generates 6-digit code
  → Identity stores in Redis: reset:{email} → code (TTL 15 min)
  → Identity sends email with code
  → Client shows verification code input

Client → POST /auth/reset-password { email, code, newPassword }
  → Identity validates code from Redis
  → Identity hashes new password
  → Identity updates user.passwordHash
  → Identity deletes ALL refresh tokens for user
  → Client redirects to login
```
