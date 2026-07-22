# Ma trận tổng hợp test case và phân công thực hiện - RMS

> Cơ sở dữ liệu: `SWP391_G7_Test_Plan.docx`, `TestCases_RMS_Group5.xlsx` và đối chiếu knowledge graph/code hiện tại của dự án. Trạng thái Pass/Fail/Not Run được chép từ workbook tại ngày 18/07/2026; tài liệu này không tuyên bố đã chạy lại test.

## 1. Kết luận nhanh

- Tổng số test case: **65**.
- Phân công: Nam 14, Lý 14, Phong 13, Dũng 12, Hiếu 12.
- Testing approach: Black Box 54 (83.1%), White Box 6 (9.2%), kết hợp 5 (7.7%).
- Trạng thái ghi trong Excel: Pass 11, Fail 1, Not Run 53; mức thực thi 12/65 (18.5%), pass trên số đã thực thi 11/12 (91.7%).
- Ưu tiên: Cao 28, Trung bình 33, Thấp 4.
- Phân bổ theo tuần: Tuần 2 = 6, Tuần 3 = 14, Tuần 4 = 19, Tuần 5 = 19, Tuần 6 = 7.

## 2. Thành viên, trách nhiệm và khối lượng

| Thành viên | MSSV | Vai trò | Module phụ trách | Số TC |
|---|---|---|---|---:|
| Hoàng Hoài Nam | DE190287 | Team Leader | Recruitment Request & Plan | 14 |
| Huỳnh Đăng Lý | DE190075 | QA Lead | Gateway & Auth (Identity) | 14 |
| Võ Văn Thành Phong | DE190421 | Tester | Interview & Candidate/CV | 13 |
| Ngô Tuấn Dũng | DE190244 | Tester | Frontend (React SPA) | 12 |
| Nguyễn Duy Hiếu | DE190561 | Tester | Notification & Reports; defect management | 12 |

## 3. Cơ cấu loại test và công cụ

### 3.1. Test level trong workbook

| Test level | Số lượng |
|---|---:|
| Functional | 32 |
| UI | 11 |
| Negative | 6 |
| Integration | 5 |
| Security | 4 |
| System | 3 |
| Process | 2 |
| Boundary | 1 |
| Compatibility | 1 |

### 3.2. Toolchain tổng hợp

| Công cụ | Vai trò trong kế hoạch | Tình trạng/điểm dùng trong dự án |
|---|---|---|
| Postman / Insomnia | Black-box API, system và integration | Dùng cho phần lớn RRP/AUTH/INT/CV/NOTI/REP; chưa thấy Postman collection được lưu trong repo. |
| Jest + ts-jest | Unit, branch/validation và microservice integration | Đã cấu hình tại gateway, identity, recruiting, interview, notification, worker và packages/ai. |
| Playwright | UI automation/smoke theo Test Plan | Chưa có script Playwright trực tiếp; repo hiện có Puppeteer role smoke. |
| Puppeteer | Automation hiện hữu trong code | `npm run test:ui:roles` kiểm tra role home ở desktop/mobile trên Chrome. |
| Node E2E role flow | Automation hiện hữu trong code | `npm run test:e2e:roles` gọi API thật qua `fetch` cho luồng nhiều role. |
| Docker Compose | PostgreSQL/Redis và microservices | Dùng dựng môi trường, dừng service để test timeout, quan sát worker/queue. |
| Prisma Studio | Kiểm tra dữ liệu và trạng thái | Dùng đối chiếu request/plan/audit/CV/notification/report trong PostgreSQL. |
| GitHub Issues / Projects | Defect lifecycle | Dùng cho DEF-001/DEF-002 và liên kết bug ID khi test fail. |
| Chrome / Edge / Firefox | Compatibility/usability | FE-007 cần chạy thủ công hoặc bổ sung browser matrix bằng Playwright. |

## 4. Các điểm phải chuẩn hóa với code hiện tại

Các test case gốc vẫn được giữ nguyên ở phần ma trận. Bảng dưới là lớp đối chiếu để tránh chạy sai route/role hoặc kết luận sai trạng thái.

| Test case bị ảnh hưởng | Nội dung trong kế hoạch/Excel | Code hiện tại | Bằng chứng |
|---|---|---|---|
| Toàn bộ case dùng HR_MANAGER | Role HR_MANAGER | Enum hiện tại dùng HR_LEADER; chuẩn hóa tài khoản, token và expected RBAC trước khi chạy. | `packages/contracts/src/enums/index.ts:10` |
| RRP-003 | POST /recruitment-requests/:id/submit | PATCH /recruitment-requests/:id/submit. | `services/gateway/src/controllers/recruiting.controller.ts:563` |
| RRP-004 đến RRP-006 | forward-to-boss; approve/reject là các route riêng | PATCH .../forward-to-admin và PATCH .../decision; payload quyết định phải bám DTO hiện tại. | `services/gateway/src/controllers/recruiting.controller.ts:632,644` |
| RRP-008, RRP-009 | GET .../:id/logs và GET .../:id/tracking | GET /audit-logs?entityType=&entityId= và GET /reports/realtime-tracking. | `services/gateway/src/controllers/recruiting.controller.ts:1335,1351` |
| RRP-010 đến RRP-014 | Plan nằm dưới /recruitment-requests/:id/plan; task nằm dưới plan/tasks | Dùng /overall-plan và /task-plan; submit/approve/reject/status chủ yếu là PATCH. | `services/gateway/src/controllers/recruiting.controller.ts:665-770` |
| AUTH-010 | GET /auth/me | GET /me. | `services/gateway/src/controllers/identity.controller.ts:903` |
| INT-001 đến INT-005 | Các route trực tiếp dưới /interviews và dùng POST cho reschedule/cancel | Dùng /interviews/schedules; reschedule/cancel là PATCH; result là POST /interviews/:id/results (có legacy path). | `services/gateway/src/controllers/interview.controller.ts:18-289` |
| INT-002 | GET /interviews/available-slots | Không thấy route available-slots trong gateway hiện tại; cần đổi case sang kiểm tra xung đột lịch hoặc bổ sung endpoint. | `services/gateway/src/controllers/interview.controller.ts` |
| INT-006 | POST /interviews/:id/hiring-decision | POST /hiring-decisions/:requestId. | `services/gateway/src/controllers/recruiting.controller.ts:788` |
| CV-001 đến CV-003 | POST /candidates/upload-cv; file <5 MB; parse qua worker | POST /candidate/cvs; giới hạn gateway 10 MB; có fast text parse trước khi gửi CV service, worker tiếp tục xử lý nền. | `services/gateway/src/controllers/cv.controller.ts:40,126-182` |
| CV-004 | POST /candidates/search | POST /talent/search (knowledge graph + vector); ngoài ra còn POST /cv/search. | `services/gateway/src/controllers/recruiting.controller.ts:1021; profiles.controller.ts:355` |
| CV-005 đến CV-007 | /candidates/:id/profile và /candidates/:id/cv | Profile cá nhân dùng /candidate-profiles/me; CV nhân sự xem qua /candidate/cvs/candidate/:candidateId/latest[/file]. | `services/gateway/src/controllers/profiles.controller.ts:205; cv.controller.ts:67` |
| NOTI-003, NOTI-004 | PATCH /notifications/read-all; GET /notifications/unread-count | POST /notifications/mark-all-read; chưa có unread-count. Kết quả Fail của NOTI-004 phù hợp với code hiện tại. | `services/gateway/src/controllers/notifications.controller.ts:52` |
| FE-001 đến FE-012 | Playwright cho UI automation | Repo có npm run test:ui:roles dùng Puppeteer và npm run test:e2e:roles dùng Node fetch; chưa có script Playwright trực tiếp. | `package.json:19-20; scripts/ui-role-smoke.mjs` |
| Toàn bộ lifecycle | 13 trạng thái recruitment request | Enum hiện tại có 23 giá trị (gồm trạng thái legacy và các bước offer/closed/cancelled); state-transition suite cần cập nhật RTM. | `packages/contracts/src/enums/index.ts:24` |

