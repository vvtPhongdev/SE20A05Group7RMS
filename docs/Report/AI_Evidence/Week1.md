---

## Nhiệm vụ 1: Nghiên cứu và lựa chọn chiến lược tìm kiếm ứng viên tối ưu (Tìm kiếm kết hợp Hybrid vs tìm kiếm ngữ nghĩa Vector)

### 1. Câu hỏi gửi AI (Prompt)

```text
Chúng tôi đang xây dựng Hệ thống quản lý tuyển dụng (RMS). Nhà tuyển dụng cần tìm kiếm ứng viên dựa trên văn bản CV. Tìm kiếm từ khóa quá hạn chế, nhưng tìm kiếm ngữ nghĩa thuần túy (vector) lại bỏ sót các từ viết tắt hoặc từ khóa công nghệ cụ thể. Làm thế nào để xây dựng tìm kiếm kết hợp (hybrid search) hiệu quả? Cơ sở dữ liệu và stack nào tốt nhất cho Node.js?
```

### 2. Câu trả lời chi tiết của AI

Tôi khuyên bạn nên sử dụng phương pháp Tìm kiếm Kết hợp (Hybrid Search) với cơ sở dữ liệu PostgreSQL tích hợp hai tính năng chính:
1. **Tiện ích PGVector**: để lưu trữ các vector nhúng (dense embeddings). Bạn có thể dùng mô hình sentence-transformers 'all-MiniLM-L6-v2' (384 chiều) để tạo vector cho văn bản CV.
2. **Tìm kiếm toàn văn PostgreSQL (Full-Text Search - FTS)**: để lập chỉ mục các từ khóa thưa thớt (sparse keywords) sử dụng `tsvector` và `tsquery` (hỗ trợ các từ khóa kỹ thuật như JWT, OAuth, NestJS).

Để kết hợp kết quả, hãy sử dụng **Reciprocal Rank Fusion (RRF)**. Trong Node.js/Prisma, bạn có thể thực thi một truy vấn SQL thuần thông qua `prisma.$queryRaw` để tính toán cả khoảng cách cosine và xếp hạng FTS, cộng tổng các xếp hạng nghịch đảo của chúng và trả về kết quả ứng viên được xếp hạng. Điều này giúp tránh sự phức tạp khi sử dụng hai cơ sở dữ liệu riêng biệt.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi đã xem xét đề xuất của AI về việc sử dụng cấu trúc hai cơ sở dữ liệu (Elasticsearch cho tìm kiếm văn bản và pgvector cho vector nhúng) và đã bác bỏ nó vì chi phí vận hành cao và độ trễ đồng bộ dữ liệu. Thay vào đó, chúng tôi chọn giải pháp sử dụng khả năng tích hợp sẵn của PostgreSQL: kết hợp FTS (tsvector/tsquery) và pgvector cosine similarity (<=>). Chúng tôi triển khai thuật toán Reciprocal Rank Fusion (RRF) trực tiếp trong một truy vấn SQL thuần để đảm bảo độ trễ dưới 100ms và tính nhất quán giao dịch dữ liệu tuyệt đối.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Phân tích yêu cầu
- **Công cụ AI sử dụng:** Gemini
- **Thước đo định lượng:** Phân tích 2 phương pháp tìm kiếm, chọn Hybrid
- **Rủi ro & Hạn chế quan sát được:** Có thể giảm hiệu năng khi cơ sở dữ liệu phình to, cần tối ưu hóa và tinh chỉnh chỉ mục.

---

## Nhiệm vụ 2: Thiết kế sơ đồ cơ sở dữ liệu (ERD) ban đầu cho hệ thống đa doanh nghiệp (recruiter, department head, campaign, candidate, CV)

### 1. Câu hỏi gửi AI (Prompt)

```text
Vui lòng viết một cấu trúc cơ sở dữ liệu mẫu bằng cú pháp Prisma cho hệ thống RMS đa doanh nghiệp (multi-tenant). Chúng tôi cần các bảng: Organizations (doanh nghiệp), Users (roles: GLOBAL_ADMIN, ORG_ADMIN, DEPT_HEAD, HR_USER), Departments, RecruitmentRequests, ApprovalChains, Campaigns, CandidateProfiles, CVs, và Interviews.
```

### 2. Câu trả lời chi tiết của AI

Dưới đây là cấu trúc Prisma schema được đề xuất:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  GLOBAL_ADMIN
  ORG_ADMIN
  DEPT_HEAD
  HR_USER
}

model Organization {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  users     User[]
  departments Department[]
  createdAt DateTime @default(now())
}

model User {
  id             String        @id @default(uuid())
  email          String        @unique
  name           String
  role           Role
  organizationId String
  organization   Organization  @relation(fields: [organizationId], references: [id])
  createdAt      DateTime      @default(now())
}

model Department {
  id             String        @id @default(uuid())
  name           String
  organizationId String
  organization   Organization  @relation(fields: [organizationId], references: [id])
}
```

Hãy đảm bảo tất cả các truy vấn đa doanh nghiệp luôn lọc theo `organizationId` để đảm bảo cô lập dữ liệu.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi đã kiểm tra sơ đồ đề xuất của AI đối với các yêu cầu dự án. Chúng tôi chọn lọc và tùy biến các mối quan hệ thực thể: (1) đơn giản hóa mô hình ApprovalChain để ánh xạ trực tiếp các cấp bậc phê duyệt tới Trưởng bộ phận và quản lý HR, (2) bắt buộc thêm ràng buộc cô lập dữ liệu trên tất cả các thực thể chính bằng khóa ngoại organizationId, và (3) lập chỉ mục trên các khóa ngoại để tối ưu hóa hiệu năng truy vấn và ngăn chặn quét toàn bảng (table scans).

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Thiết kế
- **Công cụ AI sử dụng:** Gemini
- **Thước đo định lượng:** Tạo ra 9 bảng thực thể và 12 mối quan hệ
- **Rủi ro & Hạn chế quan sát được:** Prisma schema không hỗ trợ vẽ biểu đồ trực quan, cần đồng bộ thủ công với Draw.io.

