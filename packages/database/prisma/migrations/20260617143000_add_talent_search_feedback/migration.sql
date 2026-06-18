CREATE TABLE IF NOT EXISTS "talent_search_runs" (
  "id" TEXT NOT NULL,
  "actor_user_id" TEXT,
  "actor_role" TEXT,
  "request_id" TEXT,
  "query" TEXT NOT NULL,
  "filters" JSONB NOT NULL DEFAULT '{}',
  "expanded_skills" JSONB NOT NULL DEFAULT '[]',
  "result_count" INTEGER NOT NULL DEFAULT 0,
  "model_version" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "talent_search_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "talent_search_feedback" (
  "id" TEXT NOT NULL,
  "search_run_id" TEXT NOT NULL,
  "candidate_id" TEXT NOT NULL,
  "actor_user_id" TEXT,
  "request_id" TEXT,
  "action" TEXT NOT NULL,
  "rank" INTEGER,
  "overall_score" DOUBLE PRECISION,
  "vector_score" DOUBLE PRECISION,
  "graph_score" DOUBLE PRECISION,
  "coverage_score" DOUBLE PRECISION,
  "query" TEXT NOT NULL,
  "candidate_snapshot" JSONB NOT NULL DEFAULT '{}',
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "talent_search_feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_talent_search_runs_actor" ON "talent_search_runs"("actor_user_id");
CREATE INDEX IF NOT EXISTS "idx_talent_search_runs_request" ON "talent_search_runs"("request_id");
CREATE INDEX IF NOT EXISTS "idx_talent_search_runs_created" ON "talent_search_runs"("created_at");

CREATE INDEX IF NOT EXISTS "idx_talent_search_feedback_run" ON "talent_search_feedback"("search_run_id");
CREATE INDEX IF NOT EXISTS "idx_talent_search_feedback_candidate" ON "talent_search_feedback"("candidate_id");
CREATE INDEX IF NOT EXISTS "idx_talent_search_feedback_request" ON "talent_search_feedback"("request_id");
CREATE INDEX IF NOT EXISTS "idx_talent_search_feedback_action" ON "talent_search_feedback"("action");
CREATE INDEX IF NOT EXISTS "idx_talent_search_feedback_created" ON "talent_search_feedback"("created_at");

ALTER TABLE "talent_search_runs"
  ADD CONSTRAINT "talent_search_runs_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "talent_search_runs"
  ADD CONSTRAINT "talent_search_runs_request_id_fkey"
  FOREIGN KEY ("request_id") REFERENCES "recruitment_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "talent_search_feedback"
  ADD CONSTRAINT "talent_search_feedback_search_run_id_fkey"
  FOREIGN KEY ("search_run_id") REFERENCES "talent_search_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "talent_search_feedback"
  ADD CONSTRAINT "talent_search_feedback_candidate_id_fkey"
  FOREIGN KEY ("candidate_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "talent_search_feedback"
  ADD CONSTRAINT "talent_search_feedback_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "talent_search_feedback"
  ADD CONSTRAINT "talent_search_feedback_request_id_fkey"
  FOREIGN KEY ("request_id") REFERENCES "recruitment_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
