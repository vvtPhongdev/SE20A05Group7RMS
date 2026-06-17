# 4. AI & Vector Search Pipeline

## CV Upload & Vector Processing

```
CV Upload (PDF/DOCX)
    ↓
Document Parsing (pdf-parse / mammoth) — extract raw text
    ↓
Structured Data Extraction — parse name, skills, experience, education
    ↓
Vector Embedding (per CV chunk) — BullMQ worker
    ↓
Store in PostgreSQL (JSONB structured data + pgvector embeddings)
```

## Semantic Search (Vector Search)

Hệ thống hỗ trợ tìm kiếm ứng viên thông minh thông qua Vector Search:

1. **CV được phân tích cú pháp** khi tải lên — trích xuất thông tin cấu trúc (kỹ năng, kinh nghiệm, học vấn)
2. **Dữ liệu được chuyển hóa thành vector** sử dụng RMS custom embedding model exported sang ONNX local (`packages/ai-models/rms-embedding-model`, 384 dimensions)
3. **Phòng Tuyển dụng tìm kiếm** ứng viên phù hợp bằng từ khóa hoặc mô tả năng lực tương đồng
4. **Cosine similarity** giúp tìm ứng viên có kỹ năng gần nhất với yêu cầu vị trí tuyển dụng

### Vector Storage

- **Column type:** `vector(384)` — matches the current RMS custom embedding output dimensions
- **Index type:** `ivfflat` for approximate nearest neighbor search
- **Docker image:** `pgvector/pgvector:pg16` (includes extension)

### Search Flow

```
HR inputs search query (e.g., "Senior Java Developer with Spring Boot experience")
    ↓
Query → Vector Embedding
    ↓
Cosine Similarity Search (pgvector)
    ↓
Ranked candidate list with relevance scores
    ↓
HR reviews and shortlists candidates
```

## Custom Embedding Model Pipeline

The default runtime model is a local ONNX model loaded through `@xenova/transformers`.

```bash
python -m venv ml/.venv
ml/.venv/Scripts/pip install -r ml/requirements.txt
ml/.venv/Scripts/python ml/scripts/build_triplets.py
ml/.venv/Scripts/python ml/scripts/train.py
ml/.venv/Scripts/python ml/scripts/convert.py
```

Runtime model layout:

```txt
packages/ai-models/rms-embedding-model/
  config.json
  tokenizer.json
  tokenizer_config.json
  onnx/model.onnx
```

Set `WR_EMBEDDING_MODEL_PATH` to override the local model directory.

## Scoring: Simple & Transparent

Candidate search results are ranked by **cosine similarity score** — a transparent, deterministic metric. No complex composite scoring or readiness labels. The HR team uses their professional judgment to evaluate candidates based on the search results and CV data.

---
