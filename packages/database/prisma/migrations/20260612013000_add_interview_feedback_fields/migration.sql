-- AlterTable
ALTER TABLE "interview_schedules"
ADD COLUMN IF NOT EXISTS "final_recommendation" TEXT,
ADD COLUMN IF NOT EXISTS "summary_notes" TEXT;

-- AlterTable
ALTER TABLE "interview_results"
ADD COLUMN IF NOT EXISTS "evaluator_id" TEXT,
ADD COLUMN IF NOT EXISTS "technical" INTEGER,
ADD COLUMN IF NOT EXISTS "communication" INTEGER,
ADD COLUMN IF NOT EXISTS "culture" INTEGER;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_interview_results_evaluator"
ON "interview_results"("evaluator_id");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'interview_results_evaluator_id_fkey'
  ) THEN
    ALTER TABLE "interview_results"
    ADD CONSTRAINT "interview_results_evaluator_id_fkey"
    FOREIGN KEY ("evaluator_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;
