-- The JobPosting model existed in the Prisma schema, but no earlier migration
-- created its backing table. Create the complete table here so this migration
-- also works when replaying the migration history on a fresh database.
CREATE TABLE "job_postings" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" JSONB NOT NULL DEFAULT '{}',
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "start_date" TIMESTAMP(3),
    "expire_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "job_postings_request_id_key"
ON "job_postings"("request_id");

CREATE INDEX "idx_job_postings_request"
ON "job_postings"("request_id");

CREATE INDEX "idx_job_postings_schedule"
ON "job_postings"("start_date", "expire_date");

ALTER TABLE "job_postings"
ADD CONSTRAINT "job_postings_request_id_fkey"
FOREIGN KEY ("request_id")
REFERENCES "recruitment_requests"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
