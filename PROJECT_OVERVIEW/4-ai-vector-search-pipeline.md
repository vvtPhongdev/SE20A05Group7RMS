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
2. **Dữ liệu được chuyển hóa thành vector** sử dụng model embedding (all-MiniLM-L6-v2, 384 dimensions)
3. **Phòng Tuyển dụng tìm kiếm** ứng viên phù hợp bằng từ khóa hoặc mô tả năng lực tương đồng
4. **Cosine similarity** giúp tìm ứng viên có kỹ năng gần nhất với yêu cầu vị trí tuyển dụng

### Vector Storage

- **Column type:** `vector(384)` — matches MiniLM-L6-v2 output dimensions
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

## Scoring: Simple & Transparent

Candidate search results are ranked by **cosine similarity score** — a transparent, deterministic metric. No complex composite scoring or readiness labels. The HR team uses their professional judgment to evaluate candidates based on the search results and CV data.

---
