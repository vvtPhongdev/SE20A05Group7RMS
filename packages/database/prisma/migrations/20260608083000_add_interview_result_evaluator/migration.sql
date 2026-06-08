-- AlterTable: track which user (HR Manager / panel member) recorded the result
ALTER TABLE "interview_results" ADD COLUMN "evaluator_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "idx_interview_results_evaluator" ON "interview_results"("evaluator_id");

-- AddForeignKey
ALTER TABLE "interview_results" ADD CONSTRAINT "interview_results_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
