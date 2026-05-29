# Enterprise Hiring Workflow — Detailed Specification

## 1. Tổng Quan Luồng Nghiệp Vụ

Luồng tuyển dụng của hệ thống tuân theo chuỗi phê duyệt nhiều cấp:

```
Trưởng Phòng Ban → Phòng Tuyển Dụng → Admin/Boss → Phòng Tuyển Dụng triển khai → Kết quả
```

### Nguyên tắc cốt lõi:
1. **Không bỏ bước**: Mọi giai đoạn phải hoàn thành trước khi chuyển sang bước tiếp theo
2. **Kế hoạch phải được duyệt**: Không có hành động tuyển dụng nào ngoài khung kế hoạch đã duyệt
3. **Lưu vết toàn bộ**: Hệ thống ghi log chi tiết mỗi lần chuyển trạng thái
4. **Thông báo tức thì**: Mỗi thay đổi trạng thái → notification đến các bên liên quan

---

## 2. State Machine: RecruitmentRequest

### Trạng thái (States)

| Status | Mô tả | Actor chịu trách nhiệm |
|--------|--------|------------------------|
| `DRAFT` | Yêu cầu mới tạo, chưa gửi | Trưởng Phòng Ban |
| `PENDING_HR_REVIEW` | Đã gửi, chờ Phòng Tuyển Dụng xem xét | Phòng Tuyển Dụng |
| `PENDING_BOSS_APPROVAL` | Phòng TD đã chuyển lên, chờ Sếp duyệt | Admin/Boss |
| `APPROVED` | Sếp đã phê duyệt, sẵn sàng lập kế hoạch | Phòng Tuyển Dụng |
| `REJECTED` | Sếp từ chối yêu cầu (**terminal**) | — |
| `PLANNING` | Đang lập kế hoạch tuyển dụng | Phòng Tuyển Dụng |
| `PLAN_PENDING_APPROVAL` | Kế hoạch đã gửi, chờ Sếp duyệt | Admin/Boss |
| `ACTIVE` | Chiến dịch đang triển khai | Phòng Tuyển Dụng |
| `INTERVIEWING` | Đang tổ chức phỏng vấn | Phòng Tuyển Dụng |
| `DECISION_PENDING` | Chờ quyết định tuyển dụng cuối cùng | Admin/Boss |
| `HIRED` | Đã tuyển → gửi Offer Letter | Phòng Tuyển Dụng |
| `NOT_HIRED` | Không tuyển → gửi thư từ chối | Phòng Tuyển Dụng |
| `COMPLETED` | Ứng viên nhận việc, chiến dịch đóng (**terminal**) | — |

### Transition Rules

```
DRAFT → PENDING_HR_REVIEW
  Khi: Trưởng PB nhấn "Gửi yêu cầu"
  Validate: Đầy đủ vị trí, số lượng, JD, yêu cầu kỹ năng, lý do tuyển dụng
  Action: Notification → Phòng Tuyển Dụng

PENDING_HR_REVIEW → PENDING_BOSS_APPROVAL
  Khi: Phòng TD review xong, chuyển lên Sếp
  Action: Notification → Admin/Boss

PENDING_BOSS_APPROVAL → APPROVED
  Khi: Sếp phê duyệt
  Action: Notification → Phòng TD + Trưởng PB
  Note: Ghi log approvedBy, approvedAt

PENDING_BOSS_APPROVAL → REJECTED
  Khi: Sếp từ chối (phải ghi lý do)
  Action: Notification → Phòng TD + Trưởng PB
  Note: Terminal state — yêu cầu đóng

APPROVED → PLANNING
  Khi: Phòng TD bắt đầu lập kế hoạch
  Auto-transition: Ngay khi Phòng TD tạo RecruitmentPlan

PLANNING → PLAN_PENDING_APPROVAL
  Khi: Phòng TD gửi kế hoạch chờ Sếp duyệt
  Validate: Có kế hoạch tổng thể + kế hoạch triển khai đầy đủ
  Action: Notification → Admin/Boss

PLAN_PENDING_APPROVAL → ACTIVE
  Khi: Sếp phê duyệt kế hoạch
  Action: Unlock recruitment activities
  Note: Từ đây Phòng TD mới được đăng tin, thu CV, lên lịch PV

PLAN_PENDING_APPROVAL → PLANNING
  Khi: Sếp yêu cầu chỉnh sửa kế hoạch (có ghi chú)
  Action: Notification → Phòng TD

ACTIVE → INTERVIEWING
  Khi: Phòng TD lên lịch phỏng vấn cho ứng viên đầu tiên
  Action: Gửi thư mời phỏng vấn → Ứng viên + Trưởng PB/Boss

INTERVIEWING → DECISION_PENDING
  Khi: Phỏng vấn hoàn tất, kết quả được ghi nhận
  Action: Notification → Admin/Boss chờ quyết định

DECISION_PENDING → HIRED
  Khi: Boss phê duyệt tuyển dụng
  Action: Phòng TD gửi Offer Letter (email tự động)

DECISION_PENDING → NOT_HIRED
  Khi: Boss từ chối tuyển dụng
  Action: Phòng TD gửi thư từ chối kèm lý do (email tự động)

HIRED → COMPLETED
  Khi: Ứng viên xác nhận nhận việc, chiến dịch đóng

NOT_HIRED → ACTIVE
  Khi: Phòng TD tiếp tục tìm ứng viên khác cho vị trí
```