## 5. Ma trận tổng hợp 65 test case và người thực hiện

### Hoàng Hoài Nam (DE190287) - Recruitment Request & Plan

| ID | Tuần | Module | Level | Tiêu đề | Ưu tiên | Approach | Công cụ chính | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| RRP-001 | Tuan 2 | Recruitment Requests | Functional | Tao yeu cau tuyen dung hop le | Cao | Black Box Testing | Postman / Insomnia; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| RRP-002 | Tuan 2 | Recruitment Requests | Boundary | Tao yeu cau thieu truong bat buoc | Cao | Black Box Testing | Postman / Insomnia; Prisma Studio | Not Run |
| RRP-003 | Tuan 2 | Recruitment Requests | System | Submit request chuyen DRAFT->PENDING_HR_REVIEW | Cao | Black Box Testing | Postman / Insomnia; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| RRP-004 | Tuan 3 | Recruitment Requests | System | Forward request len Boss | Cao | Black Box Testing | Postman / Insomnia; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| RRP-005 | Tuan 3 | Recruitment Requests | System | Admin approve request | Cao | Black Box Testing | Postman / Insomnia; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| RRP-006 | Tuan 3 | Recruitment Requests | Negative | Admin reject request kem ly do | TB | Black Box Testing | Postman / Insomnia; Prisma Studio | Not Run |
| RRP-007 | Tuan 4 | Recruitment Requests | Security | Role khac khong duoc submit request | Cao | Black Box Testing | Postman / Insomnia; Jest; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| RRP-008 | Tuan 4 | Recruitment Requests | Integration | Xem audit trail cua request | TB | Black Box + White Box Testing | Postman / Insomnia; Jest; Prisma Studio | Not Run |
| RRP-009 | Tuan 4 | Recruitment Requests | Integration | Xem tracking dashboard | TB | Black Box Testing | Postman / Insomnia; Jest; Prisma Studio | Not Run |
| RRP-010 | Tuan 4 | Recruitment Plans | Functional | HR tao Overall Plan | Cao | Black Box Testing | Postman / Insomnia; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| RRP-011 | Tuan 5 | Recruitment Plans | Functional | Submit plan cho Admin duyet | Cao | Black Box Testing | Postman / Insomnia; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| RRP-012 | Tuan 5 | Recruitment Plans | Functional | Admin approve plan | Cao | Black Box Testing | Postman / Insomnia; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| RRP-013 | Tuan 5 | Recruitment Plans | Negative | Admin yeu cau chinh sua plan | TB | Black Box Testing | Postman / Insomnia; Prisma Studio | Not Run |
| RRP-014 | Tuan 5 | Task Plans | Functional | Them va cap nhat task trong plan | TB | Black Box Testing | Postman / Insomnia; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |

### Huỳnh Đăng Lý (DE190075) - Gateway & Auth (Identity)

| ID | Tuần | Module | Level | Tiêu đề | Ưu tiên | Approach | Công cụ chính | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| AUTH-001 | Tuan 2 | Auth | Functional | Dang ky tai khoan moi | Cao | Black Box Testing | Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| AUTH-002 | Tuan 2 | Auth | Negative | Dang ky voi email da ton tai | Cao | Black Box Testing | Postman / Insomnia | Not Run |
| AUTH-003 | Tuan 2 | Auth | Functional | Dang nhap voi thong tin hop le | Cao | Black Box Testing | Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| AUTH-004 | Tuan 3 | Auth | Negative | Dang nhap sai mat khau | Cao | Black Box Testing | Postman / Insomnia | Not Run |
| AUTH-005 | Tuan 3 | Auth | Functional | Refresh token xoay vong | Cao | White Box Testing | Postman / Insomnia; Jest; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| AUTH-006 | Tuan 3 | Auth | Functional | Dang xuat vo hieu hoa refresh token | TB | White Box Testing | Postman / Insomnia; Jest; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| AUTH-007 | Tuan 4 | Auth | Functional | Quen mat khau gui OTP | TB | Black Box Testing | Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| AUTH-008 | Tuan 4 | Auth | Functional | Dat lai mat khau voi OTP hop le | Cao | Black Box Testing | Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| AUTH-009 | Tuan 4 | Auth | Negative | Dat lai mat khau voi OTP het han/sai | TB | Black Box Testing | Postman / Insomnia | Not Run |
| AUTH-010 | Tuan 4 | Auth | Functional | Lay thong tin profile hien tai | TB | Black Box Testing | Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| AUTH-011 | Tuan 5 | Users | Functional | Admin xem danh sach user | TB | Black Box Testing | Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| AUTH-012 | Tuan 5 | Users | Security | Cap nhat role user (RBAC) | Cao | Black Box + White Box Testing | Postman / Insomnia; Jest; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| AUTH-013 | Tuan 5 | Gateway | Functional | Health check gateway | Thap | Black Box Testing | Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| AUTH-014 | Tuan 5 | Gateway | Integration | Gateway xu ly loi khi TCP microservice timeout | Cao | White Box Testing | Postman / Insomnia; Jest; Docker Compose / service-worker logs | Not Run |

### Võ Văn Thành Phong (DE190421) - Interview & Candidate/CV

| ID | Tuần | Module | Level | Tiêu đề | Ưu tiên | Approach | Công cụ chính | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| INT-001 | Tuan 3 | Interviews | Functional | Len lich phong van | Cao | Black Box Testing | Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| INT-002 | Tuan 3 | Interviews | Functional | Lay danh sach khung gio trong | TB | Black Box Testing | Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| INT-003 | Tuan 4 | Interviews | Functional | Doi lich phong van | TB | Black Box Testing | Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| INT-004 | Tuan 4 | Interviews | Functional | Huy phong van | TB | Black Box Testing | Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| INT-005 | Tuan 4 | Interviews | Functional | Ghi nhan ket qua phong van | Cao | Black Box Testing | Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| INT-006 | Tuan 5 | Interviews | Functional | Admin dua ra quyet dinh tuyen dung cuoi cung | Cao | Black Box Testing | Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| CV-001 | Tuan 3 | CV Documents | Functional | Upload CV dinh dang PDF hop le | Cao | Black Box Testing | Postman / Insomnia; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| CV-002 | Tuan 3 | CV Documents | Negative | Upload file khong dung dinh dang | TB | Black Box Testing | Postman / Insomnia; Prisma Studio | Not Run |
| CV-003 | Tuan 4 | CV Documents | Integration | Kiem tra trich xuat text tu CV | Cao | White Box Testing | Postman / Insomnia; Jest; Prisma Studio; Docker Compose / service-worker logs | Not Run |
| CV-004 | Tuan 4 | CV Embeddings | Functional | Tim kiem ung vien theo vector search | Cao | White Box Testing | Postman / Insomnia; Jest; Prisma Studio; Docker Compose / service-worker logs; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| CV-005 | Tuan 5 | Candidate Profiles | Functional | Cap nhat ho so ung vien | TB | Black Box Testing | Postman / Insomnia; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| CV-006 | Tuan 5 | Candidate Profiles | Functional | HR xem CV cua ung vien | TB | Black Box Testing | Postman / Insomnia; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |
| CV-007 | Tuan 5 | Candidate Profiles | Security | Candidate khac khong duoc xem CV nguoi khac | Cao | Black Box + White Box Testing | Postman / Insomnia; Jest; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ | Not Run |

### Ngô Tuấn Dũng (DE190244) - Frontend (React SPA)

