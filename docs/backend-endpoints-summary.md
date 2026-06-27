# Backend Endpoints Summary

Tài liệu này tổng hợp các endpoint backend hiện có trong project, dựa trên source code tại `services/gateway/src/controllers/*`.

Gateway đặt global prefix là `/api/v1`, vì vậy toàn bộ HTTP endpoint bên dưới được gọi với dạng:

```text
/api/v1/<endpoint>
```

Các service `identity`, `recruiting`, `profiles`, `cv`, `interview`, `notification` chạy nội bộ bằng Nest TCP microservice. Client/frontend nên đi qua API Gateway thay vì gọi trực tiếp các service nội bộ.

## Quy ước quyền truy cập

| Giá trị         | Ý nghĩa                                                |
| --------------- | ------------------------------------------------------ |
| Public          | Không cần JWT.                                         |
| Authenticated   | Cần JWT hợp lệ, không giới hạn role cụ thể.            |
| ADMIN           | Quản trị hệ thống.                                     |
| HR_LEADER       | Trưởng nhóm/manager HR phụ trách điều phối tuyển dụng. |
| HR_RECRUITER    | Nhân sự tuyển dụng xử lý task/candidate/interview.     |
| DEPARTMENT_HEAD | Trưởng bộ phận tạo và theo dõi nhu cầu tuyển dụng.     |
| CANDIDATE       | Ứng viên.                                              |

Lưu ý: route `GET /candidate-profiles/:id/avatar` đang có cả `@Public()` và `@Roles(...)`. Với `RolesGuard` hiện tại, route này vẫn cần user có role phù hợp nếu `@Roles` được áp dụng.

## Health

| Method | Endpoint         | Quyền truy cập | Vai trò trong hệ thống                           | Mục đích                                                                                      |
| ------ | ---------------- | -------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| GET    | `/api/v1/health` | Public         | Giám sát trạng thái Gateway và các microservice. | Trả về health check tổng hợp của identity, recruiting, profiles, notification, cv, interview. |

## Auth

| Method | Endpoint                           | Quyền truy cập | Vai trò trong hệ thống       | Mục đích                                                   |
| ------ | ---------------------------------- | -------------- | ---------------------------- | ---------------------------------------------------------- |
| POST   | `/api/v1/auth/register`            | Public         | Đăng ký tài khoản mới.       | Tạo user đăng ký và bắt đầu flow xác thực OTP.             |
| POST   | `/api/v1/auth/verify-register`     | Public         | Xác minh đăng ký.            | Kiểm tra OTP đăng ký để kích hoạt/hoàn tất tài khoản.      |
| POST   | `/api/v1/auth/resend-register-otp` | Public         | Hỗ trợ xác minh đăng ký.     | Gửi lại OTP đăng ký cho email người dùng.                  |
| POST   | `/api/v1/auth/login`               | Public         | Đăng nhập.                   | Xác thực email/password và cấp access token/refresh token. |
| POST   | `/api/v1/auth/refresh`             | Public         | Duy trì phiên đăng nhập.     | Đổi refresh token lấy JWT mới.                             |
| POST   | `/api/v1/auth/logout`              | Public         | Kết thúc phiên đăng nhập.    | Thu hồi/invalidate refresh token.                          |
| POST   | `/api/v1/auth/forgot-password`     | Public         | Khôi phục mật khẩu.          | Gửi OTP reset password đến email.                          |
| POST   | `/api/v1/auth/reset-password`      | Public         | Đặt lại mật khẩu.            | Xác thực OTP và cập nhật mật khẩu mới.                     |
| GET    | `/api/v1/me`                       | Authenticated  | Nhận diện user hiện tại.     | Trả về payload user đang đăng nhập từ JWT.                 |
| GET    | `/api/v1/me/profile`               | Authenticated  | Lấy hồ sơ identity hiện tại. | Truy vấn chi tiết user hiện tại từ Identity service.       |
| GET    | `/api/v1/me/id`                    | Authenticated  | Lấy định danh user hiện tại. | Trả về `userId` của user đang đăng nhập.                   |

## Users, Organizations, Departments

