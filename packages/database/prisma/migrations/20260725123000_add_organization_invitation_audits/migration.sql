ALTER TABLE "organization_invitations"
  ADD COLUMN "last_sent_at" TIMESTAMP(3),
  ADD COLUMN "resend_count" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "organization_invitation_audits" (
    "id" TEXT NOT NULL,
    "invitation_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organization_invitation_audits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_invitation_audit_invitation_created"
  ON "organization_invitation_audits"("invitation_id", "created_at");

ALTER TABLE "organization_invitation_audits"
  ADD CONSTRAINT "organization_invitation_audits_invitation_id_fkey"
  FOREIGN KEY ("invitation_id") REFERENCES "organization_invitations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
