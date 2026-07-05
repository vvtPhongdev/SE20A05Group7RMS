ALTER TABLE "job_postings" ADD COLUMN "start_date" TIMESTAMP(3);

UPDATE "job_postings"
SET "start_date" = "created_at"
WHERE "start_date" IS NULL;

CREATE INDEX "idx_job_postings_schedule" ON "job_postings"("start_date", "expire_date");