| Method | Endpoint                     | Quyền truy cập                                  | Vai trò trong hệ thống     | Mục đích                                                                    |
| ------ | ---------------------------- | ----------------------------------------------- | -------------------------- | --------------------------------------------------------------------------- |
| GET    | `/api/v1/users`              | ADMIN, HR_LEADER                                | Quản lý danh sách user.    | Liệt kê user có phân trang và lọc role; HR_LEADER bị scope về HR_RECRUITER. |
| GET    | `/api/v1/users/interviewers` | ADMIN, HR_LEADER, HR_RECRUITER, DEPARTMENT_HEAD | Chọn hội đồng phỏng vấn.   | Liệt kê user nội bộ có thể tham gia panel phỏng vấn.                        |
| GET    | `/api/v1/users/:id`          | ADMIN                                           | Xem chi tiết user.         | Lấy user theo ID.                                                           |
| POST   | `/api/v1/users`              | ADMIN                                           | Tạo user nội bộ.           | Tạo tài khoản user với role, organization, department.                      |
| PATCH  | `/api/v1/users/:id`          | ADMIN                                           | Cập nhật user.             | Sửa thông tin cơ bản, trạng thái, phòng ban của user.                       |
| DELETE | `/api/v1/users/:id`          | ADMIN                                           | Xóa user.                  | Xóa tài khoản user theo ID.                                                 |
| PATCH  | `/api/v1/users/:id/role`     | ADMIN                                           | Phân quyền user.           | Cập nhật role của user.                                                     |
| PATCH  | `/api/v1/users/:id/status`   | ADMIN                                           | Kiểm soát trạng thái user. | Kích hoạt hoặc vô hiệu hóa user.                                            |
| POST   | `/api/v1/organizations`      | ADMIN                                           | Quản lý tổ chức.           | Tạo organization mới.                                                       |
| GET    | `/api/v1/organizations`      | ADMIN                                           | Quản lý tổ chức.           | Liệt kê organizations.                                                      |
| GET    | `/api/v1/organizations/:id`  | ADMIN                                           | Xem chi tiết tổ chức.      | Lấy organization theo ID.                                                   |
| PATCH  | `/api/v1/organizations/:id`  | ADMIN                                           | Cập nhật tổ chức.          | Cập nhật tên, slug, settings của organization.                              |
| POST   | `/api/v1/departments`        | ADMIN                                           | Quản lý phòng ban.         | Tạo department mới.                                                         |
| GET    | `/api/v1/departments`        | ADMIN, HR_LEADER, HR_RECRUITER                  | Tra cứu phòng ban.         | Liệt kê departments, có thể lọc theo organization.                          |
| GET    | `/api/v1/departments/:id`    | ADMIN, HR_LEADER, HR_RECRUITER                  | Tra cứu phòng ban.         | Lấy department theo ID.                                                     |
| PATCH  | `/api/v1/departments/:id`    | ADMIN                                           | Cập nhật phòng ban.        | Sửa tên, code, head user, parent department.                                |
| DELETE | `/api/v1/departments/:id`    | ADMIN                                           | Xóa phòng ban.             | Xóa department theo ID.                                                     |

## Recruitment Requests

| Method | Endpoint                                               | Quyền truy cập                                  | Vai trò trong hệ thống       | Mục đích                                                       |
| ------ | ------------------------------------------------------ | ----------------------------------------------- | ---------------------------- | -------------------------------------------------------------- |
| GET    | `/api/v1/recruitment-requests`                         | ADMIN, HR_LEADER, HR_RECRUITER                  | Theo dõi yêu cầu tuyển dụng. | Liệt kê recruitment requests theo role/user hiện tại.          |
| POST   | `/api/v1/recruitment-requests`                         | DEPARTMENT_HEAD                                 | Tạo nhu cầu tuyển dụng.      | Department Head tạo request mới, có thể lưu draft hoặc submit. |
| GET    | `/api/v1/recruitment-requests/:id`                     | ADMIN, HR_LEADER, HR_RECRUITER, DEPARTMENT_HEAD | Xem chi tiết yêu cầu.        | Lấy request theo quyền nhìn thấy của user hiện tại.            |
| PATCH  | `/api/v1/recruitment-requests/:id`                     | DEPARTMENT_HEAD, HR_LEADER                      | Cập nhật yêu cầu.            | Sửa nội dung request trong các bước workflow cho phép.         |
| PATCH  | `/api/v1/recruitment-requests/:id/submit`              | DEPARTMENT_HEAD                                 | Gửi duyệt yêu cầu.           | Submit draft request sang bước review.                         |
| PATCH  | `/api/v1/recruitment-requests/:id/assign`              | ADMIN, HR_LEADER                                | Phân công xử lý.             | Gán request cho HR manager/leader phụ trách.                   |
| PATCH  | `/api/v1/recruitment-requests/:id/return-for-revision` | HR_LEADER                                       | Trả về chỉnh sửa.            | HR trả request lại Department Head kèm feedback.               |
| PATCH  | `/api/v1/recruitment-requests/:id/request-changes`     | ADMIN                                           | Yêu cầu HR chỉnh sửa.        | Admin yêu cầu thay đổi request đã được HR forward.             |
| PATCH  | `/api/v1/recruitment-requests/:id/forward-to-admin`    | HR_LEADER                                       | Chuyển Admin duyệt.          | HR forward request đã review lên Admin.                        |
| PATCH  | `/api/v1/recruitment-requests/:id/decision`            | ADMIN, HR_LEADER                                | Ra quyết định request.       | Approve/reject request đang chờ quyết định.                    |

