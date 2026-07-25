---

## Nhiệm vụ 1: Tinh chỉnh điểm số đánh giá phỏng vấn và quy trình đề xuất ứng viên của HR

### 1. Câu hỏi gửi AI (Prompt)

```text
Viết mã kiểm tra đầu vào để đảm bảo điểm phỏng vấn nằm trong khoảng 1 đến 5 đối với các tiêu chí chuyên môn, độ phù hợp và giao tiếp.
```

### 2. Câu trả lời chi tiết của AI

Kiểm tra từng điểm số: `if (score < 1 || score > 5) throw new BadRequestException(...)`.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi kiểm tra ràng buộc nhập liệu. Chúng tôi đã cấu hình controller để kiểm tra nghiêm ngặt điểm số nhập vào (bao gồm: kỹ năng chuyên môn, độ phù hợp văn hóa, khả năng giao tiếp) phải nằm trong khoảng từ 1 đến 5. Chúng tôi cũng chặn việc sửa đổi điểm số sau khi đã submit để đảm bảo tính khách quan.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Triển khai
- **Công cụ AI sử dụng:** Codex
- **Thước đo định lượng:** Triển khai ràng buộc cho 3 tiêu chí đánh giá
- **Rủi ro & Hạn chế quan sát được:** Người phỏng vấn có thể gửi trùng bản ghi nhận xét nếu giao diện web bị double click.

---

## Nhiệm vụ 2: Viết script quét các API routes của Gateway để đối chiếu với cấu trúc màn hình App.tsx

### 1. Câu hỏi gửi AI (Prompt)

```text
Viết một script Node.js để phân tích các controller NestJS nhằm liệt kê toàn bộ các API route đang hoạt động trong hệ thống.
```

### 2. Câu trả lời chi tiết của AI

Sử dụng đối tượng `HttpAdapterHost` của NestJS để lấy danh sách router hoạt động từ Express/Fastify instance một cách động.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi xem xét script liệt kê API. Chúng tôi đã chạy script để xuất danh sách API thực tế và đối chiếu thủ công với các route định nghĩa trên React Frontend. Qua đó, chúng tôi phát hiện và loại bỏ được 2 endpoint cũ không còn sử dụng trên UI.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Kiểm thử
- **Công cụ AI sử dụng:** Codex
- **Thước đo định lượng:** Kiểm tra 39 màn hình ứng với 40 API endpoints
- **Rủi ro & Hạn chế quan sát được:** Các route chứa tham số động (dynamic path params) có thể bị đối chiếu sai nếu không được chuẩn hóa chuỗi.

---

## Nhiệm vụ 3: Thiết kế biểu đồ luồng chuyển màn hình và kiến trúc hệ thống

### 1. Câu hỏi gửi AI (Prompt)

```text
Tạo một sơ đồ tuần tự PlantUML mô tả luồng đăng ký và đăng nhập của người dùng qua API Gateway đến Identity microservice.
```

### 2. Câu trả lời chi tiết của AI

Sử dụng cú pháp PlantUML định nghĩa các đối tượng tham gia: User, Gateway, IdentityService, và DB. Vẽ các mũi tên mô tả luồng gửi thông tin và nhận về token.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi thiết kế luồng chuyển màn hình. Chúng tôi sử dụng PlantUML để vẽ biểu đồ tương tác tuần tự cho các luồng đăng ký, đăng nhập và phê duyệt yêu cầu. Các biểu đồ này được lưu trữ trong kho mã nguồn để các thành viên tiện tra cứu trong quá trình phát triển.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Tài liệu hóa
- **Công cụ AI sử dụng:** Codex
- **Thước đo định lượng:** Xây dựng 4 sơ đồ PlantUML chi tiết
- **Rủi ro & Hạn chế quan sát được:** Sơ đồ cần được cập nhật thủ công mỗi khi cấu trúc giao tiếp microservice thay đổi.

---

## Nhiệm vụ 4: Xây dựng ma trận truy vết yêu cầu hệ thống (Requirement Traceability Matrix)

### 1. Câu hỏi gửi AI (Prompt)

```text
Làm thế nào để thiết lập một ma trận truy vết yêu cầu bằng bảng Markdown để liên kết các yêu cầu chức năng với API và file test tương ứng?
```

### 2. Câu trả lời chi tiết của AI

Sử dụng cấu trúc bảng Markdown gồm các cột: Mã yêu cầu, Mô tả, Bảng dữ liệu liên quan, Endpoint API, Phương thức Service, File test tương ứng.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi xây dựng ma trận truy vết yêu cầu. Chúng tôi điền đầy đủ thông tin ánh xạ cho 22 yêu cầu chức năng (FR) của dự án. Ma trận này giúp nhóm đảm bảo rằng mọi chức năng trong tài liệu đặc tả đều được cài đặt API và có ít nhất một file kiểm thử đơn vị bao phủ.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Tài liệu hóa
- **Công cụ AI sử dụng:** Codex
- **Thước đo định lượng:** Ánh xạ thành công 22 yêu cầu chức năng
- **Rủi ro & Hạn chế quan sát được:** Đòi hỏi cập nhật thủ công mỗi khi có sự thay đổi về mặt tính năng.

---

## Nhiệm vụ 5: Tổng hợp tài liệu bàn giao dự án và các báo cáo tổng kết

### 1. Câu hỏi gửi AI (Prompt)

```text
Cung cấp cấu trúc tài liệu bàn giao mô tả hoạt động bảo mật, cơ chế hàng đợi xử lý ngầm và cấu hình ghi log của hệ thống RMS.
```

### 2. Câu trả lời chi tiết của AI

Biên soạn các chương mục bao gồm bảo mật Gateway, hàng đợi thử lại BullMQ, cấu hình thư viện Pino log ghi dấu hành vi người dùng và endpoint kiểm tra sức khỏe hệ thống.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi biên soạn tài liệu bàn giao. Chúng tôi đã thay thế toàn bộ dữ liệu mẫu trong tài liệu bằng các thông số thực tế của hệ thống (số lượng API hoạt động, độ phủ test, hướng dẫn cấu hình môi trường Docker).

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Tài liệu hóa
- **Công cụ AI sử dụng:** Codex, MarkItDown
- **Thước đo định lượng:** Biên soạn thành công 6 bộ tài liệu kỹ thuật
- **Rủi ro & Hạn chế quan sát được:** Tài liệu tĩnh có thể bị lệch hướng so với code thực tế nếu code được cập nhật liên tục.

