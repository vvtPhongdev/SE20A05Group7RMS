---

## Nhiệm vụ 1: Triển khai RolesGuard hỗ trợ đa doanh nghiệp sử dụng Reflector

### 1. Câu hỏi gửi AI (Prompt)

```text
Viết một RolesGuard trong NestJS để kiểm tra vai trò người dùng dựa trên metadata. Guard phải hỗ trợ đa doanh nghiệp bằng cách đối chiếu organizationId của người dùng với request params.
```

### 2. Câu trả lời chi tiết của AI

Guard nên trích xuất vai trò từ Reflector. Nếu vai trò khớp, trích xuất `user.organizationId` và đối chiếu với parameter `req.params.orgId`. Trả về lỗi ForbiddenException nếu không khớp.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi xem xét mã của RolesGuard. Chúng tôi đã tùy biến lớp guard này để thực hiện kiểm tra kép: (1) người dùng có quyền thích hợp (ví dụ: `DEPT_HEAD`) và (2) người dùng thuộc đúng tổ chức đang được yêu cầu (`user.organizationId === req.params.orgId`). Điều này ngăn chặn việc leo thang đặc quyền theo chiều ngang giữa các doanh nghiệp khác nhau.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Triển khai
- **Công cụ AI sử dụng:** Gemini
- **Thước đo định lượng:** Cấu hình phân quyền cho 3 vai trò
- **Rủi ro & Hạn chế quan sát được:** Thay đổi vai trò người dùng trong DB không cập nhật ngay vào session token đang hoạt động.

---

## Nhiệm vụ 2: Truyền thông tin ngữ cảnh người dùng (userId, orgId) qua TCP microservice transporter

### 1. Câu hỏi gửi AI (Prompt)

```text
Làm thế nào để truyền userId và organizationId của người dùng đã xác thực từ Gateway xuống các microservices qua NestJS TCP transporter?
```

### 2. Câu trả lời chi tiết của AI

Đóng gói các payload gửi qua TCP vào một wrapper object chứa thông tin ngữ cảnh:
```typescript
this.client.send('pattern', { data: payload, context: { userId, orgId } });
```

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi xem xét cơ chế giao tiếp microservice. Vì NestJS TCP transporter không có header HTTP truyền thống để lưu session, chúng tôi đã đóng gói dữ liệu request trong một cấu trúc chuẩn chứa trường `context` (gồm userId và organizationId). Ở phía microservice nhận, chúng tôi xây dựng một Interceptor để tự động trích xuất thông tin ngữ cảnh này và đặt vào luồng thực thi.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Triển khai
- **Công cụ AI sử dụng:** Gemini
- **Thước đo định lượng:** Truyền ngữ cảnh qua lại giữa 2 microservices
- **Rủi ro & Hạn chế quan sát được:** Payload TCP ở dạng read-only, cần clone trước khi chèn ngữ cảnh.

---

## Nhiệm vụ 3: Viết integration test đảm bảo cô lập dữ liệu giữa các doanh nghiệp

### 1. Câu hỏi gửi AI (Prompt)

```text
Tạo các bộ integration test bằng Jest để kiểm tra rằng người dùng thuộc Doanh nghiệp A không thể xem hoặc chỉnh sửa tài nguyên của Doanh nghiệp B.
```

### 2. Câu trả lời chi tiết của AI

Gửi request đến endpoint bảo mật bằng token của người dùng A nhưng truyền tham số ID tổ chức của doanh nghiệp B. Kiểm tra xem Gateway có trả về lỗi 403 Forbidden hay không.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi đã cấu hình các kịch bản kiểm thử tích hợp. Chúng tôi xác thực tính cô lập bằng cách cho Người dùng thuộc Doanh nghiệp A gửi request kèm JWT hợp lệ, nhưng thay đổi tham số ID tài nguyên thành ID thuộc Doanh nghiệp B. Chúng tôi kiểm tra xem API có chặn và trả về đúng lỗi 403 Forbidden hay không.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Kiểm thử
- **Công cụ AI sử dụng:** Gemini
- **Thước đo định lượng:** Thực thi 6 kịch bản kiểm thử tích hợp
- **Rủi ro & Hạn chế quan sát được:** Nếu mock dữ liệu không khớp UUID thì database có thể báo lỗi định dạng trước khi chạy logic cô lập.