## Overall Plan And Task Plan

| Method | Endpoint                                     | Quyền truy cập                 | Vai trò trong hệ thống            | Mục đích                                                             |
| ------ | -------------------------------------------- | ------------------------------ | --------------------------------- | -------------------------------------------------------------------- |
| POST   | `/api/v1/overall-plan`                       | HR_LEADER                      | Lập kế hoạch tuyển dụng tổng thể. | Tạo overall plan cho recruitment request đã được duyệt.              |
| GET    | `/api/v1/overall-plan/by-request/:requestId` | HR_LEADER, HR_RECRUITER, ADMIN | Tra cứu kế hoạch theo request.    | Lấy overall plan gắn với recruitment request.                        |
| PATCH  | `/api/v1/overall-plan/:id/approve`           | ADMIN                          | Duyệt kế hoạch tổng thể.          | Admin approve overall plan.                                          |
| PATCH  | `/api/v1/overall-plan/:id/submit`            | HR_LEADER                      | Gửi duyệt kế hoạch.               | HR submit overall plan và task cho Admin approval.                   |
| PATCH  | `/api/v1/overall-plan/:id/start-campaign`    | HR_LEADER                      | Khởi động chiến dịch.             | Bắt đầu campaign đã duyệt và thông báo HR recruiters được phân công. |
| PATCH  | `/api/v1/overall-plan/:id/reject`            | ADMIN                          | Từ chối kế hoạch.                 | Admin reject overall plan kèm revision notes.                        |
| PATCH  | `/api/v1/overall-plan/:id/resubmit`          | HR_LEADER                      | Gửi lại kế hoạch.                 | HR resubmit overall plan sau khi bị reject.                          |
| POST   | `/api/v1/task-plan`                          | HR_LEADER                      | Tạo task trong campaign.          | Tạo/assign task thuộc overall plan.                                  |
| GET    | `/api/v1/task-plan`                          | HR_LEADER, HR_RECRUITER, ADMIN | Theo dõi task tuyển dụng.         | Liệt kê task plan theo role/user hiện tại.                           |
| PATCH  | `/api/v1/task-plan/:id/status`               | HR_LEADER, HR_RECRUITER        | Cập nhật tiến độ task.            | Đổi trạng thái task plan.                                            |
| PATCH  | `/api/v1/task-plan/:id`                      | HR_LEADER                      | Chỉnh sửa task draft.             | Cập nhật task trước khi Admin approve plan.                          |
| PATCH  | `/api/v1/task-plan/:id/assign-recruiter`     | HR_LEADER                      | Phân công recruiter.              | Gán approved campaign task cho HR recruiter.                         |

## Roles And Job Postings