| ID | Tuần | Module | Level | Tiêu đề | Ưu tiên | Approach | Công cụ chính | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| FE-001 | Tuan 3 | Login Screen | UI | Kiem tra validate form dang nhap | TB | Black Box Testing | Puppeteer smoke (`npm run test:ui:roles`); Playwright theo Test Plan | Not Run |
| FE-002 | Tuan 3 | Dashboard | UI | Dashboard hien thi dung theo role | Cao | Black Box Testing | Puppeteer smoke (`npm run test:ui:roles`); Playwright theo Test Plan | Not Run |
| FE-003 | Tuan 4 | Request List/Detail | UI | Dieu huong danh sach - chi tiet request | TB | Black Box Testing | Puppeteer smoke (`npm run test:ui:roles`); Playwright theo Test Plan | Not Run |
| FE-004 | Tuan 4 | Plan Editor | UI | Validate form tao/sua plan | TB | Black Box Testing | Puppeteer smoke (`npm run test:ui:roles`); Playwright theo Test Plan | Not Run |
| FE-005 | Tuan 4 | Interview Scheduler | UI | Giao dien len lich phong van | TB | Black Box Testing | Puppeteer smoke (`npm run test:ui:roles`); Playwright theo Test Plan | Not Run |
| FE-006 | Tuan 5 | Candidate Search | UI | Giao dien tim kiem ung vien | TB | Black Box Testing | Puppeteer smoke (`npm run test:ui:roles`); Playwright theo Test Plan | Not Run |
| FE-007 | Tuan 5 | Toan he thong | Compatibility | Kiem tra giao dien tren nhieu trinh duyet | Thap | Black Box Testing | Chrome/Edge/Firefox thủ công; Playwright theo Test Plan | Not Run |
| FE-008 | Tuan 5 | Notifications | UI | Chuong thong bao va so luong chua doc | TB | Black Box Testing | Puppeteer smoke (`npm run test:ui:roles`); Playwright theo Test Plan | Not Run |
| FE-009 | Tuan 5 | Sidebar/Nav | UI | Sidebar hien thi dung menu theo role | Cao | Black Box + White Box Testing | Puppeteer smoke (`npm run test:ui:roles`); Playwright theo Test Plan | Not Run |
| FE-010 | Tuan 6 | Session | UI | Tu dong chuyen ve login khi het phien | TB | Black Box Testing | Puppeteer smoke (`npm run test:ui:roles`); Playwright theo Test Plan | Not Run |
| FE-011 | Tuan 6 | Error Handling | UI | Hien thi thong bao loi khi API that bai | TB | Black Box Testing | Puppeteer smoke (`npm run test:ui:roles`); Playwright theo Test Plan | Not Run |
| FE-012 | Tuan 6 | Loading States | UI | Hien loading khi cho du lieu | Thap | Black Box Testing | Puppeteer smoke (`npm run test:ui:roles`); Playwright theo Test Plan | Not Run |

### Nguyễn Duy Hiếu (DE190561) - Notification & Reports; defect management

| ID | Tuần | Module | Level | Tiêu đề | Ưu tiên | Approach | Công cụ chính | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| NOTI-001 | Tuan 3 | Notifications | Functional | Xem danh sach thong bao cua user | TB | Black Box Testing | Postman / Insomnia; Prisma Studio | Pass |
| NOTI-002 | Tuan 3 | Notifications | Functional | Danh dau 1 thong bao da doc | TB | Black Box Testing | Postman / Insomnia; Prisma Studio | Pass |
| NOTI-003 | Tuan 4 | Notifications | Functional | Danh dau tat ca da doc | TB | Black Box Testing | Postman / Insomnia; Prisma Studio | Pass |
| NOTI-004 | Tuan 4 | Notifications | Functional | Lay so luong thong bao chua doc | Thap | Black Box Testing | Postman / Insomnia; Prisma Studio | Fail |
| NOTI-005 | Tuan 4 | Email | Integration | Gui email khi co loi moi phong van | Cao | White Box Testing | Postman / Insomnia; Jest; Docker Compose / service-worker logs | Pass |
| REP-001 | Tuan 5 | Reports | Functional | Xem bao cao tuyen dung hang nam | TB | Black Box Testing | Postman / Insomnia; Prisma Studio | Pass |
| REP-002 | Tuan 5 | Reports | Functional | Xem bao cao theo phong ban | TB | Black Box Testing | Postman / Insomnia; Prisma Studio | Pass |
| REP-003 | Tuan 5 | Reports | Functional | Xem chi so time-to-hire | TB | Black Box Testing | Postman / Insomnia; Prisma Studio | Pass |
| REP-004 | Tuan 6 | Reports | Functional | Xem pipeline tong quan | TB | Black Box Testing | Postman / Insomnia; Prisma Studio | Pass |
| REP-005 | Tuan 6 | Reports | Security | Chan truy cap bao cao voi role khong hop le | Cao | Black Box + White Box Testing | Postman / Insomnia; Jest; Prisma Studio | Pass |
| DEF-001 | Tuan 6 | Defect Mgmt | Process | Kiem tra quy trinh ghi nhan defect | TB | Black Box Testing | GitHub Issues / Projects; công cụ của test case gốc khi retest | Pass |
| DEF-002 | Tuan 6 | Defect Mgmt | Process | Retest defect da fix truoc khi dong | TB | Black Box Testing | GitHub Issues / Projects; công cụ của test case gốc khi retest | Pass |

## 6. Chi tiết đầy đủ từng test case

Phần này giữ lại tiền điều kiện, bước thực hiện, dữ liệu và kết quả mong đợi để tài liệu Markdown có thể dùng độc lập với Excel. Các mật khẩu/tài khoản test không được sao chép; sử dụng trực tiếp các sheet `Test Data - <Tên>` khi thực thi.

### Hoàng Hoài Nam - Recruitment Request & Plan

#### RRP-001 - Tao yeu cau tuyen dung hop le

- **Người thực hiện:** Hoàng Hoài Nam (DE190287)
- **Tuần / module / level:** Tuan 2 / Recruitment Requests / Functional
- **Ưu tiên / approach:** Cao / Black Box Testing
- **Tiền điều kiện:** Dang nhap voi role DEPARTMENT_HEAD
- **Bước thực hiện:** 1. POST /recruitment-requests voi du lieu hop le
- **Dữ liệu kiểm thử:** title, headcount, department hop le
- **Kết quả mong đợi:** Request duoc tao trang thai DRAFT
- **Công cụ:** Postman / Insomnia; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### RRP-002 - Tao yeu cau thieu truong bat buoc

- **Người thực hiện:** Hoàng Hoài Nam (DE190287)
- **Tuần / module / level:** Tuan 2 / Recruitment Requests / Boundary
- **Ưu tiên / approach:** Cao / Black Box Testing
- **Tiền điều kiện:** Dang nhap DEPARTMENT_HEAD
- **Bước thực hiện:** 1. POST /recruitment-requests thieu 'title'
- **Dữ liệu kiểm thử:** title=null
- **Kết quả mong đợi:** Tra ve 400, thong bao loi validation
- **Công cụ:** Postman / Insomnia; Prisma Studio
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### RRP-003 - Submit request chuyen DRAFT->PENDING_HR_REVIEW

- **Người thực hiện:** Hoàng Hoài Nam (DE190287)
- **Tuần / module / level:** Tuan 2 / Recruitment Requests / System
- **Ưu tiên / approach:** Cao / Black Box Testing
- **Tiền điều kiện:** Request o trang thai DRAFT
- **Bước thực hiện:** 1. POST /recruitment-requests/:id/submit
- **Dữ liệu kiểm thử:** request DRAFT hop le
- **Kết quả mong đợi:** Trang thai chuyen sang PENDING_HR_REVIEW
- **Công cụ:** Postman / Insomnia; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### RRP-004 - Forward request len Boss

