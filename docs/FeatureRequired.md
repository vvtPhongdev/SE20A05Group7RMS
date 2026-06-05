# 4. Features

> **Pivot note:** This section replaces the original 26 marketplace-era feature requirements (FR-1 through FR-31) with 22 RMS workflow features organized by domain.

---

## 4.0 Enterprise Organization and Approval Workflow

### FR-01: Create Organization and Department Structure
**Actor:** Admin  
**Description:** Admin creates organizational hierarchy — Organization → Departments. Each department has a designated Department Head.  
**Acceptance:** Departments are created with unique names and assigned heads. Department Head assignment is validated against UserRole.

### FR-02: Submit Recruitment Request
**Actor:** Department Head  
**Description:** Department Head creates a structured recruitment request specifying position title, headcount, job description (JD), skill requirements, and justification. Request starts in `DRAFT` status and transitions to `PENDING_REVIEW` on submission.  
**Acceptance:** Request saved with all required fields. Status transitions logged in RequestLog. HR Manager notified of new request.

### FR-03: Approve / Reject Recruitment Request
**Actor:** Admin  
**Description:** Admin reviews recruitment requests forwarded by HR Manager. Can approve (→ `APPROVED`), reject with mandatory reason (→ `REJECTED`), or request revision. Rejection reasons are stored and visible to the submitting Department Head.  
**Acceptance:** Status transition enforced. Rejection requires non-empty reason. All parties notified of decision.

---

## 4.1 Recruitment Planning

### FR-04: Create Overall Plan (Campaign Timeline)
**Actor:** HR Manager  
**Description:** After request approval, HR Manager creates an Overall Plan defining the recruitment campaign timeline (start date, end date). This is the top-level planning artifact.  
**Acceptance:** Plan linked to approved request. Date validation enforced. Plan enters `PENDING_APPROVAL` status.

### FR-05: Create Task Plans (Detailed Assignments)
**Actor:** HR Manager  
**Description:** Within an Overall Plan, HR Manager creates Task Plans assigning specific responsibilities: who posts job listings, who screens CVs, who coordinates interviews, with individual deadlines.  
**Acceptance:** Each task has assignee, description, deadline. Tasks must fall within Overall Plan timeline. Assignees notified.

### FR-06: Approve / Reject Plan
**Actor:** Admin  
**Description:** Admin reviews and approves/rejects the Overall Plan and its Task Plans before any recruitment activity begins.  
**Acceptance:** Approved plan unlocks downstream activities. Rejection requires reason and triggers revision cycle.

### FR-07: Enforce Plan-Locked Execution
**Actor:** System (enforced at service layer)  
**Description:** **CRITICAL RULE** — No recruitment activity (CV screening, interview scheduling, job posting) can proceed unless: (1) RecruitmentRequest is `APPROVED`, (2) OverallPlan exists and is approved, (3) TaskPlan assignments exist for the specific activity.  
**Acceptance:** Service layer rejects any action where plan preconditions are not met. Error message specifies which precondition failed.

---

## 4.2 Candidate Management & CV Intake

### FR-08: Candidate Upload CV
**Actor:** Candidate  
**Description:** Candidate uploads CV document (PDF/DOCX) through standardized form. System stores the document and initiates async processing.  
**Acceptance:** File accepted (PDF/DOCX only, max size enforced). Upload status visible to candidate. BullMQ job enqueued for parsing.

### FR-09: Parse CV and Extract Structured Data
**Actor:** System (BullMQ Worker)  
**Description:** Worker service parses uploaded CV, extracting structured data: personal info, skills, work experience, education. Parsed data stored in CandidateProfile.  
**Acceptance:** Parsing result stored. Failure triggers retry or manual review flag. Candidate notified of processing status.

### FR-10: Generate CV Vector Embeddings
**Actor:** System (BullMQ Worker)  
**Description:** After successful parsing, worker generates 384-dimension vector embeddings using `all-MiniLM-L6-v2` via `@xenova/transformers`. Embeddings stored in pgvector column via raw SQL.  
**Acceptance:** Embedding generated and stored. No external API calls. Processing is local-only.

