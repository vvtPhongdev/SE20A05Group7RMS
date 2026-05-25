-- 003_create_ivfflat_index.sql
-- IVFFlat index for approximate nearest neighbor search
-- Best run after >1000 rows exist for optimal clustering
-- lists = 100 is appropriate for up to ~100k rows

CREATE INDEX IF NOT EXISTS idx_evidence_embeddings_vector
  ON evidence_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

COMMENT ON INDEX idx_evidence_embeddings_vector IS 'IVFFlat ANN index for cosine similarity search';