- **Người thực hiện:** Hoàng Hoài Nam (DE190287)
- **Tuần / module / level:** Tuan 3 / Recruitment Requests / System
- **Ưu tiên / approach:** Cao / Black Box Testing
- **Tiền điều kiện:** Request o PENDING_HR_REVIEW, role HR_MANAGER
- **Bước thực hiện:** 1. POST /recruitment-requests/:id/forward-to-boss
- **Dữ liệu kiểm thử:** request PENDING_HR_REVIEW
- **Kết quả mong đợi:** Trang thai chuyen sang PENDING_BOSS_APPROVAL
- **Công cụ:** Postman / Insomnia; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### RRP-005 - Admin approve request

- **Người thực hiện:** Hoàng Hoài Nam (DE190287)
- **Tuần / module / level:** Tuan 3 / Recruitment Requests / System
- **Ưu tiên / approach:** Cao / Black Box Testing
- **Tiền điều kiện:** Request PENDING_BOSS_APPROVAL, role ADMIN
- **Bước thực hiện:** 1. POST /recruitment-requests/:id/approve
- **Dữ liệu kiểm thử:** request PENDING_BOSS_APPROVAL
- **Kết quả mong đợi:** Trang thai chuyen sang APPROVED
- **Công cụ:** Postman / Insomnia; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### RRP-006 - Admin reject request kem ly do

- **Người thực hiện:** Hoàng Hoài Nam (DE190287)
- **Tuần / module / level:** Tuan 3 / Recruitment Requests / Negative
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Request PENDING_BOSS_APPROVAL
- **Bước thực hiện:** 1. POST /recruitment-requests/:id/reject voi reason
- **Dữ liệu kiểm thử:** reason bat buoc
- **Kết quả mong đợi:** Request bi reject, luu reason, log audit
- **Công cụ:** Postman / Insomnia; Prisma Studio
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### RRP-007 - Role khac khong duoc submit request

- **Người thực hiện:** Hoàng Hoài Nam (DE190287)
- **Tuần / module / level:** Tuan 4 / Recruitment Requests / Security
- **Ưu tiên / approach:** Cao / Black Box Testing
- **Tiền điều kiện:** Dang nhap role CANDIDATE
- **Bước thực hiện:** 1. POST /recruitment-requests/:id/submit
- **Dữ liệu kiểm thử:** token CANDIDATE
- **Kết quả mong đợi:** Tra ve 403 Forbidden
- **Công cụ:** Postman / Insomnia; Jest; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### RRP-008 - Xem audit trail cua request

- **Người thực hiện:** Hoàng Hoài Nam (DE190287)
- **Tuần / module / level:** Tuan 4 / Recruitment Requests / Integration
- **Ưu tiên / approach:** TB / Black Box + White Box Testing
- **Tiền điều kiện:** Request da qua nhieu buoc chuyen trang thai
- **Bước thực hiện:** 1. GET /recruitment-requests/:id/logs
- **Dữ liệu kiểm thử:** request co lich su thay doi
- **Kết quả mong đợi:** Tra ve day du log theo thu tu thoi gian
- **Công cụ:** Postman / Insomnia; Jest; Prisma Studio
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### RRP-009 - Xem tracking dashboard

- **Người thực hiện:** Hoàng Hoài Nam (DE190287)
- **Tuần / module / level:** Tuan 4 / Recruitment Requests / Integration
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Role DEPARTMENT_HEAD, co request dang xu ly
- **Bước thực hiện:** 1. GET /recruitment-requests/:id/tracking
- **Dữ liệu kiểm thử:** request active
- **Kết quả mong đợi:** Tra ve du lieu tien do dung thuc te
- **Công cụ:** Postman / Insomnia; Jest; Prisma Studio
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### RRP-010 - HR tao Overall Plan

- **Người thực hiện:** Hoàng Hoài Nam (DE190287)
- **Tuần / module / level:** Tuan 4 / Recruitment Plans / Functional
- **Ưu tiên / approach:** Cao / Black Box Testing
- **Tiền điều kiện:** Request o trang thai APPROVED, role HR_MANAGER
- **Bước thực hiện:** 1. POST /recruitment-requests/:id/plan
- **Dữ liệu kiểm thử:** plan data hop le
- **Kết quả mong đợi:** Plan duoc tao, request chuyen PLANNING
- **Công cụ:** Postman / Insomnia; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### RRP-011 - Submit plan cho Admin duyet

- **Người thực hiện:** Hoàng Hoài Nam (DE190287)
- **Tuần / module / level:** Tuan 5 / Recruitment Plans / Functional
- **Ưu tiên / approach:** Cao / Black Box Testing
- **Tiền điều kiện:** Plan o trang thai draft
- **Bước thực hiện:** 1. POST /recruitment-requests/:id/plan/submit
- **Dữ liệu kiểm thử:** plan hop le
- **Kết quả mong đợi:** Trang thai plan chuyen PLAN_PENDING_APPROVAL
- **Công cụ:** Postman / Insomnia; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### RRP-012 - Admin approve plan

- **Người thực hiện:** Hoàng Hoài Nam (DE190287)
- **Tuần / module / level:** Tuan 5 / Recruitment Plans / Functional
- **Ưu tiên / approach:** Cao / Black Box Testing
- **Tiền điều kiện:** Plan PLAN_PENDING_APPROVAL, role ADMIN
- **Bước thực hiện:** 1. POST /recruitment-requests/:id/plan/approve
- **Dữ liệu kiểm thử:** plan hop le
- **Kết quả mong đợi:** Request chuyen sang ACTIVE
- **Công cụ:** Postman / Insomnia; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### RRP-013 - Admin yeu cau chinh sua plan

- **Người thực hiện:** Hoàng Hoài Nam (DE190287)
- **Tuần / module / level:** Tuan 5 / Recruitment Plans / Negative
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Plan PLAN_PENDING_APPROVAL
- **Bước thực hiện:** 1. POST /recruitment-requests/:id/plan/request-revision voi notes
- **Dữ liệu kiểm thử:** notes bat buoc
- **Kết quả mong đợi:** Plan quay lai trang thai chinh sua, luu notes
- **Công cụ:** Postman / Insomnia; Prisma Studio
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### RRP-014 - Them va cap nhat task trong plan

- **Người thực hiện:** Hoàng Hoài Nam (DE190287)
- **Tuần / module / level:** Tuan 5 / Task Plans / Functional
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Plan da duoc tao
- **Bước thực hiện:** 1. POST .../plan/tasks 2. PATCH /plan-tasks/:id/status
- **Dữ liệu kiểm thử:** task data hop le
- **Kết quả mong đợi:** Task duoc tao/cap nhat dung trang thai
- **Công cụ:** Postman / Insomnia; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

### Huỳnh Đăng Lý - Gateway & Auth (Identity)

#### AUTH-001 - Dang ky tai khoan moi

- **Người thực hiện:** Huỳnh Đăng Lý (DE190075)
- **Tuần / module / level:** Tuan 2 / Auth / Functional
- **Ưu tiên / approach:** Cao / Black Box Testing
- **Tiền điều kiện:** He thong san sang
- **Bước thực hiện:** 1. POST /auth/register voi email/password hop le
- **Dữ liệu kiểm thử:** email chua ton tai
- **Kết quả mong đợi:** Tai khoan duoc tao, tra ve 201
- **Công cụ:** Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### AUTH-002 - Dang ky voi email da ton tai

- **Người thực hiện:** Huỳnh Đăng Lý (DE190075)
- **Tuần / module / level:** Tuan 2 / Auth / Negative
- **Ưu tiên / approach:** Cao / Black Box Testing
- **Tiền điều kiện:** Email da duoc dang ky truoc do
- **Bước thực hiện:** 1. POST /auth/register voi email trung
- **Dữ liệu kiểm thử:** email da ton tai
- **Kết quả mong đợi:** Tra ve 409 Conflict
- **Công cụ:** Postman / Insomnia
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### AUTH-003 - Dang nhap voi thong tin hop le

