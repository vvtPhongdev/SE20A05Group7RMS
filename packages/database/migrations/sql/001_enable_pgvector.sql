-- 001_enable_pgvector.sql
-- Enable pgvector extension for vector similarity search
-- This must run before any vector column/index creation
CREATE EXTENSION IF NOT EXISTS vector;
