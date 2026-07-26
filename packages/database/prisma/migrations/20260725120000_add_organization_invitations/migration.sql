CREATE TABLE "organization_invitations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "department_id" TEXT,
    "invited_by_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "organization_invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_organization_invitations_code" ON "organization_invitations"("code");
CREATE INDEX "idx_organization_invitations_email" ON "organization_invitations"("email");
CREATE INDEX "idx_organization_invitations_organization" ON "organization_invitations"("organization_id");
CREATE INDEX "idx_organization_invitations_expires_at" ON "organization_invitations"("expires_at");

ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_department_id_fkey"
  FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
