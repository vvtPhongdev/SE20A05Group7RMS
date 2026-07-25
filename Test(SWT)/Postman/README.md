# RMS Group 5 - Postman test suite

Thư mục này chứa thiết kế Postman cho **đủ 65 test case** của `TestCases_RMS_Group5.xlsx`. File CSV cùng tên chỉ là trang tổng quan/phân công, nên chi tiết test case được lấy từ workbook gốc trong cùng thư mục.

## Artifact

- `RMS_Group5_65TC.postman_collection.json`: collection Postman v2.1, 65 request có mã TC và 11 request setup phụ trợ.
- `RMS_Local.postman_environment.json`: environment cho Gateway `localhost:3001` và webapp `localhost:3000`.
- `data/invalid.exe`: fixture âm cho CV-002.
- `../../cv-demo.pdf`: fixture PDF hợp lệ cho CV-001.

## Cách import và chạy trên Postman Desktop

1. Mở Postman Desktop, chọn **Import**.
2. Kéo cả hai file JSON collection và environment vào cửa sổ Import.
3. Chọn environment **RMS Local - Postman SWT**.
4. Nếu cần chạy các case Candidate, điền hai cặp `candidateAEmail/candidateAPassword` và `candidateBEmail/candidateBPassword`. Hai tài khoản phải đang active và đã có Candidate Profile.
5. Chạy folder `00 - Setup runner context` trước. Folder này đăng nhập Admin seed, tạo tài khoản HR/Department Head dùng một lần, tạo phòng ban và lưu token/ID vào environment.
6. Chạy lần lượt folder `01` đến `05`. Không chạy song song vì nhiều case dùng ID sinh ra từ case trước.

Admin seed mặc định của môi trường local:

- Email: `admin@demo.test`
- Password: `Password123!`

Không commit/export lại environment sau khi đã chứa access token, OTP hoặc mật khẩu thật.

## Phạm vi tự động hóa

- 51 case API/process được biểu diễn bằng request Postman; response tests kiểm tra status, dữ liệu và state transition.
- 12 case `FE-*` là checklist manual companion và mặc định skip (`runManualUiCases=false`), vì Postman không xác minh được tương tác/hiển thị trình duyệt. Khi chạy thủ công, đặt `manualUiVerified_<TC-ID>=true` sau khi đối chiếu UI.
- `DEF-001`, `DEF-002` mặc định skip vì codebase chưa có defect-management API/tích hợp issue tracker.
- `AUTH-014` cần tester dừng Identity service trước rồi đặt `identityOutageReady=true`.
- `AUTH-008` cần OTP hợp lệ của một tài khoản test dùng một lần; mặc định skip để không đổi mật khẩu Admin.
- `INT-005` cần `resultInterviewId` của interview SCHEDULED có thời điểm đã qua.
- `INT-006` cần `decisionRequestId` và `decisionCandidateProfileId` của luồng đã có kết quả PASS.

## Các ánh xạ đã chuẩn hóa theo API hiện tại

| Test case gốc | API hiện tại trong collection |
|---|---|
| Role `HR_MANAGER` | `HR_LEADER` |
| `POST .../:id/submit` | `PATCH .../:id/submit` |
| `/forward-to-boss` | assign HR, sau đó `/forward-to-admin` |
| `/approve`, `/reject` của request | `PATCH /recruitment-requests/:id/decision` |
| `/recruitment-requests/:id/logs` | `GET /recruitment-requests/:id`, đọc trường `logs` |
| `/recruitment-requests/:id/tracking` | `GET /recruitment-requests/:id` |
| `/recruitment-requests/:id/plan` | `/overall-plan` |
| `/plan-tasks/:id/status` | `/task-plan/:id/status` |
| `/candidates/upload-cv` | `/candidate/cvs` |
| `/candidates/search` | `/cv/search` |
| `/notifications/read-all` | `POST /notifications/mark-all-read` |
| `/notifications/unread-count` | đếm `isRead=false` từ `GET /notifications` |

Expected result gốc vẫn được giữ trong description và assertions. Vì vậy các sai lệch hiện hữu như route `available-slots` còn thiếu, CV search trả validation 400, hoặc request chưa ACTIVE ngay sau approve plan sẽ hiện thành **Fail** đúng nghĩa kiểm thử.

## Lưu ý dữ liệu

Collection tạo dữ liệu có marker `runId` và tạo các tài khoản HR/Department Head dùng cho lần chạy. Đây là test suite có mutation; nên chạy trên database local/dev, không chạy trên production.
