-- CreateTable
CREATE TABLE "overall_plans" (
    "id" TEXT NOT NULL,
    "hiring_request_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "revision_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "overall_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_plans" (
    "id" TEXT NOT NULL,
    "overall_plan_id" TEXT NOT NULL,
    "task_type" TEXT NOT NULL,
    "assigned_to_id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "overall_plans_hiring_request_id_key" ON "overall_plans"("hiring_request_id");

-- CreateIndex
CREATE INDEX "idx_overall_plans_status" ON "overall_plans"("status");

-- CreateIndex
CREATE INDEX "idx_task_plans_overall_plan" ON "task_plans"("overall_plan_id");

-- AddForeignKey
ALTER TABLE "overall_plans" ADD CONSTRAINT "overall_plans_hiring_request_id_fkey"
    FOREIGN KEY ("hiring_request_id") REFERENCES "hiring_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overall_plans" ADD CONSTRAINT "overall_plans_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overall_plans" ADD CONSTRAINT "overall_plans_approved_by_id_fkey"
    FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_plans" ADD CONSTRAINT "task_plans_overall_plan_id_fkey"
    FOREIGN KEY ("overall_plan_id") REFERENCES "overall_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_plans" ADD CONSTRAINT "task_plans_assigned_to_id_fkey"
    FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
