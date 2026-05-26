# 4. AI Algorithms & Pipeline

## Evidence Extraction Pipeline

```
CV/JD Upload
    ↓
Document Parsing (pdf-parse / mammoth)
    ↓
CAR Triple Extraction (Context → Action → Result)
    ↓
Skill & Capability Graph Extraction
    ↓
Vector Embedding (per evidence chunk) — BullMQ worker
    ↓
Store in PostgreSQL (JSONB + pgvector)
```

## Matching Algorithm (Implemented)

The matching engine combines **three scoring dimensions** via a deterministic composite formula:

```
overallScore = 0.40 × vectorScore + 0.35 × graphScore + 0.25 × coverageScore
```

### 4.1 Vector Similarity (40% weight)
- Evidence text is embedded using **all-MiniLM-L6-v2** (384 dimensions, self-hosted via `@xenova/transformers`)
- Stored in `evidence_embeddings.embedding` column (pgvector `vector(384)`)
- Cosine similarity via `ivfflat` index for fast nearest-neighbor search
- Processed asynchronously by a BullMQ embedding worker

### 4.2 Knowledge Graph Proximity (35% weight)
- **~200 skill nodes** across 11 categories (Language, Framework, Library, Database, Cloud, DevOps, Paradigm, Role, Domain, Tool, Platform)
- **~180 edges** with 5 relationship types: `IS_A`, `PART_OF`, `RELATED_TO`, `VARIANT_OF`, `REQUIRES`
- BFS shortest-path distance converted to confidence:
  - Distance 0 (exact/alias): **1.00**
  - Distance 1 (direct neighbor): **0.85**
  - Distance 2: **0.65**
  - Distance 3: **0.45**
  - Distance 4+: **0.25**
  - Unreachable: **0.00**
- Enables semantic discovery: "Web Developer" → React, Angular, Vue.js, Express.js, Node.js, JavaScript, TypeScript, MongoDB, PostgreSQL, etc.

### 4.3 Coverage Score (25% weight)
- Fraction of required skills covered by candidate at confidence ≥ 0.45
- `coverageScore = matchedCount / requiredSkillCount`

## Gap Classification (Implemented)

Unmatched required skills (confidence < 0.45) are classified by their graph category:

| Gap Type | Triggered By | Default Severity |
|----------|-------------|------------------|
| **TOOL** | Language, Framework, Library, Tool, Platform | MINOR |
| **PARADIGM** | Paradigm | MODERATE |
| **OPS_CLOUD** | Cloud, DevOps | MODERATE |
| **ARCHITECTURE** | Role, Domain | CRITICAL |

> Severity is downgraded to MINOR if a weak graph match exists (0 < confidence < 0.45).

## Readiness Labels (Implemented Thresholds)

The final output is a **readiness label**, not a percentage. Labels are assigned by deterministic rules:

| Label | Threshold | Conditions |
|-------|-----------|------------|
| 🟢 **READY_NOW** | score ≥ 0.80 | 0 critical gaps, coverage ≥ 85% |
| 🔵 **READY_WITH_SHORT_RAMP_UP** | score ≥ 0.65 | 0 critical gaps, coverage ≥ 65% |
| 🟡 **DOMAIN_SPECIALIST_WITH_TECH_GAP** | score ≥ 0.50 | ≤ 2 moderate gaps |
| 🟠 **STRONG_FUNDAMENTALS_NEEDS_DOMAIN** | score ≥ 0.35 | — |
| 🔴 **SIGNIFICANT_GAPS** | score ≥ 0.15 | — |
| ⚪ **INSUFFICIENT_EVIDENCE** | score > 0 | — |
| ⛔ **OUT_OF_SCOPE** | score = 0 | No graph overlap |

## Scoring: Deterministic, Not Generative

All candidate readiness assessments are produced by deterministic pipelines:
vector similarity, knowledge graph distance, hard constraint rules, and
gap classification. No LLM is used for scoring, ranking, or explanation
generation (ADR-004).

Interview focus questions are derived directly from the structured gap
analysis — no generative narration layer is involved.

## AI Honesty Spectrum (Visual States)

Every UI component reflects AI confidence through three visual states:

| State | Visual Treatment | Meaning |
|-------|-----------------|---------|
| **Confident** | Solid colors, full opacity | Strong evidence support |
| **Uncertain** | Muted/amber tones, dashed borders | Partial evidence, needs verification |
| **Insufficient** | Gray skeleton + badge + CTA | No evidence found — actionable, not misleading |

---