| Method | Endpoint                           | Quyền truy cập   | Vai trò trong hệ thống      | Mục đích                                                               |
| ------ | ---------------------------------- | ---------------- | --------------------------- | ---------------------------------------------------------------------- |
| POST   | `/api/v1/roles`                    | Authenticated    | Quản lý role/JD.            | Tạo role hoặc job description trong hệ thống tuyển dụng.               |
| GET    | `/api/v1/roles`                    | Authenticated    | Tra cứu role/JD.            | Liệt kê roles/JDs.                                                     |
| GET    | `/api/v1/roles/:id`                | Authenticated    | Xem role/JD.                | Lấy role/JD theo ID.                                                   |
| POST   | `/api/v1/job-postings`             | HR_LEADER, ADMIN | Tạo tin tuyển dụng.         | Tạo job posting từ recruitment request đã duyệt.                       |
| GET    | `/api/v1/job-postings`             | Authenticated    | Quản lý tin tuyển dụng.     | Liệt kê job postings theo quyền user.                                  |
| GET    | `/api/v1/public/job-postings`      | Public           | Trang tuyển dụng công khai. | Liệt kê job postings đã publish và public cho ứng viên/khách.          |
| GET    | `/api/v1/job-postings/:id`         | Authenticated    | Xem tin tuyển dụng.         | Lấy chi tiết job posting theo quyền user.                              |
| PATCH  | `/api/v1/job-postings/:id`         | HR_LEADER, ADMIN | Cập nhật tin tuyển dụng.    | Sửa title, description, requirements, visibility, expire date, status. |
| POST   | `/api/v1/job-postings/:id/publish` | HR_LEADER, ADMIN | Công khai tin tuyển dụng.   | Publish job posting.                                                   |
| POST   | `/api/v1/job-postings/:id/close`   | HR_LEADER, ADMIN | Đóng tin tuyển dụng.        | Close job posting.                                                     |

## Applications, Invites, Evaluations

| Method | Endpoint                          | Quyền truy cập | Vai trò trong hệ thống      | Mục đích                                                                   |
| ------ | --------------------------------- | -------------- | --------------------------- | -------------------------------------------------------------------------- |
| POST   | `/api/v1/applications`            | Authenticated  | Ứng tuyển vào role.         | Tạo application; nếu user là Candidate thì tự gắn candidate/user hiện tại. |
| GET    | `/api/v1/applications`            | Authenticated  | Theo dõi đơn ứng tuyển.     | Liệt kê applications theo role/user.                                       |
| GET    | `/api/v1/applications/:id`        | Authenticated  | Xem đơn ứng tuyển.          | Lấy application theo ID.                                                   |
| PATCH  | `/api/v1/applications/:id/status` | Authenticated  | Cập nhật pipeline ứng viên. | Đổi trạng thái application.                                                |
| POST   | `/api/v1/invites`                 | Authenticated  | Mời ứng viên.               | Gửi invite cho candidate.                                                  |
| GET    | `/api/v1/invites`                 | Authenticated  | Theo dõi lời mời.           | Liệt kê invites.                                                           |
| POST   | `/api/v1/evaluations`             | Authenticated  | Chạy đánh giá ứng viên.     | Trigger evaluation run.                                                    |
| GET    | `/api/v1/evaluations/:id`         | Authenticated  | Xem kết quả đánh giá.       | Lấy evaluation result theo ID.                                             |

## Talent Search And CV Screening

| Method | Endpoint                                  | Quyền truy cập   | Vai trò trong hệ thống            | Mục đích                                                                    |
| ------ | ----------------------------------------- | ---------------- | --------------------------------- | --------------------------------------------------------------------------- |
| POST   | `/api/v1/talent/search`                   | Authenticated    | Tìm kiếm ứng viên bằng AI/vector. | Search candidates theo skill/role, dùng knowledge graph và vector matching. |
| POST   | `/api/v1/talent/feedback`                 | Authenticated    | Vòng lặp học từ feedback.         | Ghi nhận HR feedback cho kết quả talent search.                             |
| GET    | `/api/v1/talent/feedback/export-triplets` | ADMIN, HR_LEADER | Xuất dữ liệu huấn luyện.          | Export feedback thành triplets phục vụ training embedding/ranking.          |
| GET    | `/api/v1/talent/expand`                   | Authenticated    | Mở rộng truy vấn skill.           | Expand query bằng knowledge graph.                                          |
| POST   | `/api/v1/cv/search`                       | Authenticated    | Tìm kiếm hồ sơ ứng viên.          | Search candidate profiles/CV theo query và filter.                          |
| POST   | `/api/v1/cv/:candidateProfileId/screen`   | Authenticated    | Sàng lọc CV theo role.            | Chấm/screen CV của candidate với role cụ thể.                               |

## Candidate Profiles And Documents