- **Người thực hiện:** Huỳnh Đăng Lý (DE190075)
- **Tuần / module / level:** Tuan 2 / Auth / Functional
- **Ưu tiên / approach:** Cao / Black Box Testing
- **Tiền điều kiện:** Tai khoan da ton tai va active
- **Bước thực hiện:** 1. POST /auth/login
- **Dữ liệu kiểm thử:** email/password dung
- **Kết quả mong đợi:** Tra ve JWT access + refresh token
- **Công cụ:** Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### AUTH-004 - Dang nhap sai mat khau

- **Người thực hiện:** Huỳnh Đăng Lý (DE190075)
- **Tuần / module / level:** Tuan 3 / Auth / Negative
- **Ưu tiên / approach:** Cao / Black Box Testing
- **Tiền điều kiện:** Tai khoan ton tai
- **Bước thực hiện:** 1. POST /auth/login voi password sai
- **Dữ liệu kiểm thử:** password sai
- **Kết quả mong đợi:** Tra ve 401 Unauthorized
- **Công cụ:** Postman / Insomnia
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### AUTH-005 - Refresh token xoay vong

- **Người thực hiện:** Huỳnh Đăng Lý (DE190075)
- **Tuần / module / level:** Tuan 3 / Auth / Functional
- **Ưu tiên / approach:** Cao / White Box Testing
- **Tiền điều kiện:** Da dang nhap, co refresh token hop le
- **Bước thực hiện:** 1. POST /auth/refresh
- **Dữ liệu kiểm thử:** refresh token hop le
- **Kết quả mong đợi:** Tra ve access token moi, refresh token cu bi thu hoi
- **Công cụ:** Postman / Insomnia; Jest; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### AUTH-006 - Dang xuat vo hieu hoa refresh token

- **Người thực hiện:** Huỳnh Đăng Lý (DE190075)
- **Tuần / module / level:** Tuan 3 / Auth / Functional
- **Ưu tiên / approach:** TB / White Box Testing
- **Tiền điều kiện:** Da dang nhap
- **Bước thực hiện:** 1. POST /auth/logout
- **Dữ liệu kiểm thử:** access token hop le
- **Kết quả mong đợi:** Refresh token bi invalidate, khong the refresh lai
- **Công cụ:** Postman / Insomnia; Jest; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### AUTH-007 - Quen mat khau gui OTP

- **Người thực hiện:** Huỳnh Đăng Lý (DE190075)
- **Tuần / module / level:** Tuan 4 / Auth / Functional
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Email da dang ky
- **Bước thực hiện:** 1. POST /auth/forgot-password
- **Dữ liệu kiểm thử:** email hop le
- **Kết quả mong đợi:** OTP duoc gui qua email/notification
- **Công cụ:** Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### AUTH-008 - Dat lai mat khau voi OTP hop le

- **Người thực hiện:** Huỳnh Đăng Lý (DE190075)
- **Tuần / module / level:** Tuan 4 / Auth / Functional
- **Ưu tiên / approach:** Cao / Black Box Testing
- **Tiền điều kiện:** Da nhan OTP
- **Bước thực hiện:** 1. POST /auth/reset-password
- **Dữ liệu kiểm thử:** OTP + mat khau moi hop le
- **Kết quả mong đợi:** Mat khau duoc cap nhat, dang nhap thanh cong
- **Công cụ:** Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### AUTH-009 - Dat lai mat khau voi OTP het han/sai

- **Người thực hiện:** Huỳnh Đăng Lý (DE190075)
- **Tuần / module / level:** Tuan 4 / Auth / Negative
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** OTP da het han
- **Bước thực hiện:** 1. POST /auth/reset-password voi OTP sai
- **Dữ liệu kiểm thử:** OTP sai/het han
- **Kết quả mong đợi:** Tra ve 400, mat khau khong doi
- **Công cụ:** Postman / Insomnia
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### AUTH-010 - Lay thong tin profile hien tai

- **Người thực hiện:** Huỳnh Đăng Lý (DE190075)
- **Tuần / module / level:** Tuan 4 / Auth / Functional
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Da dang nhap
- **Bước thực hiện:** 1. GET /auth/me
- **Dữ liệu kiểm thử:** access token hop le
- **Kết quả mong đợi:** Tra ve dung thong tin user dang dang nhap
- **Công cụ:** Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### AUTH-011 - Admin xem danh sach user

- **Người thực hiện:** Huỳnh Đăng Lý (DE190075)
- **Tuần / module / level:** Tuan 5 / Users / Functional
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Role ADMIN
- **Bước thực hiện:** 1. GET /users
- **Dữ liệu kiểm thử:** token ADMIN
- **Kết quả mong đợi:** Tra ve danh sach user phan trang
- **Công cụ:** Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### AUTH-012 - Cap nhat role user (RBAC)

- **Người thực hiện:** Huỳnh Đăng Lý (DE190075)
- **Tuần / module / level:** Tuan 5 / Users / Security
- **Ưu tiên / approach:** Cao / Black Box + White Box Testing
- **Tiền điều kiện:** Role ADMIN
- **Bước thực hiện:** 1. PATCH /users/:id/role
- **Dữ liệu kiểm thử:** role moi hop le
- **Kết quả mong đợi:** Role duoc cap nhat, user khac khong the goi API nay
- **Công cụ:** Postman / Insomnia; Jest; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### AUTH-013 - Health check gateway

- **Người thực hiện:** Huỳnh Đăng Lý (DE190075)
- **Tuần / module / level:** Tuan 5 / Gateway / Functional
- **Ưu tiên / approach:** Thap / Black Box Testing
- **Tiền điều kiện:** Gateway dang chay
- **Bước thực hiện:** 1. GET /health
- **Dữ liệu kiểm thử:** khong can auth
- **Kết quả mong đợi:** Tra ve 200 va trang thai cac service
- **Công cụ:** Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### AUTH-014 - Gateway xu ly loi khi TCP microservice timeout

- **Người thực hiện:** Huỳnh Đăng Lý (DE190075)
- **Tuần / module / level:** Tuan 5 / Gateway / Integration
- **Ưu tiên / approach:** Cao / White Box Testing
- **Tiền điều kiện:** Microservice identity tam ngung
- **Bước thực hiện:** 1. Goi API qua gateway trong luc service down
- **Dữ liệu kiểm thử:** service khong phan hoi
- **Kết quả mong đợi:** Gateway tra ve loi 5xx co thong diep ro rang, khong crash
- **Công cụ:** Postman / Insomnia; Jest; Docker Compose / service-worker logs
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

### Võ Văn Thành Phong - Interview & Candidate/CV

#### INT-001 - Len lich phong van

- **Người thực hiện:** Võ Văn Thành Phong (DE190421)
- **Tuần / module / level:** Tuan 3 / Interviews / Functional
- **Ưu tiên / approach:** Cao / Black Box Testing
- **Tiền điều kiện:** Request da co plan ACTIVE, role HR_MANAGER
- **Bước thực hiện:** 1. POST /interviews voi slot hop le
- **Dữ liệu kiểm thử:** candidate, slot, panel hop le
- **Kết quả mong đợi:** Interview duoc tao, trang thai SCHEDULED
- **Công cụ:** Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### INT-002 - Lay danh sach khung gio trong

- **Người thực hiện:** Võ Văn Thành Phong (DE190421)
- **Tuần / module / level:** Tuan 3 / Interviews / Functional
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** HR_MANAGER dang len lich
- **Bước thực hiện:** 1. GET /interviews/available-slots
- **Dữ liệu kiểm thử:** khoang thoi gian hop le
- **Kết quả mong đợi:** Tra ve danh sach slot chua bi trung lich
- **Công cụ:** Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### INT-003 - Doi lich phong van

