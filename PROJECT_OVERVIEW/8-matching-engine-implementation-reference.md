# 8. Matching Engine — Implementation Reference

## API Endpoints

| Method | Path | Service | Description |
|--------|------|---------|-------------|
| `POST` | `/api/talent/search` | recruiting → `talent.search` | Search candidates by skill/role query with graph expansion + scoring |
| `GET` | `/api/talent/expand?q=` | recruiting → `talent.expand` | Preview query expansion (debugging/UX) |

## Request / Response Examples

**Search Request** (`POST /api/talent/search`):
```json
{
  "query": "Web Developer",
  "filters": { "workMode": "REMOTE", "minYearsExperience": 2 },
  "pagination": { "page": 1, "pageSize": 20 }
}
```

**Search Response**:
```json
{
  "data": [
    {
      "candidateProfileId": "uuid",
      "displayName": "Jane Doe",
      "overallScore": 0.782,
      "readinessLabel": "READY_WITH_SHORT_RAMP_UP",
      "matchedSkills": [
        { "skill": "React", "source": "exact", "confidence": 1.0, "distance": 0 },
        { "skill": "Node.js", "source": "graph_expansion", "confidence": 0.85, "distance": 1 }
      ],
      "gaps": [
        { "skill": "Angular", "gapType": "TOOL", "severity": "MINOR" }
      ]
    }
  ],
  "meta": {
    "pagination": { "page": 1, "pageSize": 20, "total": 7 },
    "expandedQuery": {
      "resolved": "Web Developer",
      "expandedSkills": ["React", "Angular", "Vue.js", "JavaScript", ...]
    }
  }
}
```

## Implementation Files

| Layer | File | Purpose |
|-------|------|---------|
| **Graph Engine** | `packages/ai/src/skill-graph/graph.ts` | BFS traversal, distance calculation, query expansion |
| **Taxonomy** | `packages/ai/src/skill-graph/taxonomy.ts` | ~200 skill nodes + ~180 edges (static knowledge) |
| **Scorer** | `packages/ai/src/matching/scorer.ts` | Composite scoring + readiness label assignment |
| **Query Expander** | `packages/ai/src/matching/search-expander.ts` | Text query → expanded skill list |
| **Service** | `services/recruiting/src/modules/talent-search/talent-search.service.ts` | Orchestrates graph expansion → DB query → scoring → pagination |
| **Controller** | `services/recruiting/src/modules/talent-search/talent-search.controller.ts` | TCP message patterns for microservice transport |
| **Gateway** | `services/gateway/src/controllers/recruiting.controller.ts` | HTTP endpoints proxying to recruiting service |
| **Embedding Worker** | `services/worker/src/processors/embedding.processor.ts` | BullMQ job: text → all-MiniLM-L6-v2 → pgvector |

## Database Models (Prisma)

| Model | Table | Purpose |
|-------|-------|---------|
| `SkillNode` | `skill_nodes` | Knowledge graph vertex (name, aliases, category, hierarchy) |
| `SkillEdge` | `skill_edges` | Directed relationship (source, target, relationship, weight) |
| `EvidenceEmbedding` | `evidence_embeddings` | Vector embedding metadata + pgvector `vector(384)` column |

## Setup Requirements

```bash
# 1. Generate Prisma client with new models
npx prisma generate

# 2. Create migration
npx prisma migrate dev --name add-skill-graph-and-embeddings

# 3. Enable pgvector extension + add vector column
psql -d works_recruiter -c "
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE evidence_embeddings ADD COLUMN embedding vector(384);
CREATE INDEX idx_evidence_embeddings_vector
  ON evidence_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
"

# 4. Install transformers.js in worker
cd services/worker && npm install @xenova/transformers
```

---

*Last updated: 2026-05-20*