| Method | Endpoint                                | Quyền truy cập                                  | Vai trò trong hệ thống        | Mục đích                                                        |
| ------ | --------------------------------------- | ----------------------------------------------- | ----------------------------- | --------------------------------------------------------------- |
| GET    | `/api/v1/candidate-profiles/me`         | CANDIDATE                                       | Hồ sơ ứng viên cá nhân.       | Candidate lấy profile của chính mình.                           |
| PATCH  | `/api/v1/candidate-profiles/me`         | CANDIDATE                                       | Cập nhật hồ sơ ứng viên.      | Candidate cập nhật thông tin cá nhân, summary, structured data. |
| GET    | `/api/v1/candidate-profiles/me/avatar`  | CANDIDATE                                       | Ảnh đại diện cá nhân.         | Lấy avatar của candidate hiện tại.                              |
| POST   | `/api/v1/candidate-profiles/me/avatar`  | CANDIDATE                                       | Upload ảnh đại diện.          | Candidate upload avatar JPG/PNG/GIF.                            |
| DELETE | `/api/v1/candidate-profiles/me/avatar`  | CANDIDATE                                       | Xóa ảnh đại diện.             | Candidate xóa avatar hiện tại.                                  |
| GET    | `/api/v1/candidate-profiles`            | ADMIN, HR_LEADER, HR_RECRUITER                  | Talent pool.                  | Liệt kê candidate profiles.                                     |
| GET    | `/api/v1/candidate-profiles/:id`        | ADMIN, HR_LEADER, HR_RECRUITER, DEPARTMENT_HEAD | Xem hồ sơ ứng viên.           | Lấy candidate profile theo ID.                                  |
| GET    | `/api/v1/candidate-profiles/:id/avatar` | ADMIN, HR_LEADER, HR_RECRUITER, DEPARTMENT_HEAD | Xem ảnh ứng viên.             | Lấy avatar của candidate theo ID.                               |
| PATCH  | `/api/v1/candidate-profiles/:id`        | ADMIN, HR_LEADER, HR_RECRUITER                  | Quản lý hồ sơ ứng viên.       | Cập nhật candidate profile theo ID.                             |
| POST   | `/api/v1/documents`                     | Authenticated                                   | Upload tài liệu tuyển dụng.   | Upload document loại CV/JD vào storage và ghi metadata.         |
| GET    | `/api/v1/documents`                     | Authenticated                                   | Quản lý tài liệu.             | Liệt kê documents.                                              |
| GET    | `/api/v1/documents/:id`                 | Authenticated                                   | Xem tài liệu.                 | Lấy document metadata theo ID.                                  |
| GET    | `/api/v1/evidence`                      | Authenticated                                   | Dữ liệu bằng chứng/embedding. | Liệt kê evidence records.                                       |
| GET    | `/api/v1/evidence/:id`                  | Authenticated                                   | Xem evidence.                 | Lấy evidence record theo ID.                                    |

## Candidate CVs

| Method | Endpoint                                                   | Quyền truy cập                                  | Vai trò trong hệ thống             | Mục đích                                                                   |
| ------ | ---------------------------------------------------------- | ----------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------- |
| GET    | `/api/v1/candidate/cvs/candidate/:candidateId/latest`      | ADMIN, HR_LEADER, HR_RECRUITER, DEPARTMENT_HEAD | Tra cứu CV mới nhất của candidate. | Lấy metadata/latest CV cho candidate profile.                              |
| GET    | `/api/v1/candidate/cvs/candidate/:candidateId/latest/file` | ADMIN, HR_LEADER, HR_RECRUITER, DEPARTMENT_HEAD | Xem/tải file CV.                   | Stream, redirect hoặc send file CV mới nhất của candidate.                 |
| GET    | `/api/v1/candidate/cvs`                                    | CANDIDATE                                       | Quản lý CV cá nhân.                | Candidate liệt kê CV của chính mình.                                       |
| POST   | `/api/v1/candidate/cvs`                                    | CANDIDATE                                       | Upload CV cá nhân.                 | Candidate upload CV PDF/DOCX/DOC; hệ thống extract text nhanh và lưu file. |
| DELETE | `/api/v1/candidate/cvs/:id`                                | CANDIDATE                                       | Xóa CV cá nhân.                    | Candidate xóa CV thuộc quyền sở hữu của mình.                              |

## Interviews

