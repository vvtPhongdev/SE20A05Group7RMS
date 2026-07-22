# Chạy tự động API test bằng Newman

Runner sử dụng collection `RMS_Group5_65TC.postman_collection.json` và environment
`RMS_Local.postman_environment.json`. Mặc định runner chạy tuần tự các folder `00`, `01`, `02`,
`03` và `05`; folder `04` chứa kiểm thử giao diện thủ công nên không được đưa vào API gate.

## Chuẩn bị

Tại thư mục gốc dự án, khởi động database và các service RMS:

```powershell
npm run docker:up
npm run dev
```

Gateway phải trả về HTTP 200 tại `http://localhost:3001/api/v1/health`.

## Chạy

```powershell
npm run test:api:postman
```

Runner tự thực hiện các bước sau:

1. Đọc collection và environment trong `Test(SWT)/Postman`.
2. Kiểm tra Gateway và hai file fixture upload.
3. Chạy folder Setup để tạo tài khoản test, token và ID cần thiết.
4. Chạy các test API theo đúng thứ tự, một iteration, không chạy song song.
5. Trả exit code `1` nếu có request, script hoặc assertion thất bại.

Báo cáo được tạo tại:

- `Test(SWT)/Postman/reports/latest-summary.json`: thống kê đã loại bỏ token và mật khẩu.
- `Test(SWT)/Postman/reports/latest-junit.xml`: dùng cho CI hoặc test-reporting tool.

## Candidate/CV test

Các test cần hai Candidate đang active và đã có Candidate Profile. Truyền tài khoản qua biến môi
trường của process để không ghi mật khẩu vào Postman environment:

```powershell
$env:RMS_CANDIDATE_A_EMAIL='candidate-a@example.com'
$env:RMS_CANDIDATE_A_PASSWORD='Password123!'
$env:RMS_CANDIDATE_B_EMAIL='candidate-b@example.com'
$env:RMS_CANDIDATE_B_PASSWORD='Password123!'
npm run test:api:postman
```

Có thể ghi đè cấu hình khác bằng `RMS_API_BASE`, `RMS_GATEWAY_BASE`, `RMS_WEBAPP_BASE`,
`RMS_ADMIN_EMAIL` và `RMS_ADMIN_PASSWORD`.

## Tùy chọn

```powershell
# Hiện hướng dẫn CLI
npm run test:api:postman -- --help

# Bỏ health check khi Gateway được quản lý bởi tiến trình bên ngoài
npm run test:api:postman -- --skip-health-check

# Bao gồm cả folder FE manual (các request vẫn skip khi runManualUiCases=false)
npm run test:api:postman -- --include-manual
```

Collection có thay đổi dữ liệu, vì vậy chỉ chạy trên database local hoặc môi trường test/dev.
