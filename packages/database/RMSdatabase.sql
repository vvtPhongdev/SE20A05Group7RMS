-- RMSdatabase.sql
-- DDL cho Microsoft SQL Server (T-SQL)

/* Ghi chú nâng cấp:
 - Tạo database nếu chưa tồn tại.
 - Tạo bảng trước, sau đó thêm ràng buộc khóa ngoại với tên rõ ràng.
 - Sử dụng NVARCHAR(MAX) cho JSON text và ISJSON() để kiểm tra.
 - GHID: nếu cần chạy lại, chỉ cần dùng `sqlcmd -i`.
*/

IF DB_ID(N'RMSdatabase') IS NULL
BEGIN
    CREATE DATABASE RMSdatabase;
END
GO

USE RMSdatabase;
GO

-- Nếu bảng đã tồn tại, xóa theo thứ tự đảo ngược phụ thuộc
DROP TABLE IF EXISTS llm_outputs;
DROP TABLE IF EXISTS jobs_meta;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS audit_trail;
DROP TABLE IF EXISTS gap_labels;
DROP TABLE IF EXISTS evaluation_runs;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS evidence;
DROP TABLE IF EXISTS candidate_skills;
DROP TABLE IF EXISTS resumes;
DROP TABLE IF EXISTS candidates;
DROP TABLE IF EXISTS position_skills;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS positions;
DROP TABLE IF EXISTS request_audit;
DROP TABLE IF EXISTS recruitment_requests;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
GO

SET NOCOUNT ON;
GO