- **Người thực hiện:** Võ Văn Thành Phong (DE190421)
- **Tuần / module / level:** Tuan 4 / Interviews / Functional
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Interview da SCHEDULED
- **Bước thực hiện:** 1. POST /interviews/:id/reschedule
- **Dữ liệu kiểm thử:** slot moi hop le
- **Kết quả mong đợi:** Interview cap nhat slot moi, gui thong bao
- **Công cụ:** Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### INT-004 - Huy phong van

- **Người thực hiện:** Võ Văn Thành Phong (DE190421)
- **Tuần / module / level:** Tuan 4 / Interviews / Functional
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Interview da SCHEDULED
- **Bước thực hiện:** 1. POST /interviews/:id/cancel
- **Dữ liệu kiểm thử:** ly do huy
- **Kết quả mong đợi:** Interview chuyen trang thai CANCELLED
- **Công cụ:** Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### INT-005 - Ghi nhan ket qua phong van

- **Người thực hiện:** Võ Văn Thành Phong (DE190421)
- **Tuần / module / level:** Tuan 4 / Interviews / Functional
- **Ưu tiên / approach:** Cao / Black Box Testing
- **Tiền điều kiện:** Interview da hoan thanh
- **Bước thực hiện:** 1. POST /interviews/:id/result voi PASS/FAIL
- **Dữ liệu kiểm thử:** ket qua hop le
- **Kết quả mong đợi:** Ket qua duoc luu, request chuyen DECISION_PENDING
- **Công cụ:** Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### INT-006 - Admin dua ra quyet dinh tuyen dung cuoi cung

- **Người thực hiện:** Võ Văn Thành Phong (DE190421)
- **Tuần / module / level:** Tuan 5 / Interviews / Functional
- **Ưu tiên / approach:** Cao / Black Box Testing
- **Tiền điều kiện:** Interview co ket qua PASS, role ADMIN
- **Bước thực hiện:** 1. POST /interviews/:id/hiring-decision
- **Dữ liệu kiểm thử:** quyet dinh HIRED/NOT_HIRED
- **Kết quả mong đợi:** Request chuyen HIRED/NOT_HIRED -> COMPLETED
- **Công cụ:** Postman / Insomnia; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### CV-001 - Upload CV dinh dang PDF hop le

- **Người thực hiện:** Võ Văn Thành Phong (DE190421)
- **Tuần / module / level:** Tuan 3 / CV Documents / Functional
- **Ưu tiên / approach:** Cao / Black Box Testing
- **Tiền điều kiện:** Role CANDIDATE
- **Bước thực hiện:** 1. POST /candidates/upload-cv voi file PDF
- **Dữ liệu kiểm thử:** file PDF hop le, <5MB
- **Kết quả mong đợi:** CV duoc luu, trang thai parse = PENDING
- **Công cụ:** Postman / Insomnia; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### CV-002 - Upload file khong dung dinh dang

- **Người thực hiện:** Võ Văn Thành Phong (DE190421)
- **Tuần / module / level:** Tuan 3 / CV Documents / Negative
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Role CANDIDATE
- **Bước thực hiện:** 1. POST /candidates/upload-cv voi file .exe
- **Dữ liệu kiểm thử:** file khong hop le
- **Kết quả mong đợi:** Tra ve 400, tu choi file
- **Công cụ:** Postman / Insomnia; Prisma Studio
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### CV-003 - Kiem tra trich xuat text tu CV

- **Người thực hiện:** Võ Văn Thành Phong (DE190421)
- **Tuần / module / level:** Tuan 4 / CV Documents / Integration
- **Ưu tiên / approach:** Cao / White Box Testing
- **Tiền điều kiện:** CV da upload thanh cong
- **Bước thực hiện:** 1. Cho worker xu ly CV qua BullMQ
- **Dữ liệu kiểm thử:** CV PDF/DOCX mau
- **Kết quả mong đợi:** Text duoc trich xuat dung noi dung, trang thai PARSED
- **Công cụ:** Postman / Insomnia; Jest; Prisma Studio; Docker Compose / service-worker logs
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### CV-004 - Tim kiem ung vien theo vector search

- **Người thực hiện:** Võ Văn Thành Phong (DE190421)
- **Tuần / module / level:** Tuan 4 / CV Embeddings / Functional
- **Ưu tiên / approach:** Cao / White Box Testing
- **Tiền điều kiện:** Da co CV voi embedding
- **Bước thực hiện:** 1. POST /candidates/search voi query text
- **Dữ liệu kiểm thử:** query lien quan ky nang ung vien
- **Kết quả mong đợi:** Tra ve danh sach ung vien theo do tuong dong giam dan
- **Công cụ:** Postman / Insomnia; Jest; Prisma Studio; Docker Compose / service-worker logs; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### CV-005 - Cap nhat ho so ung vien

- **Người thực hiện:** Võ Văn Thành Phong (DE190421)
- **Tuần / module / level:** Tuan 5 / Candidate Profiles / Functional
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Role CANDIDATE, da co profile
- **Bước thực hiện:** 1. PATCH /candidates/:id/profile
- **Dữ liệu kiểm thử:** du lieu profile hop le
- **Kết quả mong đợi:** Profile duoc cap nhat thanh cong
- **Công cụ:** Postman / Insomnia; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### CV-006 - HR xem CV cua ung vien

- **Người thực hiện:** Võ Văn Thành Phong (DE190421)
- **Tuần / module / level:** Tuan 5 / Candidate Profiles / Functional
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Role HR_MANAGER
- **Bước thực hiện:** 1. GET /candidates/:id/cv
- **Dữ liệu kiểm thử:** candidate co CV
- **Kết quả mong đợi:** Tra ve dung file/CV cua candidate
- **Công cụ:** Postman / Insomnia; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### CV-007 - Candidate khac khong duoc xem CV nguoi khac

- **Người thực hiện:** Võ Văn Thành Phong (DE190421)
- **Tuần / module / level:** Tuan 5 / Candidate Profiles / Security
- **Ưu tiên / approach:** Cao / Black Box + White Box Testing
- **Tiền điều kiện:** Role CANDIDATE
- **Bước thực hiện:** 1. GET /candidates/:id/cv voi id cua candidate khac
- **Dữ liệu kiểm thử:** token CANDIDATE A, id cua candidate B
- **Kết quả mong đợi:** Tra ve 403 Forbidden
- **Công cụ:** Postman / Insomnia; Jest; Prisma Studio; `npm run test:e2e:roles` khi flow được hỗ trợ
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

### Ngô Tuấn Dũng - Frontend (React SPA)

#### FE-001 - Kiem tra validate form dang nhap

- **Người thực hiện:** Ngô Tuấn Dũng (DE190244)
- **Tuần / module / level:** Tuan 3 / Login Screen / UI
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Mo trang login
- **Bước thực hiện:** 1. Nhap email sai dinh dang, submit
- **Dữ liệu kiểm thử:** email khong hop le
- **Kết quả mong đợi:** Hien thong bao loi ngay tren form
- **Công cụ:** Puppeteer smoke (`npm run test:ui:roles`); Playwright theo Test Plan
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### FE-002 - Dashboard hien thi dung theo role

- **Người thực hiện:** Ngô Tuấn Dũng (DE190244)
- **Tuần / module / level:** Tuan 3 / Dashboard / UI
- **Ưu tiên / approach:** Cao / Black Box Testing
- **Tiền điều kiện:** Dang nhap voi tung role (4 roles)
- **Bước thực hiện:** 1. Dang nhap, quan sat dashboard
- **Dữ liệu kiểm thử:** 4 tai khoan tuong ung 4 role
- **Kết quả mong đợi:** Dashboard hien noi dung/widget dung voi tung role
- **Công cụ:** Puppeteer smoke (`npm run test:ui:roles`); Playwright theo Test Plan
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### FE-003 - Dieu huong danh sach - chi tiet request

