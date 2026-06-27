-- Persist candidate offer responses and auditable, idempotent task reminders.
ALTER TABLE "offer_letters"
ADD COLUMN "response" TEXT,
ADD COLUMN "response_note" TEXT;

CREATE TABLE "task_reminders" (
  "id" TEXT NOT NULL,
  "task_plan_id" TEXT NOT NULL,
  "reminder_key" TEXT NOT NULL,
  "scheduled_for" TIMESTAMP(3) NOT NULL,
  "sent_at" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "email_log_id" TEXT,
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "task_reminders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_task_reminders_task_key"
ON "task_reminders"("task_plan_id", "reminder_key");

CREATE INDEX "idx_task_reminders_scheduled_for"
ON "task_reminders"("scheduled_for");

ALTER TABLE "task_reminders"
ADD CONSTRAINT "task_reminders_task_plan_id_fkey"
FOREIGN KEY ("task_plan_id") REFERENCES "task_plans"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Internal worker table: block direct Supabase Data API access by default.
ALTER TABLE "task_reminders" ENABLE ROW LEVEL SECURITY;