-- Roles
CREATE TABLE roles (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(64) NOT NULL UNIQUE,
  permissions NVARCHAR(MAX),
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

-- Users
CREATE TABLE users (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  email NVARCHAR(255) NOT NULL UNIQUE,
  password_hash NVARCHAR(MAX),
  role_id INT NOT NULL,
  full_name NVARCHAR(255),
  phone NVARCHAR(50),
  status NVARCHAR(32) NOT NULL DEFAULT 'active',
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  last_login DATETIMEOFFSET NULL
);
GO

-- Departments
CREATE TABLE departments (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(255) NOT NULL UNIQUE,
  code NVARCHAR(64),
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

-- Recruitment requests (Yêu Cầu Tuyển Dụng)
CREATE TABLE recruitment_requests (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  department_id INT NULL,
  title NVARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  priority NVARCHAR(32),
  reason NVARCHAR(MAX),
  jd_draft NVARCHAR(MAX),
  created_by BIGINT NULL,
  status NVARCHAR(32) NOT NULL DEFAULT 'pending',
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

-- Request audit trail
CREATE TABLE request_audit (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  request_id BIGINT NOT NULL,
  action NVARCHAR(64) NOT NULL,
  actor_id BIGINT NULL,
  notes NVARCHAR(MAX),
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

-- Job posts / positions
CREATE TABLE positions (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  request_id BIGINT NULL,
  title NVARCHAR(255) NOT NULL,
  description NVARCHAR(MAX),
  level NVARCHAR(64),
  employment_type NVARCHAR(64),
  location NVARCHAR(255),
  posted_by BIGINT NULL,
  status NVARCHAR(32) NOT NULL DEFAULT 'draft',
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

-- Skills master
CREATE TABLE skills (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(255) NOT NULL UNIQUE,
  category NVARCHAR(128),
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

-- Position <-> Skill
CREATE TABLE position_skills (
  position_id BIGINT NOT NULL,
  skill_id INT NOT NULL,
  importance SMALLINT NOT NULL DEFAULT 1,
  CONSTRAINT PK_position_skills PRIMARY KEY (position_id, skill_id)
);
GO

-- Candidates
CREATE TABLE candidates (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  user_id BIGINT NULL,
  full_name NVARCHAR(255) NOT NULL,
  email NVARCHAR(255),
  phone NVARCHAR(50),
  summary NVARCHAR(MAX),
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

-- Resumes metadata
CREATE TABLE resumes (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  candidate_id BIGINT NOT NULL,
  file_path NVARCHAR(2000),
  file_name NVARCHAR(255),
  file_type NVARCHAR(32),
  file_size BIGINT,
  checksum NVARCHAR(128),
  parsed_json NVARCHAR(MAX),
  parsed_at DATETIMEOFFSET NULL,
  uploaded_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO
CREATE INDEX idx_resumes_checksum ON resumes(checksum);
GO

-- Candidate <-> Skill (evidence)
CREATE TABLE candidate_skills (
  candidate_id BIGINT NOT NULL,
  skill_id INT NOT NULL,
  evidence NVARCHAR(MAX),
  confidence DECIMAL(7,4),
  CONSTRAINT PK_candidate_skills PRIMARY KEY (candidate_id, skill_id)
);
GO

-- Evidence table (extracted snippets, references to resume)
CREATE TABLE evidence (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  candidate_id BIGINT NOT NULL,
  resume_id BIGINT NULL,
  section_ref NVARCHAR(255),
  snippet NVARCHAR(MAX),
  source NVARCHAR(MAX),
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

-- Applications
CREATE TABLE applications (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  candidate_id BIGINT NOT NULL,
  position_id BIGINT NOT NULL,
  resume_id BIGINT NULL,
  status NVARCHAR(32) NOT NULL DEFAULT 'applied',
  applied_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

-- Evaluation runs (immutable snapshots)
CREATE TABLE evaluation_runs (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  application_id BIGINT NOT NULL,
  evaluator_id BIGINT NULL,
  snapshot NVARCHAR(MAX) NOT NULL,
  labels NVARCHAR(MAX),
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

-- Gaps / labels master
CREATE TABLE gap_labels (
  id INT IDENTITY(1,1) PRIMARY KEY,
  code NVARCHAR(64) UNIQUE,
  name NVARCHAR(255),
  description NVARCHAR(MAX)
);
GO

-- Audit trail general-purpose
CREATE TABLE audit_trail (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  entity_type NVARCHAR(64) NOT NULL,
  entity_id BIGINT NULL,
  action NVARCHAR(128) NOT NULL,
  user_id BIGINT NULL,
  notes NVARCHAR(MAX),
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

-- Notifications
CREATE TABLE notifications (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  user_id BIGINT NOT NULL,
  type NVARCHAR(128),
  payload NVARCHAR(MAX),
  read_flag BIT NOT NULL DEFAULT 0,
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

-- Job queue metadata (for observability alongside BullMQ/Redis)
CREATE TABLE jobs_meta (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  job_type NVARCHAR(128),
  external_job_id NVARCHAR(255),
  status NVARCHAR(32),
  payload NVARCHAR(MAX),
  attempt INT NOT NULL DEFAULT 0,
  last_error NVARCHAR(MAX),
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  finished_at DATETIMEOFFSET NULL
);
GO

-- LLM outputs storage + validation flag
CREATE TABLE llm_outputs (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  job_meta_id BIGINT NULL,
  raw_output NVARCHAR(MAX),
  schema_valid BIT NOT NULL DEFAULT 0,
  validated_output NVARCHAR(MAX),
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
GO

-- Foreign key constraints
ALTER TABLE users
  ADD CONSTRAINT FK_users_roles FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE NO ACTION;
GO

ALTER TABLE recruitment_requests
  ADD CONSTRAINT FK_recruitment_requests_departments FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
GO
ALTER TABLE recruitment_requests
  ADD CONSTRAINT FK_recruitment_requests_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
GO

ALTER TABLE request_audit
  ADD CONSTRAINT FK_request_audit_request FOREIGN KEY (request_id) REFERENCES recruitment_requests(id) ON DELETE CASCADE;
GO
ALTER TABLE request_audit
  ADD CONSTRAINT FK_request_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL;
GO

ALTER TABLE positions
  ADD CONSTRAINT FK_positions_request FOREIGN KEY (request_id) REFERENCES recruitment_requests(id) ON DELETE SET NULL;
GO
ALTER TABLE positions
  ADD CONSTRAINT FK_positions_posted_by FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE SET NULL;
GO

ALTER TABLE position_skills
  ADD CONSTRAINT FK_position_skills_position FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE;
GO
ALTER TABLE position_skills
  ADD CONSTRAINT FK_position_skills_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE;
GO

ALTER TABLE candidates
  ADD CONSTRAINT FK_candidates_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
GO

ALTER TABLE resumes
  ADD CONSTRAINT FK_resumes_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
GO
ALTER TABLE resumes
  ADD CONSTRAINT CK_resumes_parsed_json_valid CHECK (parsed_json IS NULL OR ISJSON(parsed_json) = 1);
GO

ALTER TABLE candidate_skills
  ADD CONSTRAINT FK_candidate_skills_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
GO
ALTER TABLE candidate_skills
  ADD CONSTRAINT FK_candidate_skills_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE;
GO

ALTER TABLE evidence
  ADD CONSTRAINT FK_evidence_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
GO
ALTER TABLE evidence
  ADD CONSTRAINT FK_evidence_resume FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL;
GO

ALTER TABLE applications
  ADD CONSTRAINT FK_applications_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
GO
ALTER TABLE applications
  ADD CONSTRAINT FK_applications_position FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE;
GO
ALTER TABLE applications
  ADD CONSTRAINT FK_applications_resume FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL;
GO

ALTER TABLE evaluation_runs
  ADD CONSTRAINT FK_evaluation_runs_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE;
GO
ALTER TABLE evaluation_runs
  ADD CONSTRAINT FK_evaluation_runs_evaluator FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE SET NULL;
GO

ALTER TABLE audit_trail
  ADD CONSTRAINT FK_audit_trail_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
GO

ALTER TABLE notifications
  ADD CONSTRAINT FK_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
GO

ALTER TABLE llm_outputs
  ADD CONSTRAINT FK_llm_outputs_job_meta FOREIGN KEY (job_meta_id) REFERENCES jobs_meta(id) ON DELETE SET NULL;
GO

-- Useful indexes
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_positions_status ON positions(status);
CREATE INDEX idx_applications_status ON applications(status);
GO

-- Notes:
-- - File storage (resumes.file_path) should point to object storage (S3/MinIO/Azure Blob).
-- - Evaluation snapshots are stored as JSON text and should be treated as immutable (no UPDATE).
-- - Consider adding full-text indexes (CONTAINSTABLE/FREETEXT) or external search (Elastic, Cognitive Search)
--   and vector search capability alongside this schema.
GO

