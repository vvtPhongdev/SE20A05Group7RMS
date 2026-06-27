-- Track OCR/AI extraction independently for each CV document.
ALTER TABLE "candidate_cvs"
ADD COLUMN "processing_status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN "processing_method" TEXT,
ADD COLUMN "processing_error" TEXT,
ADD COLUMN "structured_data" JSONB,
ADD COLUMN "extracted_at" TIMESTAMP(3);

-- Existing parsed CVs remain ready and are marked as local text extractions.
UPDATE "candidate_cvs"
SET "processing_status" = 'COMPLETED',
    "processing_method" = 'LOCAL_TEXT'
WHERE "parsed_at" IS NOT NULL OR length(trim("raw_text")) > 0;

CREATE INDEX "idx_candidate_cvs_processing_status"
ON "candidate_cvs"("processing_status");
