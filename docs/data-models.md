# Data Models

## Entity Relationship Overview

```
Organization 1──N Department
Department   1──N User
User         1──N RecruitmentRequest (createdBy)
RecruitmentRequest 1──1 OverallPlan
OverallPlan  1──N TaskPlan
RecruitmentRequest 1──N Interview
Interview    N──1 CandidateProfile
CandidateProfile 1──1 CvDocument
CvDocument   1──N CvEmbedding
RecruitmentRequest 1──N RequestLog
```

## Core Entities

### User

| Field          | Type     | Notes                                            |
| -------------- | -------- | ------------------------------------------------ |
| id             | UUID     | PK                                               |
| email          | String   | Unique                                           |
| passwordHash   | String   |                                                  |
| fullName       | String   |                                                  |
| role           | UserRole | ADMIN / DEPARTMENT_HEAD / HR_MANAGER / CANDIDATE |
| organizationId | UUID     | FK → Organization                                |
| departmentId   | UUID     | FK → Department (nullable)                       |
| phone          | String   | Nullable                                         |
| isActive       | Boolean  | Default true                                     |

### RecruitmentRequest

| Field             | Type                     | Notes                    |
| ----------------- | ------------------------ | ------------------------ |
| id                | UUID                     | PK                       |
| departmentId      | UUID                     | FK → Department          |
| createdBy         | UUID                     | FK → User (Trưởng PB)    |
| position          | String                   | Vị trí tuyển dụng        |
| headcount         | Integer                  | Số lượng, min 1          |
| jobDescription    | Text                     | Mô tả công việc          |
| skillRequirements | JSONB                    | Yêu cầu kỹ năng          |
| justification     | Text                     | Lý do tuyển dụng         |
| urgency           | Urgency                  | LOW/MEDIUM/HIGH/CRITICAL |
| status            | RecruitmentRequestStatus | Default DRAFT            |
| reviewedBy        | UUID                     | FK → User (HR)           |
| approvedBy        | UUID                     | FK → User (Boss)         |
| rejectionReason   | Text                     | Nullable                 |

### OverallPlan

| Field         | Type       | Notes                                             |
| ------------- | ---------- | ------------------------------------------------- |
| id            | UUID       | PK                                                |
| requestId     | UUID       | FK → RecruitmentRequest, unique                   |
| startDate     | Date       | Ngày bắt đầu chiến dịch                           |
| endDate       | Date       | Ngày kết thúc                                     |
| status        | PlanStatus | DRAFT/PENDING_APPROVAL/APPROVED/REVISION_REQUIRED |
| approvedBy    | UUID       | FK → User (Boss)                                  |
| revisionNotes | Text       | Ghi chú chỉnh sửa                                 |
| createdBy     | UUID       | FK → User (HR Manager)                            |

### TaskPlan

| Field         | Type       | Notes                                                         |
| ------------- | ---------- | ------------------------------------------------------------- |
| id            | UUID       | PK                                                            |
| overallPlanId | UUID       | FK → OverallPlan                                              |
| taskType      | TaskType   | JOB_POSTING/CV_COLLECTION/CV_SCREENING/INTERVIEW_COORDINATION |
| assignedTo    | UUID       | FK → User (HR staff)                                          |
| startDate     | Date       |                                                               |
| endDate       | Date       |                                                               |
| status        | TaskStatus | PENDING/IN_PROGRESS/COMPLETED                                 |

### Interview

| Field        | Type            | Notes                                     |
| ------------ | --------------- | ----------------------------------------- |
| id           | UUID            | PK                                        |
| requestId    | UUID            | FK → RecruitmentRequest                   |
| candidateId  | UUID            | FK → CandidateProfile                     |
| scheduledAt  | DateTime        | Thời gian phỏng vấn                       |
| duration     | Integer         | Minutes                                   |
| location     | String          | Địa điểm / meeting URL                    |
| interviewers | UUID[]          | Danh sách người PV                        |
| status       | InterviewStatus | SCHEDULED/COMPLETED/CANCELLED/RESCHEDULED |
| result       | InterviewResult | PENDING/PASS/FAIL                         |
| notes        | Text            | Đánh giá                                  |

### CandidateProfile

| Field          | Type   | Notes                         |
| -------------- | ------ | ----------------------------- |
| id             | UUID   | PK                            |
| userId         | UUID   | FK → User (CANDIDATE), unique |
| fullName       | String |                               |
| email          | String |                               |
| phone          | String | Nullable                      |
| summary        | Text   |                               |
| structuredData | JSONB  | Parsed CV data                |

### CvDocument

| Field       | Type     | Notes                 |
| ----------- | -------- | --------------------- |
| id          | UUID     | PK                    |
| candidateId | UUID     | FK → CandidateProfile |
| fileName    | String   |                       |
| fileType    | String   | PDF/DOCX              |
| filePath    | String   |                       |
| rawText     | Text     | Extracted text        |
| parsedAt    | DateTime | Set after parsing     |

### CvEmbedding

| Field        | Type        | Notes           |
| ------------ | ----------- | --------------- |
| id           | UUID        | PK              |
| cvDocumentId | UUID        | FK → CvDocument |
| chunkIndex   | Integer     |                 |
| chunkText    | Text        |                 |
| embedding    | vector(384) | pgvector        |

### RequestLog

| Field       | Type   | Notes                               |
| ----------- | ------ | ----------------------------------- |
| id          | UUID   | PK                                  |
| requestId   | UUID   | FK → RecruitmentRequest             |
| action      | String | STATUS_CHANGE, PLAN_SUBMITTED, etc. |
| fromStatus  | String | Nullable                            |
| toStatus    | String | Nullable                            |
| performedBy | UUID   | FK → User                           |
| metadata    | JSONB  | Context data                        |

### Notification

| Field             | Type             | Notes                 |
| ----------------- | ---------------- | --------------------- |
| id                | UUID             | PK                    |
| userId            | UUID             | FK → User (recipient) |
| type              | NotificationType |                       |
| title             | String           |                       |
| body              | Text             |                       |
| isRead            | Boolean          | Default false         |
| relatedEntityId   | UUID             |                       |
| relatedEntityType | String           |                       |

## Enums

```typescript
enum UserRole {
  ADMIN,
  DEPARTMENT_HEAD,
  HR_MANAGER,
  CANDIDATE,
}
enum RecruitmentRequestStatus {
  DRAFT,
  PENDING_HR_REVIEW,
  PENDING_BOSS_APPROVAL,
  APPROVED,
  REJECTED,
  PLANNING,
  PLAN_PENDING_APPROVAL,
  ACTIVE,
  INTERVIEWING,
  DECISION_PENDING,
  HIRED,
  NOT_HIRED,
  COMPLETED,
}
enum PlanStatus {
  DRAFT,
  PENDING_APPROVAL,
  APPROVED,
  REVISION_REQUIRED,
}
enum TaskType {
  JOB_POSTING,
  CV_COLLECTION,
  CV_SCREENING,
  INTERVIEW_COORDINATION,
}
enum TaskStatus {
  PENDING,
  IN_PROGRESS,
  COMPLETED,
}
enum InterviewStatus {
  SCHEDULED,
  COMPLETED,
  CANCELLED,
  RESCHEDULED,
}
enum InterviewResult {
  PENDING,
  PASS,
  FAIL,
}
enum Urgency {
  LOW,
  MEDIUM,
  HIGH,
  CRITICAL,
}
enum NotificationType {
  REQUEST_UPDATE,
  INTERVIEW_INVITE,
  OFFER,
  REJECTION,
  PLAN_UPDATE,
  SYSTEM,
}
```