---

## 3. Entity: RecruitmentPlan

Kế hoạch tuyển dụng gồm 2 phần:

### 3.1 Kế hoạch tổng thể (OverallPlan)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `requestId` | UUID | FK → RecruitmentRequest |
| `startDate` | Date | Ngày bắt đầu chiến dịch |
| `endDate` | Date | Ngày kết thúc chiến dịch |
| `status` | PlanStatus | DRAFT / PENDING_APPROVAL / APPROVED / REVISION_REQUIRED |
| `approvedBy` | UUID | FK → User (Boss) |
| `approvedAt` | DateTime | Thời điểm phê duyệt |
| `notes` | Text | Ghi chú từ Boss (nếu yêu cầu chỉnh sửa) |

### 3.2 Kế hoạch triển khai (TaskPlan)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `overallPlanId` | UUID | FK → OverallPlan |
| `taskType` | TaskType | JOB_POSTING / CV_COLLECTION / CV_SCREENING / INTERVIEW_COORDINATION |
| `assignedTo` | UUID | FK → User (nhân viên HR được phân công) |
| `startDate` | Date | Ngày bắt đầu task |
| `endDate` | Date | Ngày hoàn thành dự kiến |
| `status` | TaskStatus | PENDING / IN_PROGRESS / COMPLETED |
| `notes` | Text | Ghi chú chi tiết |

---

## 4. Entity: Interview

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `requestId` | UUID | FK → RecruitmentRequest |
| `candidateId` | UUID | FK → CandidateProfile |
| `scheduledAt` | DateTime | Thời gian phỏng vấn |
| `duration` | Integer | Thời lượng (phút) |
| `location` | String | Địa điểm / link online |
| `interviewers` | UUID[] | Danh sách người phỏng vấn |
| `status` | InterviewStatus | SCHEDULED / COMPLETED / CANCELLED / RESCHEDULED |
| `result` | InterviewResult | PASS / FAIL / PENDING |
| `notes` | Text | Ghi chú đánh giá |

---

## 5. Notification Triggers

| Event | Recipients | Channel |
|-------|-----------|---------|
| Request created | Phòng Tuyển Dụng | In-app + Email |
| Request forwarded to Boss | Admin/Boss | In-app + Email |
| Request approved by Boss | Trưởng PB + Phòng TD | In-app + Email |
| Request rejected by Boss | Trưởng PB + Phòng TD | In-app + Email |
| Plan submitted for approval | Admin/Boss | In-app + Email |
| Plan approved | Phòng TD + Trưởng PB | In-app |
| Plan revision required | Phòng TD | In-app + Email |
| Interview scheduled | Ứng viên + Trưởng PB + Boss (nếu tham gia) | Email |
| Interview result recorded | Admin/Boss | In-app |
| Offer Letter sent | Ứng viên | Email |
| Rejection Letter sent | Ứng viên | Email |

---

## 6. Tracking Dashboard

### Trưởng Phòng Ban Dashboard

Trưởng phòng ban truy cập dashboard để theo dõi:
- **Trạng thái yêu cầu hiện tại**: Ai đang xử lý, bước nào
- **Số lượng đã tuyển**: X/Y vị trí đã có ứng viên được chọn
- **Timeline**: Kế hoạch vs thực tế
- **Log chi tiết**: Lịch sử mọi thao tác từ khi gửi yêu cầu

### Admin/Boss Dashboard

- **Hàng chờ phê duyệt**: Danh sách yêu cầu + kế hoạch chờ duyệt
- **Tổng quan chiến dịch**: Tất cả chiến dịch tuyển dụng đang diễn ra
- **Thống kê năm**: Biểu đồ tuyển dụng theo phòng ban, thời gian, chi phí
- **Quyết định nhanh**: Quick approve/reject trực tiếp từ dashboard

---

*Last updated: 2026-05-28*
