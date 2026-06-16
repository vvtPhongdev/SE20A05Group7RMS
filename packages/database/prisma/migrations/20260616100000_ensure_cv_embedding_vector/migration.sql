CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "cv_embeddings"
  ADD COLUMN IF NOT EXISTS "embedding" vector(384);

CREATE INDEX IF NOT EXISTS "idx_cv_embeddings_vector"
  ON "cv_embeddings"
  USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 100);