- **Người thực hiện:** Ngô Tuấn Dũng (DE190244)
- **Tuần / module / level:** Tuan 4 / Request List/Detail / UI
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Da dang nhap DEPARTMENT_HEAD
- **Bước thực hiện:** 1. Vao danh sach request 2. Click 1 request
- **Dữ liệu kiểm thử:** request co san
- **Kết quả mong đợi:** Chuyen sang trang chi tiet dung request da chon
- **Công cụ:** Puppeteer smoke (`npm run test:ui:roles`); Playwright theo Test Plan
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### FE-004 - Validate form tao/sua plan

- **Người thực hiện:** Ngô Tuấn Dũng (DE190244)
- **Tuần / module / level:** Tuan 4 / Plan Editor / UI
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Role HR_MANAGER
- **Bước thực hiện:** 1. Bo trong truong bat buoc, submit
- **Dữ liệu kiểm thử:** du lieu thieu
- **Kết quả mong đợi:** Hien loi validate, khong cho submit
- **Công cụ:** Puppeteer smoke (`npm run test:ui:roles`); Playwright theo Test Plan
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### FE-005 - Giao dien len lich phong van

- **Người thực hiện:** Ngô Tuấn Dũng (DE190244)
- **Tuần / module / level:** Tuan 4 / Interview Scheduler / UI
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Role HR_MANAGER
- **Bước thực hiện:** 1. Chon candidate, chon slot, xac nhan
- **Dữ liệu kiểm thử:** slot con trong
- **Kết quả mong đợi:** Interview duoc tao, UI cap nhat danh sach
- **Công cụ:** Puppeteer smoke (`npm run test:ui:roles`); Playwright theo Test Plan
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### FE-006 - Giao dien tim kiem ung vien

- **Người thực hiện:** Ngô Tuấn Dũng (DE190244)
- **Tuần / module / level:** Tuan 5 / Candidate Search / UI
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Role HR_MANAGER
- **Bước thực hiện:** 1. Nhap tu khoa tim kiem, submit
- **Dữ liệu kiểm thử:** tu khoa lien quan ky nang
- **Kết quả mong đợi:** Ket qua hien thi dang danh sach, sap xep theo do phu hop
- **Công cụ:** Puppeteer smoke (`npm run test:ui:roles`); Playwright theo Test Plan
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### FE-007 - Kiem tra giao dien tren nhieu trinh duyet

- **Người thực hiện:** Ngô Tuấn Dũng (DE190244)
- **Tuần / module / level:** Tuan 5 / Toan he thong / Compatibility
- **Ưu tiên / approach:** Thap / Black Box Testing
- **Tiền điều kiện:** He thong dang chay
- **Bước thực hiện:** 1. Mo webapp tren Chrome/Edge/Firefox
- **Dữ liệu kiểm thử:** cung 1 tai khoan test
- **Kết quả mong đợi:** Giao dien hien thi nhat quan tren 3 trinh duyet
- **Công cụ:** Chrome/Edge/Firefox thủ công; Playwright theo Test Plan
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### FE-008 - Chuong thong bao va so luong chua doc

- **Người thực hiện:** Ngô Tuấn Dũng (DE190244)
- **Tuần / module / level:** Tuan 5 / Notifications / UI
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Co thong bao moi
- **Bước thực hiện:** 1. Quan sat icon chuong 2. Click xem danh sach
- **Dữ liệu kiểm thử:** co it nhat 1 notification chua doc
- **Kết quả mong đợi:** So luong hien dung, click vao danh dau da doc
- **Công cụ:** Puppeteer smoke (`npm run test:ui:roles`); Playwright theo Test Plan
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### FE-009 - Sidebar hien thi dung menu theo role

- **Người thực hiện:** Ngô Tuấn Dũng (DE190244)
- **Tuần / module / level:** Tuan 5 / Sidebar/Nav / UI
- **Ưu tiên / approach:** Cao / Black Box + White Box Testing
- **Tiền điều kiện:** Dang nhap voi tung role
- **Bước thực hiện:** 1. Quan sat sidebar cho moi role
- **Dữ liệu kiểm thử:** 4 tai khoan 4 role
- **Kết quả mong đợi:** Chi hien muc menu duoc phep cho tung role
- **Công cụ:** Puppeteer smoke (`npm run test:ui:roles`); Playwright theo Test Plan
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### FE-010 - Tu dong chuyen ve login khi het phien

- **Người thực hiện:** Ngô Tuấn Dũng (DE190244)
- **Tuần / module / level:** Tuan 6 / Session / UI
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Access token het han
- **Bước thực hiện:** 1. Cho token het han, thuc hien 1 hanh dong
- **Dữ liệu kiểm thử:** token het han
- **Kết quả mong đợi:** Tu dong redirect ve trang login
- **Công cụ:** Puppeteer smoke (`npm run test:ui:roles`); Playwright theo Test Plan
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### FE-011 - Hien thi thong bao loi khi API that bai

- **Người thực hiện:** Ngô Tuấn Dũng (DE190244)
- **Tuần / module / level:** Tuan 6 / Error Handling / UI
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Backend tra ve loi 5xx
- **Bước thực hiện:** 1. Goi 1 hanh dong khi API loi
- **Dữ liệu kiểm thử:** API mock tra ve 500
- **Kết quả mong đợi:** Hien toast/thong bao loi than thien, khong crash UI
- **Công cụ:** Puppeteer smoke (`npm run test:ui:roles`); Playwright theo Test Plan
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

#### FE-012 - Hien loading khi cho du lieu

- **Người thực hiện:** Ngô Tuấn Dũng (DE190244)
- **Tuần / module / level:** Tuan 6 / Loading States / UI
- **Ưu tiên / approach:** Thap / Black Box Testing
- **Tiền điều kiện:** Man hinh dang tai du lieu
- **Bước thực hiện:** 1. Vao trang co du lieu tai cham
- **Dữ liệu kiểm thử:** API cham >1s
- **Kết quả mong đợi:** Hien spinner/skeleton trong luc cho
- **Công cụ:** Puppeteer smoke (`npm run test:ui:roles`); Playwright theo Test Plan
- **Kết quả thực tế / trạng thái trong Excel:** Chua chay test / Not Run

### Nguyễn Duy Hiếu - Notification & Reports; defect management

#### NOTI-001 - Xem danh sach thong bao cua user

- **Người thực hiện:** Nguyễn Duy Hiếu (DE190561)
- **Tuần / module / level:** Tuan 3 / Notifications / Functional
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Da dang nhap, co thong bao
- **Bước thực hiện:** 1. GET /notifications
- **Dữ liệu kiểm thử:** user co it nhat 1 notification
- **Kết quả mong đợi:** Tra ve danh sach thong bao dung user
- **Công cụ:** Postman / Insomnia; Prisma Studio
- **Kết quả thực tế / trạng thái trong Excel:** List notifications endpoint exists and works. / Pass

#### NOTI-002 - Danh dau 1 thong bao da doc

- **Người thực hiện:** Nguyễn Duy Hiếu (DE190561)
- **Tuần / module / level:** Tuan 3 / Notifications / Functional
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Co thong bao chua doc
- **Bước thực hiện:** 1. PATCH /notifications/:id/read
- **Dữ liệu kiểm thử:** notification id hop le
- **Kết quả mong đợi:** Trang thai chuyen sang da doc
- **Công cụ:** Postman / Insomnia; Prisma Studio
- **Kết quả thực tế / trạng thái trong Excel:** Mark read endpoint exists and works. / Pass

#### NOTI-003 - Danh dau tat ca da doc

- **Người thực hiện:** Nguyễn Duy Hiếu (DE190561)
- **Tuần / module / level:** Tuan 4 / Notifications / Functional
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Co nhieu thong bao chua doc
- **Bước thực hiện:** 1. PATCH /notifications/read-all
- **Dữ liệu kiểm thử:** user co nhieu unread
- **Kết quả mong đợi:** Tat ca notification cua user chuyen da doc
- **Công cụ:** Postman / Insomnia; Prisma Studio
- **Kết quả thực tế / trạng thái trong Excel:** Mark all read endpoint exists and works. / Pass