| Method | Endpoint                                                | Quyền truy cập                                             | Vai trò trong hệ thống          | Mục đích                                                                        |
| ------ | ------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------- |
| POST   | `/api/v1/interviews/schedules`                          | HR_LEADER, HR_RECRUITER                                    | Lên lịch phỏng vấn.             | Tạo interview schedule có kiểm tra conflict và plan-lock.                       |
| GET    | `/api/v1/interviews/schedules/:id`                      | HR_LEADER, HR_RECRUITER, ADMIN, DEPARTMENT_HEAD, CANDIDATE | Xem lịch phỏng vấn.             | Lấy schedule theo ID với scope theo user/role.                                  |
| GET    | `/api/v1/interviews/requests/:requestId/schedules`      | HR_LEADER, HR_RECRUITER, ADMIN, DEPARTMENT_HEAD            | Xem lịch theo request.          | Liệt kê interview schedules của một recruitment request.                        |
| PATCH  | `/api/v1/interviews/schedules/:id/reschedule`           | HR_LEADER, HR_RECRUITER                                    | Đổi lịch phỏng vấn.             | Reschedule interview, kiểm tra conflict và thông báo các bên.                   |
| PATCH  | `/api/v1/interviews/schedules/:id/cancel`               | HR_LEADER, HR_RECRUITER, ADMIN                             | Hủy lịch phỏng vấn.             | Cancel interview kèm lý do, gửi thông báo và ghi timeline.                      |
| POST   | `/api/v1/interviews/schedules/:id/confirm`              | CANDIDATE                                                  | Candidate xác nhận tham dự.     | Candidate confirm attendance cho interview.                                     |
| PATCH  | `/api/v1/interviews/schedules/:id/candidate-reschedule` | CANDIDATE                                                  | Candidate đề xuất đổi lịch.     | Candidate request thời gian phỏng vấn mới kèm lý do.                            |
| PATCH  | `/api/v1/interviews/schedules/:id/candidate-cancel`     | CANDIDATE                                                  | Candidate hủy phỏng vấn.        | Candidate cancel interview kèm lý do.                                           |
| POST   | `/api/v1/interviews/schedules/:id/invitations`          | HR_LEADER, HR_RECRUITER                                    | Gửi thư mời phỏng vấn.          | Gửi invitation email cho candidate và panel.                                    |
| GET    | `/api/v1/interviews/schedules/:id/email-logs`           | HR_LEADER, HR_RECRUITER, ADMIN                             | Theo dõi email phỏng vấn.       | Lấy log delivery email invitation.                                              |
| GET    | `/api/v1/interviews/completed`                          | HR_LEADER, HR_RECRUITER, ADMIN, DEPARTMENT_HEAD            | Theo dõi phỏng vấn đã hoàn tất. | Liệt kê completed/past interviews theo quyền user.                              |
| GET    | `/api/v1/interviews/:id/details`                        | HR_LEADER, HR_RECRUITER, ADMIN, DEPARTMENT_HEAD            | Xem chi tiết kết quả phỏng vấn. | Lấy interview details cùng feedback của panel.                                  |
| POST   | `/api/v1/interviews/:id/my-feedback`                    | DEPARTMENT_HEAD, HR_LEADER                                 | Ghi feedback cá nhân.           | Evaluator hiện tại ghi decision, điểm technical/communication/culture và notes. |
| POST   | `/api/v1/interviews/schedules/:id/results`              | HR_RECRUITER                                               | Ghi kết quả phỏng vấn legacy.   | Record detailed panel feedbacks và final recommendation qua path cũ.            |
| POST   | `/api/v1/interviews/:id/results`                        | HR_RECRUITER                                               | Ghi kết quả phỏng vấn.          | Record detailed panel feedbacks và final recommendation.                        |

## Offers And Hiring Decisions

| Method | Endpoint                                           | Quyền truy cập                            | Vai trò trong hệ thống           | Mục đích                                                   |
| ------ | -------------------------------------------------- | ----------------------------------------- | -------------------------------- | ---------------------------------------------------------- |
| POST   | `/api/v1/hiring-decisions/:requestId`              | ADMIN                                     | Quyết định tuyển dụng cuối cùng. | Admin đưa final hiring decision sau vòng phỏng vấn.        |
| POST   | `/api/v1/hiring-decisions/:requestId/request-info` | ADMIN                                     | Yêu cầu bổ sung thông tin.       | Admin yêu cầu thêm thông tin trước khi ra quyết định cuối. |
| POST   | `/api/v1/offers`                                   | HR_LEADER                                 | Tạo offer letter.                | Generate offer letter cho candidate/request để review.     |
| GET    | `/api/v1/offers/:id`                               | HR_LEADER, HR_RECRUITER, ADMIN, CANDIDATE | Xem offer letter.                | Review offer letter theo ID.                               |
| POST   | `/api/v1/offers/:id/send`                          | HR_LEADER                                 | Gửi offer letter.                | Gửi offer đã review cho candidate.                         |
| POST   | `/api/v1/offers/:id/respond`                       | CANDIDATE                                 | Candidate phản hồi offer.        | Candidate accept hoặc decline offer letter.                |

