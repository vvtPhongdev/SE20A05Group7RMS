-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "password_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "member_role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "head_user_id" TEXT,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_chains" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "department_id" TEXT,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_chains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_chain_levels" (
    "id" TEXT NOT NULL,
    "approval_chain_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "approver_user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "approval_chain_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hiring_requests" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "justification" TEXT,
    "headcount" INTEGER NOT NULL DEFAULT 1,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "work_mode" TEXT,
    "location" TEXT,
    "budget_range" JSONB,
    "target_start_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "current_level" INTEGER NOT NULL DEFAULT 0,
    "rejection_reason" TEXT,
    "revision_notes" TEXT,
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hiring_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hiring_request_approvals" (
    "id" TEXT NOT NULL,
    "hiring_request_id" TEXT NOT NULL,
    "approver_user_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "decision" TEXT NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hiring_request_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "hiring_request_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "work_mode" TEXT,
    "location" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_capability_models" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "source_document_id" TEXT NOT NULL,
    "capabilities" JSONB NOT NULL,
    "hard_constraints" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_capability_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "headline" TEXT,
    "summary" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'REGISTERED_ONLY',
    "preferred_work_mode" TEXT,
    "preferred_locations" JSONB,
    "years_of_experience" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_capability_models" (
    "id" TEXT NOT NULL,
    "candidate_profile_id" TEXT NOT NULL,
    "source_document_id" TEXT NOT NULL,
    "capabilities" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_capability_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "storage_path" TEXT,
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "parsed_content" TEXT,
    "parse_error" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "role_id" TEXT,
    "candidate_profile_id" TEXT,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "candidate_profile_id" TEXT NOT NULL,
    "applicant_user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "cover_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invites" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "sent_by_user_id" TEXT NOT NULL,
    "candidate_user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_runs" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "readiness_label" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "source_snapshot" JSONB,
    "rule_config_version" TEXT,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_records" (
    "id" TEXT NOT NULL,
    "evaluation_run_id" TEXT NOT NULL,
    "source_document_id" TEXT,
    "evidence_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "source_locations" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gap_findings" (
    "id" TEXT NOT NULL,
    "evaluation_run_id" TEXT NOT NULL,
    "gap_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "required_by" TEXT,
    "suggested_ramp_up" TEXT,
    "source_locations" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gap_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "explanation_boxes" (
    "id" TEXT NOT NULL,
    "evaluation_run_id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source_locations" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "explanation_boxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_focus_items" (
    "id" TEXT NOT NULL,
    "evaluation_run_id" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "suggested_questions" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "source_locations" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_focus_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviewer_feedback" (
    "id" TEXT NOT NULL,
    "evaluation_run_id" TEXT NOT NULL,
    "reviewer_user_id" TEXT NOT NULL,
    "rating" INTEGER,
    "comments" TEXT,
    "decision" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviewer_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_packets" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'PDF',
    "storage_path" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "candidate_packets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_nodes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" JSONB NOT NULL DEFAULT '[]',
    "category" TEXT NOT NULL,
    "parent_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_edges" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "skill_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_embeddings" (
    "id" TEXT NOT NULL,
    "evidence_record_id" TEXT NOT NULL,
    "text_hash" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'all-MiniLM-L6-v2',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "uq_org_members_user_org" ON "organization_members"("user_id", "organization_id");

-- CreateIndex
CREATE INDEX "idx_departments_organization" ON "departments"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_departments_org_code" ON "departments"("organization_id", "code");

-- CreateIndex
CREATE INDEX "idx_approval_chains_organization" ON "approval_chains"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_approval_chain_level" ON "approval_chain_levels"("approval_chain_id", "level");

-- CreateIndex
CREATE INDEX "idx_hiring_requests_organization" ON "hiring_requests"("organization_id");

-- CreateIndex
CREATE INDEX "idx_hiring_requests_department" ON "hiring_requests"("department_id");

-- CreateIndex
CREATE INDEX "idx_hiring_requests_status" ON "hiring_requests"("status");

-- CreateIndex
CREATE INDEX "idx_hiring_requests_requested_by" ON "hiring_requests"("requested_by_id");

-- CreateIndex
CREATE INDEX "idx_hiring_approvals_request" ON "hiring_request_approvals"("hiring_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_hiring_approval_request_user_level" ON "hiring_request_approvals"("hiring_request_id", "approver_user_id", "level");

-- CreateIndex
CREATE INDEX "idx_roles_organization_id" ON "roles"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_capability_models_role_id_key" ON "job_capability_models"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_profiles_user_id_key" ON "candidate_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_capability_models_candidate_profile_id_key" ON "candidate_capability_models"("candidate_profile_id");

-- CreateIndex
CREATE INDEX "idx_documents_uploaded_by" ON "documents"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "idx_documents_state" ON "documents"("state");

-- CreateIndex
CREATE INDEX "idx_applications_status" ON "applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_applications_role_candidate" ON "applications"("role_id", "candidate_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_invites_role_candidate" ON "invites"("role_id", "candidate_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_runs_idempotency_key_key" ON "evaluation_runs"("idempotency_key");

-- CreateIndex
CREATE INDEX "idx_evaluation_runs_application" ON "evaluation_runs"("application_id");

-- CreateIndex
CREATE INDEX "idx_evaluation_runs_state" ON "evaluation_runs"("state");

-- CreateIndex
CREATE INDEX "idx_evidence_records_evaluation_run" ON "evidence_records"("evaluation_run_id");

-- CreateIndex
CREATE INDEX "idx_evidence_records_source_document" ON "evidence_records"("source_document_id");

-- CreateIndex
CREATE INDEX "idx_evidence_records_type" ON "evidence_records"("evidence_type");

-- CreateIndex
CREATE INDEX "idx_gap_findings_evaluation_run" ON "gap_findings"("evaluation_run_id");

-- CreateIndex
CREATE INDEX "idx_explanation_boxes_evaluation_run" ON "explanation_boxes"("evaluation_run_id");

-- CreateIndex
CREATE INDEX "idx_interview_focus_evaluation_run" ON "interview_focus_items"("evaluation_run_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_reviewer_feedback_run_user" ON "reviewer_feedback"("evaluation_run_id", "reviewer_user_id");

-- CreateIndex
CREATE INDEX "idx_candidate_packets_application" ON "candidate_packets"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_nodes_name_key" ON "skill_nodes"("name");

-- CreateIndex
CREATE INDEX "idx_skill_nodes_category" ON "skill_nodes"("category");

-- CreateIndex
CREATE UNIQUE INDEX "uq_skill_edges" ON "skill_edges"("source_id", "target_id", "relationship");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_embeddings_evidence_record_id_key" ON "evidence_embeddings"("evidence_record_id");

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_head_user_id_fkey" FOREIGN KEY ("head_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_chains" ADD CONSTRAINT "approval_chains_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_chains" ADD CONSTRAINT "approval_chains_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_chain_levels" ADD CONSTRAINT "approval_chain_levels_approval_chain_id_fkey" FOREIGN KEY ("approval_chain_id") REFERENCES "approval_chains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_chain_levels" ADD CONSTRAINT "approval_chain_levels_approver_user_id_fkey" FOREIGN KEY ("approver_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hiring_requests" ADD CONSTRAINT "hiring_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hiring_requests" ADD CONSTRAINT "hiring_requests_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hiring_requests" ADD CONSTRAINT "hiring_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hiring_request_approvals" ADD CONSTRAINT "hiring_request_approvals_hiring_request_id_fkey" FOREIGN KEY ("hiring_request_id") REFERENCES "hiring_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hiring_request_approvals" ADD CONSTRAINT "hiring_request_approvals_approver_user_id_fkey" FOREIGN KEY ("approver_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_hiring_request_id_fkey" FOREIGN KEY ("hiring_request_id") REFERENCES "hiring_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_capability_models" ADD CONSTRAINT "job_capability_models_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_capability_models" ADD CONSTRAINT "candidate_capability_models_candidate_profile_id_fkey" FOREIGN KEY ("candidate_profile_id") REFERENCES "candidate_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_candidate_profile_id_fkey" FOREIGN KEY ("candidate_profile_id") REFERENCES "candidate_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidate_profile_id_fkey" FOREIGN KEY ("candidate_profile_id") REFERENCES "candidate_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_applicant_user_id_fkey" FOREIGN KEY ("applicant_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_sent_by_user_id_fkey" FOREIGN KEY ("sent_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_candidate_user_id_fkey" FOREIGN KEY ("candidate_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_runs" ADD CONSTRAINT "evaluation_runs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_records" ADD CONSTRAINT "evidence_records_evaluation_run_id_fkey" FOREIGN KEY ("evaluation_run_id") REFERENCES "evaluation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_records" ADD CONSTRAINT "evidence_records_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gap_findings" ADD CONSTRAINT "gap_findings_evaluation_run_id_fkey" FOREIGN KEY ("evaluation_run_id") REFERENCES "evaluation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "explanation_boxes" ADD CONSTRAINT "explanation_boxes_evaluation_run_id_fkey" FOREIGN KEY ("evaluation_run_id") REFERENCES "evaluation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_focus_items" ADD CONSTRAINT "interview_focus_items_evaluation_run_id_fkey" FOREIGN KEY ("evaluation_run_id") REFERENCES "evaluation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_feedback" ADD CONSTRAINT "reviewer_feedback_evaluation_run_id_fkey" FOREIGN KEY ("evaluation_run_id") REFERENCES "evaluation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_feedback" ADD CONSTRAINT "reviewer_feedback_reviewer_user_id_fkey" FOREIGN KEY ("reviewer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_packets" ADD CONSTRAINT "candidate_packets_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_nodes" ADD CONSTRAINT "skill_nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "skill_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_edges" ADD CONSTRAINT "skill_edges_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "skill_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_edges" ADD CONSTRAINT "skill_edges_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "skill_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