### FR-11: Semantic CV Search (Vector Search)
**Actor:** HR Manager  
**Description:** HR Manager searches candidate pool using natural language queries. System performs cosine similarity search against CV embeddings to find semantically matching candidates.  
**Acceptance:** Search returns ranked candidates with similarity scores. Results include parsed profile summary. Search is plan-locked (requires active campaign).

---

## 4.3 Interview Management

### FR-12: Schedule Interview with Availability Check
**Actor:** HR Manager  
**Description:** HR Manager schedules interviews, with system cross-referencing interviewer availability (Department Head, Admin) to suggest conflict-free time slots.  
**Acceptance:** Schedule validated against interviewer calendars. Conflict warnings displayed. Interview record created with status.

### FR-13: Send Interview Invitations
**Actor:** System (triggered by HR Manager)  
**Description:** System sends email invitations to: (1) Candidate with interview details, (2) Department Head as panel member, (3) Admin if required for senior positions.  
**Acceptance:** Emails sent with correct schedule details. Email delivery logged in EmailLog.

### FR-14: Record Interview Results
**Actor:** HR Manager (with input from interview panel)  
**Description:** After interview, HR Manager records results: PASS or FAIL, with detailed notes from each panel member. Results linked to the specific interview record.  
**Acceptance:** Result stored with mandatory notes. Status visible to all relevant actors. Request status updated.

### FR-15: Final Hiring Decision by Admin
**Actor:** Admin  
**Description:** Admin reviews interview results and panel notes to make final hiring decision: approve hire (triggers offer) or reject (triggers rejection communication).  
**Acceptance:** Decision logged with timestamp. Appropriate communication triggered automatically.

---

## 4.4 Communications

### FR-16: Interview Invitation Emails
**Actor:** System  
**Description:** Automated email sent to candidates and interviewers with schedule details, location/link, and preparation instructions.  
**Acceptance:** Email contains all required details. Delivery tracked in EmailLog.

### FR-17: Offer Letter Generation
**Actor:** HR Manager (triggered, reviewed before send)  
**Description:** System generates offer letter template with position details and compensation information. HR Manager reviews and triggers send.  
**Acceptance:** Offer contains correct position and compensation details. Candidate notified. Request status → `OFFER_EXTENDED`.

### FR-18: Rejection Email with Reasons
**Actor:** System (triggered by HR Manager)  
**Description:** Professional rejection email sent to unsuccessful candidates with specific, constructive reasons. This builds employer brand.  
**Acceptance:** Email is professional and includes specific feedback. Delivery logged.

### FR-19: In-App Notification for Status Changes
**Actor:** System  
**Description:** Real-time in-app notifications sent to relevant actors when recruitment request status changes (e.g., request approved, interview scheduled, offer accepted).  
**Acceptance:** Notifications delivered to correct actors. Notification history viewable.

---

## 4.5 Tracking & Reporting

### FR-20: Real-Time Request Status Tracking
**Actor:** Department Head, HR Manager  
**Description:** Dashboard showing real-time status of all recruitment requests. Department Head sees own requests. HR Manager sees all active campaigns.  
**Acceptance:** Status is current (within 30s). Shows who is handling, current stage, positions filled vs. target.

### FR-21: Annual Recruitment Report
**Actor:** Admin  
**Description:** Comprehensive annual report showing: positions opened vs. filled, time-to-hire metrics, department-wise statistics, HR team performance indicators.  
**Acceptance:** Report covers configurable date range. Data accurate against RequestLog. Exportable format.

### FR-22: Department-Wise Statistics Dashboard
**Actor:** Admin  
**Description:** Dashboard showing recruitment statistics broken down by department: active requests, fill rate, average time-to-hire, pending approvals.  
**Acceptance:** Data updated in near real-time. Filterable by date range and department.
