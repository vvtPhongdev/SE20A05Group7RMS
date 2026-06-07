CREATE TABLE "offer_letters" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "generated_by_id" TEXT NOT NULL,
    "position_title" TEXT NOT NULL,
    "department_name" TEXT NOT NULL,
    "compensation" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "email_log_id" TEXT,
    "sent_at" TIMESTAMP(3),
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_letters_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_offer_letters_request_candidate"
ON "offer_letters"("request_id", "candidate_id");

CREATE INDEX "idx_offer_letters_request" ON "offer_letters"("request_id");
CREATE INDEX "idx_offer_letters_candidate" ON "offer_letters"("candidate_id");
CREATE INDEX "idx_offer_letters_status" ON "offer_letters"("status");

ALTER TABLE "offer_letters"
ADD CONSTRAINT "offer_letters_request_id_fkey"
FOREIGN KEY ("request_id") REFERENCES "recruitment_requests"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "offer_letters"
ADD CONSTRAINT "offer_letters_candidate_id_fkey"
FOREIGN KEY ("candidate_id") REFERENCES "candidate_profiles"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "offer_letters"
ADD CONSTRAINT "offer_letters_generated_by_id_fkey"
FOREIGN KEY ("generated_by_id") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
