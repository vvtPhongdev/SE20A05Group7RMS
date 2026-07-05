UPDATE "task_plans" AS task
SET
    "start_date" = NULL,
    "end_date" = NULL
FROM "overall_plans" AS plan
WHERE
    task."overall_plan_id" = plan."id"
    AND task."start_date" = plan."start_date"
    AND task."end_date" = plan."end_date";

ALTER TABLE "task_plans" ALTER COLUMN "start_date" DROP NOT NULL;
ALTER TABLE "task_plans" ALTER COLUMN "end_date" DROP NOT NULL;