## Reports And Audit Logs

| Method | Endpoint                            | Quyền truy cập                                  | Vai trò trong hệ thống        | Mục đích                                                          |
| ------ | ----------------------------------- | ----------------------------------------------- | ----------------------------- | ----------------------------------------------------------------- |
| GET    | `/api/v1/reports/admin-dashboard`   | ADMIN                                           | Dashboard admin.              | Lấy overview số liệu cho admin dashboard.                         |
| GET    | `/api/v1/reports/annual`            | ADMIN                                           | Báo cáo tuyển dụng năm.       | Lấy annual recruitment report theo `year`.                        |
| GET    | `/api/v1/reports/departments`       | ADMIN                                           | Thống kê theo phòng ban.      | Lấy department recruitment statistics theo range.                 |
| GET    | `/api/v1/reports/department/:id`    | ADMIN, DEPARTMENT_HEAD                          | Báo cáo phòng ban.            | Lấy recruitment report của department, có scope theo role.        |
| GET    | `/api/v1/reports/time-to-hire`      | ADMIN                                           | Chỉ số tuyển dụng.            | Lấy time-to-hire metrics.                                         |
| GET    | `/api/v1/reports/pipeline`          | ADMIN, HR_LEADER                                | Tổng quan pipeline.           | Lấy recruitment pipeline overview.                                |
| GET    | `/api/v1/reports/annual/export`     | ADMIN                                           | Xuất báo cáo năm.             | Export annual recruitment report dạng CSV hoặc PDF.               |
| GET    | `/api/v1/reports/realtime-tracking` | ADMIN, HR_LEADER, HR_RECRUITER, DEPARTMENT_HEAD | Theo dõi trạng thái realtime. | Lấy dashboard tracking trạng thái recruitment requests theo role. |

### Requirement v1.0 workflow notes (T-085)

- `POST /api/v1/interviews/schedules` requires at least two distinct, active internal users in `interviewers`. The response includes resolved `panel` details.
- `POST /api/v1/hiring-decisions/:requestId` requires `candidateId`, `compensation`, and `startDate` for `HIRE`; it creates and queues the candidate's offer atomically with workflow records.
- `GET /api/v1/offers/:id` is ownership-scoped for candidates.
- `POST /api/v1/offers/:id/respond` accepts `{ "response": "ACCEPT" | "DECLINE", "note"?: string }` and persists `response`, `responseNote`, and `respondedAt`.
- `GET /api/v1/reports/realtime-tracking` returns role-scoped request ownership, pending action, task/interview/offer counters, latest log, and update time.
- Task deadline reminders are internal worker jobs for incomplete tasks in approved plans and active requests. They create `TASK_REMINDER` notifications and email logs at 24 hours before the deadline and at the deadline, and safely retry queue failures without duplicate logs.
  | GET | `/api/v1/audit-logs` | Authenticated | Audit trail. | Truy vấn audit log theo `entityType` và `entityId`. |

## Notifications

| Method | Endpoint                              | Quyền truy cập | Vai trò trong hệ thống | Mục đích                                                    |
| ------ | ------------------------------------- | -------------- | ---------------------- | ----------------------------------------------------------- |
| GET    | `/api/v1/notifications/sse`           | Authenticated  | Realtime notification. | Mở SSE stream nhận notification realtime của user hiện tại. |
| GET    | `/api/v1/notifications`               | Authenticated  | Trung tâm thông báo.   | Liệt kê notifications của user hiện tại.                    |
| PATCH  | `/api/v1/notifications/:id/read`      | Authenticated  | Đánh dấu đã đọc.       | Mark một notification là read.                              |
| POST   | `/api/v1/notifications/mark-all-read` | Authenticated  | Dọn inbox thông báo.   | Mark toàn bộ notifications của user là read.                |
