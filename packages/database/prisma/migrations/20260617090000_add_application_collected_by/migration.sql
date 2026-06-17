-- CreateTable
CREATE TABLE IF NOT EXISTS "applications" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "collected_by_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- AlterTable to make sure collected_by_id is present if table already existed
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "collected_by_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "uq_applications_request_candidate" ON "applications"("request_id", "candidate_id");
CREATE INDEX IF NOT EXISTS "idx_applications_request" ON "applications"("request_id");
CREATE INDEX IF NOT EXISTS "idx_applications_candidate" ON "applications"("candidate_id");
CREATE INDEX IF NOT EXISTS "idx_applications_collected_by" ON "applications"("collected_by_id");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'applications_request_id_fkey'
  ) THEN
    ALTER TABLE "applications"
      ADD CONSTRAINT "applications_request_id_fkey"
      FOREIGN KEY ("request_id") REFERENCES "recruitment_requests"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'applications_candidate_id_fkey'
  ) THEN
    ALTER TABLE "applications"
      ADD CONSTRAINT "applications_candidate_id_fkey"
      FOREIGN KEY ("candidate_id") REFERENCES "candidate_profiles"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'applications_collected_by_id_fkey'
  ) THEN
    ALTER TABLE "applications"
      ADD CONSTRAINT "applications_collected_by_id_fkey"
      FOREIGN KEY ("collected_by_id") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
