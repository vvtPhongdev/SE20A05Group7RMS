---

## Nhiệm vụ 1: Tự động chuyển đổi trạng thái Chiến dịch tuyển dụng sang COMPLETED khi đạt mục tiêu

### 1. Câu hỏi gửi AI (Prompt)

```text
Viết truy vấn Prisma và kiểm tra logic để xem liệu chỉ tiêu tuyển dụng của chiến dịch đã đạt hay chưa, nếu rồi thì tự động đánh dấu chiến dịch là COMPLETED.
```

### 2. Câu trả lời chi tiết của AI

Trong transaction tuyển ứng viên, lấy ra chỉ tiêu của chiến dịch và đếm số ứng viên đã nhận. Nếu số lượng đạt chỉ tiêu, gọi lệnh cập nhật trạng thái Campaign sang COMPLETED.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi thiết kế cơ chế tự động đóng chiến dịch. Chúng tôi đã đặt logic kiểm tra này trong giao dịch (transaction) tuyển dụng ứng viên. Khi một ứng viên được cập nhật trạng thái là HIRED, hệ thống sẽ đếm lại tổng số ứng viên đã tuyển cho chiến dịch đó. Nếu đạt chỉ tiêu, trạng thái chiến dịch tự động chuyển sang COMPLETED trong cùng giao dịch để tránh xung đột dữ liệu.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Triển khai
- **Công cụ AI sử dụng:** Gemini
- **Thước đo định lượng:** Cấu hình 1 luồng xử lý tự động trạng thái chiến dịch
- **Rủi ro & Hạn chế quan sát được:** Nếu nhiều ứng viên được nhận cùng lúc có thể gây hiện tượng vượt quá số lượng chỉ tiêu nếu không khóa bảng ghi.

---

## Nhiệm vụ 2: Thiết kế cơ chế tự động xoay vòng và dự phòng khóa (Key Rotation) cho Gemini API

### 1. Câu hỏi gửi AI (Prompt)

```text
Triển khai cơ chế dự phòng và xoay vòng API key cho Gemini API trong Node.js. Nếu key hiện tại bị lỗi rate limit (429), nó phải tự chuyển sang key dự phòng và gọi lại.
```

### 2. Câu trả lời chi tiết của AI

```javascript
const keys = [process.env.GEMINI_KEY_1, process.env.GEMINI_KEY_2];
let keyIndex = 0;
// Trong try-catch:
catch (err) {
  if (err.status === 429) {
    keyIndex = (keyIndex + 1) % keys.length;
    // thực hiện gọi lại bằng key mới
  }
}
```

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi xây dựng cơ chế xoay vòng key. Chúng tôi đã bọc lời gọi Gemini API trong một vòng lặp thử lại. Nếu API trả về mã lỗi 429 (Rate Limit), hệ thống sẽ tự động chuyển chỉ mục sang API key tiếp theo trong danh sách cấu hình và thử lại yêu cầu. Nếu thử lại quá 3 lần vẫn lỗi, hệ thống mới ném ra ngoại lệ thực tế để bảo vệ tài nguyên.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Triển khai
- **Công cụ AI sử dụng:** Gemini
- **Thước đo định lượng:** Tự động xoay vòng qua 3 khóa API dự phòng
- **Rủi ro & Hạn chế quan sát được:** Vẫn có nguy cơ hết hạn ngạch (quota) nếu tất cả các key đều bị vượt ngưỡng gọi trong ngày.

---

## Nhiệm vụ 3: Khắc phục lỗi mất session cookie khi chuyển hướng từ Google OAuth callback

### 1. Câu hỏi gửi AI (Prompt)

```text
Tại sao session cookie bị mất khi người dùng chuyển hướng quay lại ứng dụng NestJS từ Google OAuth callback? Làm thế nào để khắc phục?
```

### 2. Câu trả lời chi tiết của AI

Lỗi này thường do giới hạn SameSite của cookie. Trong cấu hình middleware session của bạn, hãy đặt thuộc tính `sameSite: 'lax'` hoặc `sameSite: 'none'` (đi kèm `secure: true`) để cho phép truyền cookie khi chuyển hướng liên kết.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi phân tích nguyên nhân mất session khi đăng nhập Google OAuth. Trình duyệt Chrome phiên bản mới chặn cookie của bên thứ ba trong quá trình chuyển hướng nếu không thiết lập thuộc tính an toàn. Chúng tôi đã chỉnh sửa cấu hình cookie session tại Gateway bằng cách đặt `SameSite=Lax` và `Secure=true`, đảm bảo session người dùng được bảo toàn khi Google chuyển hướng trở lại ứng dụng.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Kiểm thử
- **Công cụ AI sử dụng:** ChatGPT
- **Thước đo định lượng:** Khắc phục thành công 1 lỗi mất session đăng nhập
- **Rủi ro & Hạn chế quan sát được:** Yêu cầu phải chạy HTTPS ở môi trường thử nghiệm để cookie có cờ Secure hoạt động.

---

## Nhiệm vụ 4: Đồng nhất bộ lọc danh sách yêu cầu tuyển dụng cho Trưởng bộ phận và HR

### 1. Câu hỏi gửi AI (Prompt)

```text
Tạo một bảng React hiển thị yêu cầu tuyển dụng dùng chung cho Trưởng phòng (có nút sửa/xóa) và HR (có nút phê duyệt/từ chối) dựa trên trạng thái yêu cầu.
```

### 2. Câu trả lời chi tiết của AI

Sử dụng một enum trạng thái chung (DRAFT, PENDING, APPROVED). Kết xuất có điều kiện các nút hành động dựa trên vai trò của người dùng hiện tại.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi chỉnh sửa giao diện quản lý yêu cầu. Chúng tôi nhận thấy có sự lệch pha trong cách hiển thị trạng thái yêu cầu giữa Trưởng phòng (người tạo) và HR (người phê duyệt). Chúng tôi đã refactor mã để dùng chung các bộ lọc trạng thái dựa trên cùng một enum được định nghĩa tập trung ở thư mục contract chung của dự án.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Triển khai
- **Công cụ AI sử dụng:** GitHub Copilot
- **Thước đo định lượng:** Đồng bộ giao diện của 2 phân hệ người dùng chính
- **Rủi ro & Hạn chế quan sát được:** Có thể hiển thị dữ liệu cũ nếu cache trình duyệt không được làm mới khi thay đổi trạng thái yêu cầu.

