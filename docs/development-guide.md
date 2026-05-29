# Development Guide — Works Reruiter

**Updated:** 2026-05-28  
**Scan mode:** Full rescan

---

## Prerequisites

| Requirement | Version | Notes |
|------------|---------|-------|
| **Node.js** | 22+ | Required for all packages |
| **npm** | 10+ | Workspace-aware package manager |
| **Docker** | Latest | For PostgreSQL + Redis |
| **Docker Compose** | v2+ | `docker compose` (not `docker-compose`) |

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> && cd works-reruiter
npm install

# 2. Start infrastructure
docker compose up -d

# 3. Set up environment
cp .env.example .env
# Edit .env with your values (JWT_SECRET min 10 chars)

# 4. Set up database
npm run db:generate     # Prisma generate
npm run db:migrate:dev  # Run migrations

# 5. Start all services
npm run dev             # Turborepo parallel dev
```

## Environment Variables

Validated at startup via `@wr/config` Zod schemas.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `REDIS_HOST` | ✅ | — | Redis hostname |
| `REDIS_PORT` | ✅ | — | Redis port |
| `JWT_SECRET` | ✅ | — | Min 10 characters |
| `API_CORS_ORIGIN` | ❌ | `http://localhost:3000` | CORS origin |
| `GATEWAY_PORT` | ❌ | `3001` | Gateway HTTP port |
| `IDENTITY_PORT` | ❌ | `3010` | Identity TCP port |
| `RECRUITING_PORT` | ❌ | `3011` | Recruiting TCP port |
| `PROFILES_PORT` | ❌ | `3012` | Profiles TCP port |
| `REVIEW_PORT` | ❌ | `3013` | Review TCP port |

## Development Commands

### Root Workspace

```bash
npm run dev              # Start ALL services via Turborepo (parallel)
npm run build            # Build all packages + services
npm run lint             # Lint all packages
npm run typecheck        # Type-check all packages
npm run format           # Prettier format
npm run format:check     # Prettier check (CI)
npm run clean            # Clean all build artifacts + node_modules
```

### Individual Services

```bash
npm run dev:gateway      # Gateway only (:3001)
npm run dev:identity     # Identity service (:3010)
npm run dev:recruiting   # Recruiting service (:3011)
npm run dev:profiles     # Profiles service (:3012)
npm run dev:review       # Review service (:3013)
npm run dev:worker       # Worker (BullMQ processor)
npm run dev:webapp       # React SPA (:3000)
```

### Database

```bash
npm run db:generate      # Prisma generate (after schema changes)
npm run db:migrate:dev   # Create + apply migration
npm run db:push          # Push schema without migration (dev only)
```

### Infrastructure

```bash
npm run docker:up        # Start PostgreSQL + Redis
npm run docker:down      # Stop infrastructure
```

## Service Ports

| Service | Port | Protocol |
|---------|------|----------|
| Webapp (Vite) | 3000 | HTTP (dev proxy) |
| Gateway | 3001 | HTTP + Swagger |
| Identity | 3010 | TCP |
| Recruiting | 3011 | TCP |
| Profiles | 3012 | TCP |
| Review | 3013 | TCP |
| PostgreSQL | 5432 | TCP |
| Redis | 6379 | TCP |

## Code Style & Conventions

### Prettier (Enforced)

```js
semi: true
singleQuote: true
trailingComma: "all"
printWidth: 100
tabWidth: 2
arrowParens: "always"
endOfLine: "lf"
```

### Naming Conventions

| Entity | Pattern | Example |
|--------|---------|---------|
| Files | kebab-case | `recruitment-request.service.ts` |
| Classes | PascalCase | `RecruitmentRequestService` |
| Functions | camelCase | `createRequest()` |
| Enums | PascalCase / UPPER_SNAKE | `UserRole.DEPARTMENT_HEAD` |
| DB tables | snake_case (via `@@map`) | `recruitment_requests` |
| Message patterns | dot.notation | `recruiting.create-request` |
| Packages | `@wr/{name}` | `@wr/contracts` |

### TypeScript Rules

- **Strict mode mandatory** — `strict: true`, `noUnusedLocals`, `noUnusedParameters`
- **Target:** ES2022
- **Path aliases:** Webapp uses `@/*` → `src/*`; services use relative imports
- **Enums live in** `@wr/contracts` only — never inline
- **Zod schemas live in** `@wr/contracts` only

## Testing

- **Framework:** Jest with `ts-jest`
- **Test files:** Co-located or in `__tests__/` directories
- **Unit tests:** Mock `PrismaService` — never hit real DB
- **`@wr/ai`:** Pure unit tests (no DB, no DI)
- **E2E / Contract:** Test directories exist (`tests/e2e/`, `tests/contract/`) but are stubs

## Critical Anti-Patterns

1. ❌ Never use LLM for scoring/ranking (ADR-004)
2. ❌ Never define enums outside `@wr/contracts`
3. ❌ Never add HTTP decorators to microservice controllers
4. ❌ Never import PrismaClient directly — always inject PrismaService
5. ❌ Never bypass the approval chain
6. ❌ Never use Tailwind CSS — use CSS Variables design system only
7. ❌ Never create separate databases (ADR-006)
8. ❌ Never add pgvector columns to Prisma schema — use raw SQL
9. ❌ Never use SSR/Next.js patterns (ADR-005)
