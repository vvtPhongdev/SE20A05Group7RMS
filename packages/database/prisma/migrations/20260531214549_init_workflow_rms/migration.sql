/*
  Warnings:

  - You are about to drop the column `headline` on the `candidate_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `preferred_locations` on the `candidate_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `preferred_work_mode` on the `candidate_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `visibility` on the `candidate_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `years_of_experience` on the `candidate_profiles` table. All the data in the column will be lost.
  - You are about to drop the `applications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `approval_chain_levels` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `approval_chains` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `candidate_capability_models` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `candidate_packets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `evaluation_runs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `evidence_embeddings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `evidence_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `explanation_boxes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `gap_findings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hiring_request_approvals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hiring_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `interview_focus_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `invites` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `job_capability_models` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `organization_members` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reviewer_feedback` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `skill_edges` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `skill_nodes` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `email` to the `candidate_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `full_name` to the `candidate_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organization_id` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "applications" DROP CONSTRAINT "applications_applicant_user_id_fkey";

-- DropForeignKey
ALTER TABLE "applications" DROP CONSTRAINT "applications_candidate_profile_id_fkey";

-- DropForeignKey
ALTER TABLE "applications" DROP CONSTRAINT "applications_role_id_fkey";

-- DropForeignKey
ALTER TABLE "approval_chain_levels" DROP CONSTRAINT "approval_chain_levels_approval_chain_id_fkey";

-- DropForeignKey
ALTER TABLE "approval_chain_levels" DROP CONSTRAINT "approval_chain_levels_approver_user_id_fkey";

-- DropForeignKey
ALTER TABLE "approval_chains" DROP CONSTRAINT "approval_chains_department_id_fkey";

-- DropForeignKey
ALTER TABLE "approval_chains" DROP CONSTRAINT "approval_chains_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "candidate_capability_models" DROP CONSTRAINT "candidate_capability_models_candidate_profile_id_fkey";

-- DropForeignKey
ALTER TABLE "candidate_packets" DROP CONSTRAINT "candidate_packets_application_id_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_candidate_profile_id_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_role_id_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_uploaded_by_id_fkey";

-- DropForeignKey
ALTER TABLE "evaluation_runs" DROP CONSTRAINT "evaluation_runs_application_id_fkey";

-- DropForeignKey
ALTER TABLE "evidence_records" DROP CONSTRAINT "evidence_records_evaluation_run_id_fkey";

-- DropForeignKey
ALTER TABLE "evidence_records" DROP CONSTRAINT "evidence_records_source_document_id_fkey";

-- DropForeignKey
ALTER TABLE "explanation_boxes" DROP CONSTRAINT "explanation_boxes_evaluation_run_id_fkey";

-- DropForeignKey
ALTER TABLE "gap_findings" DROP CONSTRAINT "gap_findings_evaluation_run_id_fkey";

-- DropForeignKey
ALTER TABLE "hiring_request_approvals" DROP CONSTRAINT "hiring_request_approvals_approver_user_id_fkey";

-- DropForeignKey
ALTER TABLE "hiring_request_approvals" DROP CONSTRAINT "hiring_request_approvals_hiring_request_id_fkey";

-- DropForeignKey
ALTER TABLE "hiring_requests" DROP CONSTRAINT "hiring_requests_department_id_fkey";

-- DropForeignKey
ALTER TABLE "hiring_requests" DROP CONSTRAINT "hiring_requests_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "hiring_requests" DROP CONSTRAINT "hiring_requests_requested_by_id_fkey";

-- DropForeignKey
ALTER TABLE "interview_focus_items" DROP CONSTRAINT "interview_focus_items_evaluation_run_id_fkey";

-- DropForeignKey
ALTER TABLE "invites" DROP CONSTRAINT "invites_candidate_user_id_fkey";

-- DropForeignKey
ALTER TABLE "invites" DROP CONSTRAINT "invites_role_id_fkey";

-- DropForeignKey
ALTER TABLE "invites" DROP CONSTRAINT "invites_sent_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "job_capability_models" DROP CONSTRAINT "job_capability_models_role_id_fkey";

-- DropForeignKey
ALTER TABLE "organization_members" DROP CONSTRAINT "organization_members_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "organization_members" DROP CONSTRAINT "organization_members_user_id_fkey";

-- DropForeignKey
ALTER TABLE "reviewer_feedback" DROP CONSTRAINT "reviewer_feedback_evaluation_run_id_fkey";

-- DropForeignKey
ALTER TABLE "reviewer_feedback" DROP CONSTRAINT "reviewer_feedback_reviewer_user_id_fkey";

-- DropForeignKey
ALTER TABLE "roles" DROP CONSTRAINT "roles_hiring_request_id_fkey";

-- DropForeignKey
ALTER TABLE "roles" DROP CONSTRAINT "roles_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "skill_edges" DROP CONSTRAINT "skill_edges_source_id_fkey";

-- DropForeignKey
ALTER TABLE "skill_edges" DROP CONSTRAINT "skill_edges_target_id_fkey";

-- DropForeignKey
ALTER TABLE "skill_nodes" DROP CONSTRAINT "skill_nodes_parent_id_fkey";

-- AlterTable
ALTER TABLE "candidate_profiles" DROP COLUMN "headline",
DROP COLUMN "preferred_locations",
DROP COLUMN "preferred_work_mode",
DROP COLUMN "visibility",
DROP COLUMN "years_of_experience",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "full_name" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "structured_data" JSONB;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "department_id" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "organization_id" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT;

-- DropTable
DROP TABLE "applications";

-- DropTable
DROP TABLE "approval_chain_levels";

-- DropTable
DROP TABLE "approval_chains";

-- DropTable
DROP TABLE "candidate_capability_models";

-- DropTable
DROP TABLE "candidate_packets";

-- DropTable
DROP TABLE "documents";

-- DropTable
DROP TABLE "evaluation_runs";

-- DropTable
DROP TABLE "evidence_embeddings";

-- DropTable
DROP TABLE "evidence_records";

-- DropTable
DROP TABLE "explanation_boxes";

-- DropTable
DROP TABLE "gap_findings";

-- DropTable
DROP TABLE "hiring_request_approvals";

-- DropTable
DROP TABLE "hiring_requests";

-- DropTable
DROP TABLE "interview_focus_items";

-- DropTable
DROP TABLE "invites";

-- DropTable
DROP TABLE "job_capability_models";

-- DropTable
DROP TABLE "organization_members";

-- DropTable
DROP TABLE "reviewer_feedback";

-- DropTable
DROP TABLE "roles";

-- DropTable
DROP TABLE "skill_edges";

-- DropTable
DROP TABLE "skill_nodes";

-- CreateTable
CREATE TABLE "recruitment_requests" (
    "id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "headcount" INTEGER NOT NULL,
    "job_description" TEXT NOT NULL,
    "skill_requirements" JSONB NOT NULL DEFAULT '{}',
    "justification" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "reviewed_by_id" TEXT,
    "approved_by_id" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recruitment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_records" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "approver_id" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "comments" TEXT,
    "decided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_logs" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT,
    "performed_by_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overall_plans" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approved_by_id" TEXT,
    "revision_notes" TEXT,
    "created_by_id" TEXT NOT NULL,
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
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_cvs" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "raw_text" TEXT NOT NULL,
    "parsed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_cvs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_embeddings" (
    "id" TEXT NOT NULL,
    "cv_document_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "chunk_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cv_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_schedules" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "interviewers" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_results" (
    "id" TEXT NOT NULL,
    "interview_id" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "related_entity_id" TEXT,
    "related_entity_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "to_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_recruitment_requests_department" ON "recruitment_requests"("department_id");

-- CreateIndex
CREATE INDEX "idx_recruitment_requests_created_by" ON "recruitment_requests"("created_by_id");

-- CreateIndex
CREATE INDEX "idx_recruitment_requests_status" ON "recruitment_requests"("status");

-- CreateIndex
CREATE INDEX "idx_approval_records_request" ON "approval_records"("request_id");

-- CreateIndex
CREATE INDEX "idx_approval_records_approver" ON "approval_records"("approver_id");

-- CreateIndex
CREATE INDEX "idx_request_logs_request" ON "request_logs"("request_id");

-- CreateIndex
CREATE INDEX "idx_request_logs_performed_by" ON "request_logs"("performed_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_overall_plans_request" ON "overall_plans"("request_id");

-- CreateIndex
CREATE INDEX "idx_overall_plans_request" ON "overall_plans"("request_id");

-- CreateIndex
CREATE INDEX "idx_overall_plans_created_by" ON "overall_plans"("created_by_id");

-- CreateIndex
CREATE INDEX "idx_task_plans_overall_plan" ON "task_plans"("overall_plan_id");

-- CreateIndex
CREATE INDEX "idx_task_plans_assigned_to" ON "task_plans"("assigned_to_id");

-- CreateIndex
CREATE INDEX "idx_candidate_cvs_candidate" ON "candidate_cvs"("candidate_id");

-- CreateIndex
CREATE INDEX "idx_cv_embeddings_document" ON "cv_embeddings"("cv_document_id");

-- CreateIndex
CREATE INDEX "idx_interviews_request" ON "interview_schedules"("request_id");

-- CreateIndex
CREATE INDEX "idx_interviews_candidate" ON "interview_schedules"("candidate_id");

-- CreateIndex
CREATE INDEX "idx_interview_results_interview" ON "interview_results"("interview_id");

-- CreateIndex
CREATE INDEX "idx_notifications_user" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "idx_email_logs_user" ON "email_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_users_organization" ON "users"("organization_id");

-- CreateIndex
CREATE INDEX "idx_users_department" ON "users"("department_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_requests" ADD CONSTRAINT "recruitment_requests_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_requests" ADD CONSTRAINT "recruitment_requests_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_requests" ADD CONSTRAINT "recruitment_requests_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recruitment_requests" ADD CONSTRAINT "recruitment_requests_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_records" ADD CONSTRAINT "approval_records_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "recruitment_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_records" ADD CONSTRAINT "approval_records_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_logs" ADD CONSTRAINT "request_logs_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "recruitment_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_logs" ADD CONSTRAINT "request_logs_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overall_plans" ADD CONSTRAINT "overall_plans_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "recruitment_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overall_plans" ADD CONSTRAINT "overall_plans_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overall_plans" ADD CONSTRAINT "overall_plans_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_plans" ADD CONSTRAINT "task_plans_overall_plan_id_fkey" FOREIGN KEY ("overall_plan_id") REFERENCES "overall_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_plans" ADD CONSTRAINT "task_plans_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_cvs" ADD CONSTRAINT "candidate_cvs_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_embeddings" ADD CONSTRAINT "cv_embeddings_cv_document_id_fkey" FOREIGN KEY ("cv_document_id") REFERENCES "candidate_cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_schedules" ADD CONSTRAINT "interview_schedules_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "recruitment_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_schedules" ADD CONSTRAINT "interview_schedules_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_results" ADD CONSTRAINT "interview_results_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "interview_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "candidate_profiles_user_id_key" RENAME TO "uq_candidate_profiles_user";

-- RenameIndex
ALTER INDEX "organizations_slug_key" RENAME TO "uq_organizations_slug";

-- RenameIndex
ALTER INDEX "users_email_key" RENAME TO "uq_users_email";

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to cv_embeddings
ALTER TABLE cv_embeddings ADD COLUMN embedding vector(384);

-- Create index for vector similarity search
CREATE INDEX idx_cv_embeddings_vector ON cv_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
