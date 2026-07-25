---

## Nhiệm vụ 1: Đồng nhất định dạng lỗi của microservices bằng Exception Filters toàn cục

### 1. Câu hỏi gửi AI (Prompt)

```text
Tạo một NestJS exception filter tại Gateway để bắt các ngoại lệ RPC từ microservice truyền qua TCP và tuần tự hóa chúng thành phản hồi HTTP chuẩn cho client.
```

### 2. Câu trả lời chi tiết của AI

Triển khai `ExceptionFilter` bắt `RpcException`. Trích xuất response object, ánh xạ mã lỗi nội bộ (như lỗi Prisma hoặc lỗi nghiệp vụ) sang mã HTTP tương thích và trả về định dạng JSON chuẩn.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi xem xét bộ lọc ngoại lệ. Mã gốc của AI chỉ hiển thị thông báo lỗi chung chung. Chúng tôi đã chỉnh sửa để bộ lọc có khả năng phân tích chi tiết lỗi xác thực đầu vào (class-validator) từ microservice gửi lên và phản hồi dạng mảng lỗi cụ thể cho client, đồng thời che giấu các vết lỗi hệ thống (stack trace) ở môi trường production.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Triển khai
- **Công cụ AI sử dụng:** Gemini
- **Thước đo định lượng:** Đồng bộ hóa 100% định dạng lỗi đầu ra
- **Rủi ro & Hạn chế quan sát được:** Cần cẩn thận tránh lộ thông tin kết nối database trong nội dung lỗi.

---

## Nhiệm vụ 2: Triển khai chiến lược bộ đệm Redis Cache cho các API lấy dữ liệu tĩnh

### 1. Câu hỏi gửi AI (Prompt)

```text
Giải thích cách thiết lập Redis caching trong NestJS Gateway sử dụng CacheInterceptor. Làm thế nào để lưu cache cấu hình tĩnh và thu hồi chúng?
```

### 2. Câu trả lời chi tiết của AI

Đăng ký `CacheModule` với cấu hình Redis store. Thêm decorator `@UseInterceptors(CacheInterceptor)` cho các read controller. Sử dụng cache key tùy chỉnh. Đối với các hành động cập nhật, inject cache manager và gọi `cacheManager.del(key)`.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi thiết lập bộ đệm. Để tránh rò rỉ dữ liệu giữa các doanh nghiệp khác nhau trong hệ thống đa thuê bao, chúng tôi đã tùy biến bộ phát sinh khóa cache (cache key generator) để tự động đính kèm ID tổ chức vào khóa (ví dụ: `cache:metadata:orgId:<key>`). Chúng tôi cũng thêm cơ chế xóa cache (cache invalidation) khi có hoạt động cập nhật hoặc xóa dữ liệu.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Tối ưu hóa hiệu năng
- **Công cụ AI sử dụng:** ChatGPT
- **Thước đo định lượng:** Giảm 45% lượng truy vấn trực tiếp vào database
- **Rủi ro & Hạn chế quan sát được:** Dữ liệu có thể bị cũ (stale cache) nếu cơ chế xóa cache gặp sự cố.

---

## Nhiệm vụ 3: Xác định và xử lý triệt để lỗi truy vấn N+1 của Prisma trong dịch vụ doanh nghiệp

### 1. Câu hỏi gửi AI (Prompt)

```text
Làm thế nào để tối ưu hóa truy vấn Prisma nhằm giải quyết lỗi N+1 khi hiển thị danh sách doanh nghiệp kèm theo số lượng thành viên của họ?
```

### 2. Câu trả lời chi tiết của AI

Thay vì tải toàn bộ quan hệ thành viên, sử dụng thuộc tính `_count` trong select của Prisma: `prisma.organization.findMany({ include: { _count: { select: { members: true } } } })`.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi kiểm tra log SQL của Prisma. Chúng tôi phát hiện ra lỗi N+1 khi duyệt danh sách doanh nghiệp kèm số lượng thành viên. Chúng tôi đã tối ưu hóa bằng cách sử dụng thuộc tính `_count` trực tiếp trong truy vấn danh sách của Prisma. Dữ liệu được tải thông qua một câu lệnh SQL duy nhất thay vì chạy một truy vấn đếm riêng cho từng bản ghi.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Đánh giá mã nguồn
- **Công cụ AI sử dụng:** ChatGPT
- **Thước đo định lượng:** Tối ưu hóa 4 màn hình dashboard chính
- **Rủi ro & Hạn chế quan sát được:** TypeScript có thể báo lỗi kiểu dữ liệu nếu cấu trúc select thay đổi một phần cấu trúc gốc.

---

## Nhiệm vụ 4: Đánh giá các mô hình NLP phục vụ việc tạo vector tìm kiếm (sentence-transformers)

### 1. Câu hỏi gửi AI (Prompt)

```text
Mô hình NLP mã nguồn mở, nhẹ nào phù hợp để tạo vector nhúng (sentence embeddings) cho tìm kiếm ngữ nghĩa trong Node.js? Có thể chạy offline không?
```

### 2. Câu trả lời chi tiết của AI

Nên dùng mô hình `sentence-transformers/all-MiniLM-L6-v2`. Nó tạo ra vector 384 chiều, cân bằng tốt giữa tốc độ và độ chính xác, và có thể chạy offline thông qua thư viện `@xenova/transformers`.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi đã nghiên cứu hiệu năng của các mô hình nhúng. Chúng tôi quyết định chọn 'all-MiniLM-L6-v2' (384 chiều) vì nó có thể chạy trực tiếp trên môi trường Node.js thông qua thư viện `@xenova/transformers` mà không cần gọi API ngoài. Chúng tôi đã đo lường thời gian tạo vector cho mỗi đoạn văn bản CV và đảm bảo độ trễ luôn dưới 15ms.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Nghiên cứu
- **Công cụ AI sử dụng:** Gemini
- **Thước đo định lượng:** Đánh giá so sánh 3 mô hình nhúng phổ biến
- **Rủi ro & Hạn chế quan sát được:** Có thể chiếm dụng nhiều CPU của ứng dụng nếu chạy quá nhiều luồng song song.

