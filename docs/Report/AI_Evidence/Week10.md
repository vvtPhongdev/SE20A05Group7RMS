---

## Nhiệm vụ 1: Cấu hình Playwright để chạy E2E tests trong cấu trúc Monorepo

### 1. Câu hỏi gửi AI (Prompt)

```text
Viết file cấu hình Playwright phù hợp cho monorepo Turborepo, chỉ định đường dẫn test, lệnh khởi chạy server và cấu hình các trình duyệt giả lập.
```

### 2. Câu trả lời chi tiết của AI

```javascript
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:5173' },
  webServer: { command: 'npm run dev', url: 'http://localhost:5173' },
});
```

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi xây dựng môi trường test E2E. Chúng tôi cấu hình Playwright để chạy tự động trong tiến trình CI/CD. Chúng tôi đã thiết lập thêm cơ chế dọn dẹp dữ liệu thử nghiệm trong database trước khi chạy test thông qua script `globalSetup` nhằm đảm bảo tính độc lập giữa các lần chạy thử.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Kiểm thử
- **Công cụ AI sử dụng:** ChatGPT
- **Thước đo định lượng:** Tạo thành công 3 bộ kịch bản kiểm thử E2E
- **Rủi ro & Hạn chế quan sát được:** Kiểm thử E2E có thể bị lỗi ngẫu nhiên (flaky tests) nếu tốc độ phản hồi của UI chậm hơn thời gian timeout chờ của Playwright.

---

## Nhiệm vụ 2: Xây dựng runner chạy kiểm thử tích hợp API Postman tự động bằng Newman

### 1. Câu hỏi gửi AI (Prompt)

```text
Viết một script Node.js sử dụng thư viện newman để chạy bộ sưu tập Postman rms.postman_collection.json và xuất báo cáo kết quả ra thư mục chỉ định.
```

### 2. Câu trả lời chi tiết của AI

```javascript
const newman = require('newman');
newman.run({
  collection: require('./rms.postman_collection.json'),
  reporters: 'cli',
}, function (err) { if (err) { throw err; } });
```

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi thiết lập quy trình kiểm thử API. Chúng tôi đã tùy biến runner để tự động xuất kết quả báo cáo dưới dạng tệp HTML. Đồng thời, cấu hình script kiểm tra mã thoát (exit code) của Newman: nếu có bất kỳ test case nào thất bại, script sẽ trả về mã thoát khác 0 để tiến trình build của Gitlab/Github CI dừng lại và báo lỗi.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Kiểm thử
- **Công cụ AI sử dụng:** GitHub Copilot
- **Thước đo định lượng:** Cấu hình thành công 1 bộ chạy test API tự động
- **Rủi ro & Hạn chế quan sát được:** Dữ liệu kiểm thử cố định trong file collection Postman có thể bị lỗi thời so với database thay đổi.

---

## Nhiệm vụ 3: Tự động hóa đồng bộ danh sách phân công lỗi (assignees) sử dụng openpyxl và GitHub API

### 1. Câu hỏi gửi AI (Prompt)

```text
Viết một script python tải tệp Excel bằng openpyxl, trích xuất ID issue và màn hình tương ứng, đối chiếu với danh sách phân công, cập nhật Excel và gửi request PATCH để cập nhật assignees trên GitHub.
```

### 2. Câu trả lời chi tiết của AI

Định nghĩa file `update_issues.py` sử dụng `load_workbook` của openpyxl, thư viện `urllib.request` với phương thức PATCH, truyền tải payload JSON `{"assignees": [name]}` cùng các header xác thực.

### 3. Đánh giá, chọn lọc & Tùy biến mã nguồn của Sinh viên

**Mô tả quá trình kiểm tra:**
Chúng tôi chạy thử nghiệm kịch bản đồng bộ. Chúng tôi đã kiểm tra logic đối chiếu tên thành viên và tài khoản GitHub tương ứng. Chúng tôi bổ sung thêm kiểm soát lỗi phân trang và giới hạn tần suất gọi API (rate limit) của GitHub để đảm bảo script có thể chạy hoàn tất cho danh sách hơn 50 issues mà không bị chặn.

**Thông tin kiểm toán:**
- **Giai đoạn SDLC:** Tự động hóa
- **Công cụ AI sử dụng:** Gemini
- **Thước đo định lượng:** Đồng bộ hóa trạng thái thành công cho 58 issues
- **Rủi ro & Hạn chế quan sát được:** Token truy cập GitHub có thể bị hết hạn hoặc thiếu quyền ghi đối với kho mã nguồn.

