---

## Nhiệm vụ 1: Xây dựng logic xử lý phê duyệt tuần tự các cấp cho Yêu cầu tuyển dụng

### 1. Câu hỏi gửi AI (Prompt)

```text
Triển khai logic phê duyệt tuần tự trong NestJS với Prisma: khi cấp N được phê duyệt, tìm cấp N+1 và cập nhật trạng thái thành PENDING_APPROVAL. Nếu không có cấp N+1, cập nhật trạng thái yêu cầu thành APPROVED.
```

### 2. Câu trả lời chi tiết của AI

Thực hiện một giao dịch Prisma. Tải thông tin ApprovalRequest và chuỗi phê duyệt của nó. Kiểm tra cấp độ đã duyệt. Tìm người duyệt cấp N+1. Cập nhật trạng thái và lưu lịch sử. Nếu không còn cấp tiếp theo, đặt trạng thái thành `APPROVED`.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi kiểm tra mã xử lý phê duyệt. Chúng tôi đã đóng gói toàn bộ quy trình này vào một Prisma transaction: (1) cập nhật trạng thái cấp hiện tại thành APPROVED, (2) tìm kiếm cấp N+1 tiếp theo trong chuỗi, (3) nếu tồn tại, chuyển trạng thái yêu cầu sang PENDING_APPROVAL và gửi thông báo cho người phê duyệt mới, (4) nếu không còn cấp nào, cập nhật trạng thái cuối cùng của yêu cầu thành APPROVED. Chúng tôi cũng thêm kiểm tra trạng thái tài khoản của người duyệt tiếp theo để đảm bảo tài khoản của họ vẫn đang hoạt động.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Triển khai
- **Công cụ AI sử dụng:** Gemini
- **Thước đo định lượng:** Xác thực 3 bước chuyển đổi trạng thái phê duyệt
- **Rủi ro & Hạn chế quan sát được:** Có thể gây deadlock database nếu nhiều người cùng bấm duyệt một lúc trên cùng bản ghi.

---

## Nhiệm vụ 2: Tích hợp hàng đợi xử lý ngầm (background job) gửi email thông báo sử dụng BullMQ

### 1. Câu hỏi gửi AI (Prompt)

```text
Cấu hình BullMQ trong microservice NestJS để gửi email thông báo bất đồng bộ. Hàng đợi và worker nên được cấu trúc như thế nào?
```

### 2. Câu trả lời chi tiết của AI

Cài đặt `@nestjs/bullmq` và `bullmq`. Cấu hình `BullModule.forRoot` kết nối Redis. Trong service của bạn, inject Queue và thêm các job. Định nghĩa một lớp Worker với decorator `@Processor('queue-name')` để xử lý việc gửi mail thực tế.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi thiết lập BullMQ. Mã của AI thiếu phần xử lý lỗi kết nối SMTP và giới hạn số lần thử lại. Chúng tôi đã chỉnh sửa cấu hình job gửi mail để tự động thử lại tối đa 3 lần với khoảng thời gian trễ tăng dần (exponential backoff) nhằm tránh mất mát email thông báo khi mạng chập chờn.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Thiết kế kiến trúc
- **Công cụ AI sử dụng:** ChatGPT
- **Thước đo định lượng:** Giảm tải 60% thời gian phản hồi API do xử lý ngầm
- **Rủi ro & Hạn chế quan sát được:** Công việc có thể tích tụ trong hàng đợi nếu hệ thống SMTP gặp sự cố kéo dài.

---

## Nhiệm vụ 3: Kiểm thử tình trạng tranh chấp (race condition) khi nhiều người duyệt phê duyệt cùng lúc

### 1. Câu hỏi gửi AI (Prompt)

```text
Làm thế nào để kiểm thử race condition khi phê duyệt yêu cầu trong Jest? Đảm bảo rằng nếu hai người duyệt nhấn phê duyệt cùng một mili giây, chỉ có một transaction thành công.
```

### 2. Câu trả lời chi tiết của AI

Viết một test case sử dụng `Promise.all([
  service.approve(id, user1),
  service.approve(id, user2)
])`. Xác nhận rằng một promise sẽ thành công và promise còn lại sẽ thất bại với lỗi 409 Conflict.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi thực hiện kiểm thử tranh chấp. Chúng tôi viết một test case sử dụng `Promise.all` gửi đồng thời 2 yêu cầu phê duyệt cho cùng một bản ghi. Chúng tôi cấu hình database sử dụng cơ chế khóa bi quan hoặc kiểm tra phiên bản bản ghi để đảm bảo chỉ có 1 request thực thi thành công, request còn lại bị từ chối với lỗi 409 Conflict.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Kiểm thử
- **Công cụ AI sử dụng:** ChatGPT
- **Thước đo định lượng:** Gửi đồng thời 10 request song song trong môi trường kiểm thử
- **Rủi ro & Hạn chế quan sát được:** Prisma không hỗ trợ cú pháp select-for-update nguyên bản, cần dùng raw SQL.

