---

## Nhiệm vụ 1: Xây dựng service đọc và trích xuất nội dung file CV sử dụng Mammoth và thư viện Transformers

### 1. Câu hỏi gửi AI (Prompt)

```text
Viết một NestJS service để trích xuất văn bản từ CV đã tải lên (PDF, DOCX) và sử dụng `@xenova/transformers` để tạo ra các vector nhúng tương ứng.
```

### 2. Câu trả lời chi tiết của AI

```typescript
import { pipeline } from '@xenova/transformers';
const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
const result = await extractor(text, { pooling: 'mean', normalize: true });
const embedding = Array.from(result.data);
```

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi triển khai bộ phân tích CV. Chúng tôi đã tích hợp cả Mammoth (cho file DOCX) và pdf-parse (cho file PDF) vào cùng một service. Chúng tôi thiết lập bộ lọc định dạng file ở đầu vào để chặn các file không hợp lệ và đảm bảo độ dài văn bản trích xuất được cắt bớt để không vượt quá giới hạn token của mô hình AI.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Triển khai
- **Công cụ AI sử dụng:** Codex/GitHub Copilot
- **Thước đo định lượng:** Hỗ trợ 3 định dạng file phổ biến (PDF, DOC, DOCX)
- **Rủi ro & Hạn chế quan sát được:** Thư viện đọc file nhị phân có thể hoạt động khác nhau tùy hệ điều hành khi build docker.

---

## Nhiệm vụ 2: Xây dựng API Portal cho ứng viên để tải CV và chọn lịch phỏng vấn

### 1. Câu hỏi gửi AI (Prompt)

```text
Tạo các Swagger annotation và NestJS controller cho cổng thông tin ứng viên: tải lên CV, chọn lịch phỏng vấn và xem thông báo tuyển dụng.
```

### 2. Câu trả lời chi tiết của AI

Định nghĩa các controller `POST /candidate/cv` và `PATCH /candidate/slots/:slotId`. Thêm các decorator `@ApiBody` và `@ApiOperation` để sinh tài liệu API.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi xem xét các endpoint cho portal ứng viên. Chúng tôi đã bổ sung logic kiểm tra quyền sở hữu bản ghi để ngăn chặn việc ứng viên này thay đổi lịch phỏng vấn hoặc ghi đè CV của ứng viên khác thông qua việc thay đổi ID trên URL yêu cầu.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Triển khai
- **Công cụ AI sử dụng:** GitHub Copilot
- **Thước đo định lượng:** Xây dựng thành công 3 endpoint chính
- **Rủi ro & Hạn chế quan sát được:** Lịch phỏng vấn ứng viên chọn có thể trùng chéo với lịch của người phỏng vấn nếu không khóa kịp thời.

---

## Nhiệm vụ 3: Triển khai quy trình thay thế file CV cũ trên object storage một cách an toàn

### 1. Câu hỏi gửi AI (Prompt)

```text
Làm thế nào để thay thế file CV của ứng viên một cách an toàn? Chúng tôi cần xóa file cũ trên object storage và cập nhật database record đồng thời.
```

### 2. Câu trả lời chi tiết của AI

Trong transaction của bạn, thực hiện cập nhật bản ghi CV trước. Nếu cập nhật database thành công, gọi lệnh xóa file cũ trên S3. Nếu database lỗi, bỏ qua lệnh xóa.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi thiết kế giao dịch thay thế file. Chúng tôi đã đóng gói hoạt động cập nhật database và xóa file vật lý trong khối try-catch. File trên S3 chỉ bị xóa sau khi giao dịch database commit thành công, nhằm tránh tình trạng mất file gốc nếu xảy ra lỗi ghi cơ sở dữ liệu.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Kiểm thử
- **Công cụ AI sử dụng:** Codex
- **Thước đo định lượng:** Triển khai thành công 1 hook giao dịch an toàn
- **Rủi ro & Hạn chế quan sát được:** Có thể để lại file rác trên storage nếu tiến trình xóa gặp sự cố gián đoạn mạng giữa chừng.

---

## Nhiệm vụ 4: Xây dựng câu lệnh truy vấn tìm kiếm kết hợp giữa PGVector và TSVector

### 1. Câu hỏi gửi AI (Prompt)

```text
Viết một truy vấn SQL thuần cho PostgreSQL kết hợp pgvector similarity và full-text search (tsvector) để tìm kiếm ứng viên theo nội dung CV.
```

### 2. Câu trả lời chi tiết của AI

```sql
SELECT *, (1 - (embedding <=> $1)) AS similarity, ts_rank_cd(text_search_vector, to_tsquery($2)) AS text_rank
FROM "CandidateCV"
ORDER BY (similarity * 0.7 + text_rank * 0.3) DESC;
```

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi đánh giá câu truy vấn SQL kết hợp. Chúng tôi tinh chỉnh câu truy vấn để áp dụng trọng số linh hoạt (70% cho độ tương đồng ngữ nghĩa vector và 30% cho tần suất từ khóa FTS). Điều này cải thiện độ chính xác kết quả tìm kiếm khi nhà tuyển dụng tìm kiếm các kỹ năng đặc thù.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Triển khai
- **Công cụ AI sử dụng:** GitHub Copilot
- **Thước đo định lượng:** Xây dựng 1 câu truy vấn kết hợp tối ưu
- **Rủi ro & Hạn chế quan sát được:** Cần điều chỉnh ngưỡng lọc điểm tương đồng để tránh trả về quá nhiều kết quả không liên quan.

---

## Nhiệm vụ 5: Tập trung hóa phân quyền HR và giới hạn quyền truy cập nhận xét phỏng vấn

### 1. Câu hỏi gửi AI (Prompt)

```text
Viết mã kiểm tra phân quyền để đảm bảo chỉ người phỏng vấn được phân công lịch hoặc HR mới có thể cập nhật nhận xét phỏng vấn của ứng viên.
```

### 2. Câu trả lời chi tiết của AI

Trong feedback guard, tải thông tin lịch phỏng vấn lên. Kiểm tra xem `slot.interviewerId === user.id` hoặc `user.role === 'HR'`. Trả về false nếu cả hai điều kiện đều sai.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi đã cấu hình Guard kiểm soát cập nhật nhận xét phỏng vấn. Chúng tôi tùy biến để chỉ cho phép chính Người phỏng vấn được phân công lịch đó hoặc Quản lý HR thuộc doanh nghiệp đó có quyền thay đổi thông tin nhận xét, các thành viên khác chỉ có quyền xem.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Triển khai
- **Công cụ AI sử dụng:** Codex
- **Thước đo định lượng:** Cấu hình 1 bộ phân quyền thống nhất
- **Rủi ro & Hạn chế quan sát được:** Người dùng có thể bị chặn truy cập nếu ID người phỏng vấn bị gán sai trong database.