#### NOTI-004 - Lay so luong thong bao chua doc

- **Người thực hiện:** Nguyễn Duy Hiếu (DE190561)
- **Tuần / module / level:** Tuan 4 / Notifications / Functional
- **Ưu tiên / approach:** Thap / Black Box Testing
- **Tiền điều kiện:** Co thong bao chua doc
- **Bước thực hiện:** 1. GET /notifications/unread-count
- **Dữ liệu kiểm thử:** user co 3 unread
- **Kết quả mong đợi:** Tra ve dung so luong 3
- **Công cụ:** Postman / Insomnia; Prisma Studio
- **Kết quả thực tế / trạng thái trong Excel:** Unread count endpoint missing. / Fail

#### NOTI-005 - Gui email khi co loi moi phong van

- **Người thực hiện:** Nguyễn Duy Hiếu (DE190561)
- **Tuần / module / level:** Tuan 4 / Email / Integration
- **Ưu tiên / approach:** Cao / White Box Testing
- **Tiền điều kiện:** Interview vua duoc tao
- **Bước thực hiện:** 1. Tao interview 2. Kiem tra hang doi BullMQ email
- **Dữ liệu kiểm thử:** candidate co email hop le
- **Kết quả mong đợi:** Email invite duoc gui qua worker, log thanh cong
- **Công cụ:** Postman / Insomnia; Jest; Docker Compose / service-worker logs
- **Kết quả thực tế / trạng thái trong Excel:** Email invite send flow exists. / Pass

#### REP-001 - Xem bao cao tuyen dung hang nam

- **Người thực hiện:** Nguyễn Duy Hiếu (DE190561)
- **Tuần / module / level:** Tuan 5 / Reports / Functional
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Role ADMIN
- **Bước thực hiện:** 1. GET /reports/annual
- **Dữ liệu kiểm thử:** du lieu tuyen dung ca nam
- **Kết quả mong đợi:** Tra ve so lieu tong hop dung theo nam
- **Công cụ:** Postman / Insomnia; Prisma Studio
- **Kết quả thực tế / trạng thái trong Excel:** Annual report endpoint implemented. / Pass

#### REP-002 - Xem bao cao theo phong ban

- **Người thực hiện:** Nguyễn Duy Hiếu (DE190561)
- **Tuần / module / level:** Tuan 5 / Reports / Functional
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Role ADMIN hoac DEPARTMENT_HEAD
- **Bước thực hiện:** 1. GET /reports/department/:id
- **Dữ liệu kiểm thử:** department co du lieu tuyen dung
- **Kết quả mong đợi:** Tra ve so lieu dung phong ban duoc chon
- **Công cụ:** Postman / Insomnia; Prisma Studio
- **Kết quả thực tế / trạng thái trong Excel:** Department report endpoint implemented. / Pass

#### REP-003 - Xem chi so time-to-hire

- **Người thực hiện:** Nguyễn Duy Hiếu (DE190561)
- **Tuần / module / level:** Tuan 5 / Reports / Functional
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Role ADMIN
- **Bước thực hiện:** 1. GET /reports/time-to-hire
- **Dữ liệu kiểm thử:** co request da COMPLETED
- **Kết quả mong đợi:** Tra ve thoi gian trung binh tu tao den tuyen dung
- **Công cụ:** Postman / Insomnia; Prisma Studio
- **Kết quả thực tế / trạng thái trong Excel:** Time-to-hire endpoint implemented. / Pass

#### REP-004 - Xem pipeline tong quan

- **Người thực hiện:** Nguyễn Duy Hiếu (DE190561)
- **Tuần / module / level:** Tuan 6 / Reports / Functional
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Role HR_MANAGER
- **Bước thực hiện:** 1. GET /reports/pipeline
- **Dữ liệu kiểm thử:** co request o nhieu trang thai
- **Kết quả mong đợi:** Tra ve so luong request theo tung trang thai
- **Công cụ:** Postman / Insomnia; Prisma Studio
- **Kết quả thực tế / trạng thái trong Excel:** Pipeline report endpoint implemented. / Pass

#### REP-005 - Chan truy cap bao cao voi role khong hop le

- **Người thực hiện:** Nguyễn Duy Hiếu (DE190561)
- **Tuần / module / level:** Tuan 6 / Reports / Security
- **Ưu tiên / approach:** Cao / Black Box + White Box Testing
- **Tiền điều kiện:** Role CANDIDATE
- **Bước thực hiện:** 1. GET /reports/annual voi token CANDIDATE
- **Dữ liệu kiểm thử:** token CANDIDATE
- **Kết quả mong đợi:** Tra ve 403 Forbidden
- **Công cụ:** Postman / Insomnia; Jest; Prisma Studio
- **Kết quả thực tế / trạng thái trong Excel:** Role-based report access enforced. / Pass

#### DEF-001 - Kiem tra quy trinh ghi nhan defect

- **Người thực hiện:** Nguyễn Duy Hiếu (DE190561)
- **Tuần / module / level:** Tuan 6 / Defect Mgmt / Process
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Phat hien loi trong qua trinh test
- **Bước thực hiện:** 1. Tao defect voi day du Severity/Priority theo quy trinh New->Assigned->...
- **Dữ liệu kiểm thử:** defect mau (Critical/High/Medium/Low)
- **Kết quả mong đợi:** Defect duoc ghi nhan dung workflow, gan dung nguoi xu ly
- **Công cụ:** GitHub Issues / Projects; công cụ của test case gốc khi retest
- **Kết quả thực tế / trạng thái trong Excel:** Defect logging process ready. / Pass

#### DEF-002 - Retest defect da fix truoc khi dong

- **Người thực hiện:** Nguyễn Duy Hiếu (DE190561)
- **Tuần / module / level:** Tuan 6 / Defect Mgmt / Process
- **Ưu tiên / approach:** TB / Black Box Testing
- **Tiền điều kiện:** Defect co trang thai Fixed
- **Bước thực hiện:** 1. Retest lai test case lien quan defect
- **Dữ liệu kiểm thử:** test case goc cua defect
- **Kết quả mong đợi:** Neu pass thi dong defect (Closed), neu fail thi mo lai
- **Công cụ:** GitHub Issues / Projects; công cụ của test case gốc khi retest
- **Kết quả thực tế / trạng thái trong Excel:** Defect retest workflow ready. / Pass

## 7. Thứ tự thực thi khuyến nghị

1. Chuẩn hóa role `HR_MANAGER` thành `HR_LEADER`, route/method và expected state theo code hiện tại; cập nhật RTM.
2. Chạy 28 test case ưu tiên Cao trước, đặc biệt approval pipeline, RBAC, CV upload/search, interview result và report security.
3. Chạy API smoke bằng Postman/Insomnia và `npm run test:e2e:roles`; dùng Prisma Studio để xác nhận side effect và audit log.
4. Chạy Jest cho các case White Box/kết hợp; bổ sung test setup còn thiếu ở package chưa có script test nếu case yêu cầu.
5. Chạy UI role smoke bằng Puppeteer, sau đó FE-007 trên Chrome/Edge/Firefox; ghi defect vào GitHub Issues/Projects.
6. Retest NOTI-004 sau khi quyết định bổ sung `/notifications/unread-count` hoặc thay expected theo cơ chế hiện tại.

## 8. Nguồn

- `Test(SWT)\SWP391_G7_Test_Plan.docx` - vai trò, trách nhiệm, phạm vi, chiến lược, công cụ và lịch kiểm thử.
- `Test(SWT)\TestCases_RMS_Group5.xlsx` - 65 test case, dữ liệu kiểm thử, trạng thái và phân loại Black/White Box.
- Knowledge graph/code hiện tại - controller, enum, service, package scripts và automation scripts nêu tại mục 3-4.
