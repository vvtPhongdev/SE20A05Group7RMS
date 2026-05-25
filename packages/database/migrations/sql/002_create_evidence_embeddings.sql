-- 002_create_evidence_embeddings.sql
-- Evidence embedding storage using pgvector
-- Dimension 384 matches MiniLM-L6-v2 output

CREATE TABLE IF NOT EXISTS evidence_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_record_id UUID NOT NULL REFERENCES evidence_records(id) ON DELETE CASCADE,
  embedding vector(384) NOT NULL,
  model_version VARCHAR(50) NOT NULL DEFAULT 'all-MiniLM-L6-v2',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_evidence_embeddings_record UNIQUE (evidence_record_id)
);

COMMENT ON TABLE evidence_embeddings IS 'Vector embeddings for evidence records, used in hybrid search (RRF)';
COMMENT ON COLUMN evidence_embeddings.embedding IS '384-dim vector from MiniLM-L6-v2';
