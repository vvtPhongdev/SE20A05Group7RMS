# Database Migration Guide — Works Reruiter

**Created:** 2026-05-23
**Database:** PostgreSQL 16 (pgvector/pgvector:pg16)
**ORM:** Prisma ^6.8.2

---

## Overview

This project uses a **hybrid migration strategy**:

1. **Prisma Migrate** for all relational models (26 models)
2. **Raw SQL migrations** for pgvector columns and indexes (outside Prisma)

## Quick Commands

```bash
# Start database
docker compose up -d postgres

# Generate migration from schema changes
cd packages/database
npx prisma migrate dev --name <migration-name>

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (DESTRUCTIVE — dev only)
npx prisma migrate reset

# Generate Prisma Client after schema change
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

## Prisma Migrations

### Naming Convention

```
YYYYMMDDHHMMSS_<action>_<entity>

Examples:
20260523_add_department_models
20260523_add_hiring_request_workflow
20260523_add_approval_chain_levels
```

### Current Model Inventory (26 models)

| Domain | Models | Status |
|--------|--------|--------|
| Identity | User, Organization, OrganizationMember | ✅ Migrated |
| Enterprise Structure | Department, ApprovalChain, ApprovalChainLevel | ⬜ Pending migration |
| Enterprise Workflow | HiringRequest, HiringRequestApproval | ⬜ Pending migration |
| Recruiting | Role, JobCapabilityModel, Application, Invite, EvaluationRun | ✅ Migrated |
| Profiles | CandidateProfile, CandidateCapabilityModel, Document | ✅ Migrated |
| Evidence | EvidenceRecord, GapFinding, ExplanationBox, InterviewFocusItem | ✅ Migrated |
| Review | ReviewerFeedback, CandidatePacket | ✅ Migrated |
| AI | SkillNode, SkillEdge | ✅ Migrated |

## Raw SQL Migrations (pgvector)

These are NOT managed by Prisma and must be applied separately.

### File Location
```
packages/database/migrations/sql/
├── 001_enable_pgvector.sql
├── 002_create_evidence_embeddings.sql
└── 003_create_ivfflat_index.sql
```

### Migration 001: Enable pgvector Extension
```sql
-- 001_enable_pgvector.sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Migration 002: Evidence Embeddings Table
```sql
-- 002_create_evidence_embeddings.sql
CREATE TABLE IF NOT EXISTS evidence_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_record_id UUID NOT NULL REFERENCES evidence_records(id) ON DELETE CASCADE,
  embedding vector(384) NOT NULL,  -- MiniLM-L6-v2 output
  model_version VARCHAR(50) NOT NULL DEFAULT 'all-MiniLM-L6-v2',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_evidence_embeddings_record UNIQUE (evidence_record_id)
);
```

### Migration 003: IVFFlat Index
```sql
-- 003_create_ivfflat_index.sql
-- Create after >1000 rows for optimal clustering
CREATE INDEX IF NOT EXISTS idx_evidence_embeddings_vector
  ON evidence_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

### Applying Raw SQL Migrations
```bash
# Via psql
PGPASSWORD=postgres psql -h localhost -U postgres -d works_reruiter \
  -f packages/database/migrations/sql/001_enable_pgvector.sql

# Or via Prisma's $executeRawUnsafe in a seed script
```

## Seed Data

### Development Seeds

```bash
cd packages/database
npx prisma db seed
```

Seed file: `packages/database/prisma/seed.ts`

### Recommended Seed Data

| Entity | Count | Purpose |
|--------|-------|---------|
| Organizations | 1 | "Acme Corp" |
| Departments | 3 | Engineering, Product, Design |
| Users (ADMIN) | 1 | admin@acme.com |
| Users (DEPT_HEAD) | 2 | Per department |
| Users (HIRING_MANAGER) | 2 | Senior managers |
| Users (RECRUITER) | 2 | HR team |
| Users (CANDIDATE) | 5 | Test candidates |
| Approval Chains | 1 | Default 2-level chain |
| Hiring Requests | 3 | DRAFT, PENDING, APPROVED |
| Roles | 2 | From approved requests |
| Skill Nodes | ~50 | Core skill taxonomy |
| Skill Edges | ~40 | Relationships |

## Environment Variables

```env
# packages/database/.env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/works_reruiter?schema=public"
```

## Deployment Checklist

1. ☐ `docker compose up -d` (Postgres + Redis)
2. ☐ `cd packages/database && npx prisma migrate deploy`
3. ☐ Apply raw SQL migrations (pgvector)
4. ☐ `npx prisma generate` (generate client)
5. ☐ `npx prisma db seed` (development only)
6. ☐ Verify: `npx prisma studio` — check all 26 models visible
