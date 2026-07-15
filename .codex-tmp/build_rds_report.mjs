import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const templatePath = 'docs/Report/Template2_RDS Document.docx';
const outPath = 'docs/Report/Bao_Cao_RDS_RMS.docx';

const templateBytes = fs.readFileSync(templatePath);
const zip = await JSZip.loadAsync(templateBytes);
const originalDocumentXml = await zip.file('word/document.xml').async('text');
const sectPrMatch = originalDocumentXml.match(/<w:sectPr[\s\S]*<\/w:sectPr>/);
const sectPr = sectPrMatch
  ? sectPrMatch[0]
  : '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>';

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function attrs(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => `${k}="${esc(v)}"`)
    .join(' ');
}

function run(text, options = {}) {
  const {
    bold,
    italic,
    color = '000000',
    size = 22,
    font = 'Arial',
    allCaps,
    preserve = true,
  } = options;
  const space = preserve ? ' xml:space="preserve"' : '';
  return `<w:r><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}"/>${bold ? '<w:b/><w:bCs/>' : ''}${italic ? '<w:i/><w:iCs/>' : ''}${allCaps ? '<w:caps/>' : ''}<w:color w:val="${color}"/><w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr><w:t${space}>${esc(text)}</w:t></w:r>`;
}

function para(text = '', options = {}) {
  const {
    style,
    align,
    before = 0,
    after = 120,
    line = 276,
    indentLeft,
    hanging,
    keepNext,
    pageBreakBefore,
    bold,
    italic,
    color,
    size,
    font,
    allCaps,
  } = options;
  const pPr = [
    style ? `<w:pStyle w:val="${style}"/>` : '',
    keepNext ? '<w:keepNext/>' : '',
    pageBreakBefore ? '<w:pageBreakBefore/>' : '',
    align ? `<w:jc w:val="${align}"/>` : '',
    `<w:spacing w:before="${before}" w:after="${after}" w:line="${line}" w:lineRule="auto"/>`,
    indentLeft ? `<w:ind w:left="${indentLeft}"${hanging ? ` w:hanging="${hanging}"` : ''}/>` : '',
  ].join('');
  return `<w:p><w:pPr>${pPr}</w:pPr>${run(text, { bold, italic, color, size, font, allCaps })}</w:p>`;
}

function heading(level, text, options = {}) {
  const config = {
    1: { size: 32, color: '1F4E79', before: 360, after: 180, allCaps: false },
    2: { size: 26, color: '1F4E79', before: 260, after: 120, allCaps: false },
    3: { size: 23, color: '333333', before: 180, after: 90, allCaps: false },
  }[level];
  return para(text, {
    keepNext: true,
    bold: true,
    ...config,
    ...options,
  });
}

function bullet(text, level = 0) {
  return para(text, { indentLeft: 720 + level * 360, hanging: 240, after: 80, size: 21 });
}

function numbered(text, index, level = 0) {
  return para(`${index}. ${text}`, { indentLeft: 720 + level * 360, hanging: 360, after: 80, size: 21 });
}

function pageBreak() {
  return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
}

function cell(content, width, options = {}) {
  const { fill, bold, align = 'left', valign = 'center', size = 20, color = '000000' } = options;
  const paragraphs = Array.isArray(content) ? content : [content];
  const inner = paragraphs
    .map((item) =>
      typeof item === 'string'
        ? para(item, { after: 40, line: 240, bold, align, size, color })
        : item,
    )
    .join('');
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${fill ? `<w:shd w:fill="${fill}"/>` : ''}<w:vAlign w:val="${valign}"/><w:tcMar><w:top w:w="90" w:type="dxa"/><w:left w:w="110" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:right w:w="110" w:type="dxa"/></w:tcMar></w:tcPr>${inner}</w:tc>`;
}

function table(headers, rows, widths, options = {}) {
  const tableWidth = widths.reduce((sum, w) => sum + w, 0);
  const borders = '<w:tblBorders><w:top w:val="single" w:sz="4" w:color="B7C9D6"/><w:left w:val="single" w:sz="4" w:color="B7C9D6"/><w:bottom w:val="single" w:sz="4" w:color="B7C9D6"/><w:right w:val="single" w:sz="4" w:color="B7C9D6"/><w:insideH w:val="single" w:sz="4" w:color="D9E2EA"/><w:insideV w:val="single" w:sz="4" w:color="D9E2EA"/></w:tblBorders>';
  const grid = `<w:tblGrid>${widths.map((w) => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>`;
  const headerRow = `<w:tr><w:trPr><w:tblHeader/></w:trPr>${headers
    .map((h, i) => cell(h, widths[i], { fill: options.headerFill ?? '1F4E79', bold: true, color: 'FFFFFF', align: options.headerAlign ?? 'center', size: 19 }))
    .join('')}</w:tr>`;
  const bodyRows = rows
    .map(
      (row, ri) =>
        `<w:tr>${row
          .map((c, i) => cell(c, widths[i], { fill: ri % 2 === 1 ? 'F7FAFC' : undefined, size: options.size ?? 19, align: options.aligns?.[i] ?? 'left' }))
          .join('')}</w:tr>`,
    )
    .join('');
  return `<w:tbl><w:tblPr><w:tblW w:w="${tableWidth}" w:type="dxa"/><w:tblInd w:w="0" w:type="dxa"/><w:tblLayout w:type="fixed"/>${borders}<w:tblCellMar><w:top w:w="90" w:type="dxa"/><w:left w:w="110" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:right w:w="110" w:type="dxa"/></w:tblCellMar></w:tblPr>${grid}${headerRow}${bodyRows}</w:tbl>${para('', { after: 80 })}`;
}

function callout(title, body) {
  return `<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:top w:val="single" w:sz="8" w:color="70AD47"/><w:left w:val="single" w:sz="8" w:color="70AD47"/><w:bottom w:val="single" w:sz="8" w:color="70AD47"/><w:right w:val="single" w:sz="8" w:color="70AD47"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="9000"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:tcW w:w="9000" w:type="dxa"/><w:shd w:fill="EAF4E4"/><w:tcMar><w:top w:w="130" w:type="dxa"/><w:left w:w="180" w:type="dxa"/><w:bottom w:w="130" w:type="dxa"/><w:right w:w="180" w:type="dxa"/></w:tcMar></w:tcPr>${para(title, { bold: true, color: '375623', after: 40 })}${para(body, { size: 20, after: 40 })}</w:tc></w:tr></w:tbl>${para('', { after: 80 })}`;
}

const actors = [
  ['1', 'Admin', 'Quản trị hệ thống, duyệt yêu cầu/kế hoạch, ra quyết định tuyển dụng cuối cùng, xem báo cáo.'],
  ['2', 'HR', 'Điều phối tuyển dụng: review request, lập kế hoạch, phân công task, quản lý CV, phỏng vấn, offer.'],
  ['3', 'Department Head', 'Tạo nhu cầu tuyển dụng, theo dõi tiến độ, tham gia hội đồng phỏng vấn và phản hồi kết quả.'],
  ['4', 'Candidate', 'Đăng ký tài khoản, cập nhật hồ sơ, upload CV, theo dõi lịch phỏng vấn, phản hồi offer.'],
  ['5', 'System/Worker', 'Xử lý nền: parse CV, tạo embedding, gửi notification/email, nhắc deadline, ghi audit log.'],
];

const useCases = [
  ['UC-01', 'Authentication', 'Register Account', 'Candidate đăng ký tài khoản và nhận OTP xác thực email.'],
  ['UC-02', 'Authentication', 'Verify Registration Email', 'Xác minh OTP để kích hoạt tài khoản.'],
  ['UC-03', 'Authentication', 'Login / Refresh / Logout', 'Đăng nhập, cấp JWT/refresh token, xoay token và kết thúc phiên.'],
  ['UC-04', 'Organization', 'Manage Users and Departments', 'Admin quản lý user, role, organization, department và trạng thái tài khoản.'],
  ['UC-05', 'Recruitment Request', 'Create Recruitment Request', 'Department Head tạo draft request với vị trí, headcount, JD, skills, urgency.'],
  ['UC-06', 'Recruitment Request', 'Submit Recruitment Request', 'Department Head gửi request sang HR review.'],
  ['UC-07', 'Recruitment Request', 'Review and Forward Request', 'HR kiểm tra request, yêu cầu chỉnh sửa hoặc chuyển Admin duyệt.'],
  ['UC-08', 'Recruitment Request', 'Approve / Reject Request', 'Admin phê duyệt, từ chối hoặc yêu cầu thay đổi, có lưu lý do và log.'],
  ['UC-09', 'Planning', 'Create Overall Plan', 'HR lập timeline chiến dịch cho request đã duyệt.'],
  ['UC-10', 'Planning', 'Create and Assign Task Plan', 'HR phân công các task job posting, CV collection, screening, interview coordination.'],
  ['UC-11', 'Planning', 'Approve / Reject Plan', 'Admin duyệt kế hoạch trước khi mở khoá các hoạt động tuyển dụng.'],
  ['UC-12', 'Job Posting', 'Create and Publish Job Posting', 'HR tạo, cập nhật, publish/close tin tuyển dụng.'],
  ['UC-13', 'Candidate/CV', 'Upload CV', 'Candidate upload CV PDF/DOC/DOCX; hệ thống lưu file và metadata.'],
  ['UC-14', 'Candidate/CV', 'Parse CV and Generate Embedding', 'Worker trích xuất text, structured data và vector embedding.'],
  ['UC-15', 'Talent Search', 'Semantic CV Search', 'HR tìm ứng viên bằng query tự nhiên, vector/skill graph và filter theo campaign.'],
  ['UC-16', 'Interview', 'Schedule Interview', 'HR lên lịch phỏng vấn, kiểm tra conflict và yêu cầu tối thiểu hai interviewer.'],
  ['UC-17', 'Interview', 'Send Interview Invitation', 'Hệ thống gửi email/notification cho candidate và panel.'],
  ['UC-18', 'Interview', 'Record Interview Feedback', 'Panel/HR ghi điểm technical, communication, culture, notes và recommendation.'],
  ['UC-19', 'Decision', 'Make Hiring Decision', 'Admin ra quyết định HIRE/REJECT dựa trên kết quả phỏng vấn.'],
  ['UC-20', 'Offer', 'Generate and Send Offer', 'HR tạo offer letter, gửi email và candidate phản hồi accept/decline.'],
  ['UC-21', 'Notification', 'Receive Notifications', 'Người dùng nhận in-app notification/SSE và email cho sự kiện workflow.'],
  ['UC-22', 'Reporting', 'View Reports and Tracking', 'Admin/HR/Department Head xem dashboard, realtime tracking, annual/department reports.'],
];

const screens = [
  ['1', 'Public/Auth', 'Landing, Sign Up, OTP Verification, Login, Forgot/Reset Password', 'Luồng truy cập công khai và xác thực người dùng.'],
  ['2', 'Admin', 'Admin Dashboard, Approval Queue, All Requests, Users, Settings, Reports, Department Statistics', 'Quản trị hệ thống, duyệt request/plan, theo dõi chỉ số tuyển dụng.'],
  ['3', 'Department Head', 'Dashboard, Create Request, My Requests, Interviews, Interview Evaluations, Dept Settings', 'Tạo nhu cầu tuyển dụng và theo dõi/phản hồi tiến trình.'],
  ['4', 'HR', 'Dashboard, Request Queue, Campaigns, Campaign Detail, Task Planner, Talent Pool, Candidate Search, Interviews, Results, Reports, Notifications', 'Điều phối toàn bộ pipeline tuyển dụng sau khi request được gửi/duyệt.'],
  ['5', 'Candidate', 'Dashboard, Profile, Upload CV, Inbox Alerts, Interview Details', 'Quản lý hồ sơ, CV, thông báo và lịch phỏng vấn cá nhân.'],
];

const authRows = [
  ['Screen / Activity', 'Admin', 'HR', 'Department Head', 'Candidate'],
  ['Dashboard theo role', 'X', 'X', 'X', 'X'],
  ['Quản lý users/organization/department', 'X', '', '', ''],
  ['Tạo recruitment request', '', '', 'X', ''],
  ['Review/forward request', '', 'X', '', ''],
  ['Duyệt/từ chối recruitment request', 'X', 'X (theo workflow)', '', ''],
  ['Tạo overall plan/task plan', '', 'X', '', ''],
  ['Duyệt/từ chối plan', 'X', '', '', ''],
  ['Job posting/talent pool/CV search', 'X', 'X', '', ''],
  ['Upload CV cá nhân', '', '', '', 'X'],
  ['Lên lịch phỏng vấn', '', 'X', '', ''],
  ['Ghi feedback phỏng vấn', '', 'X', 'X', ''],
  ['Final hiring decision', 'X', '', '', ''],
  ['Offer letter send/review', 'X', 'X', '', 'X (respond)'],
  ['Reports/tracking', 'X', 'X', 'X (scoped)', ''],
];

const nonUi = [
  ['1', 'Auth session', 'JWT validation, refresh token rotation', 'Gateway và Identity service xác thực request, xoay refresh token và gắn user context.'],
  ['2', 'CV processing', 'CV parse/extract/embedding jobs', 'Worker xử lý PDF/DOC/DOCX, lưu raw text, structured data và vector embedding.'],
  ['3', 'Notification', 'Email and in-app notification dispatch', 'Gửi interview invitation, offer, rejection, plan/request updates và SSE notifications.'],
  ['4', 'Plan lock', 'PlanLockedGuard/service validation', 'Chặn job posting, CV screening, interview scheduling nếu chưa có approved plan/task.'],
  ['5', 'Deadline reminder', 'Task reminder scheduler', 'Nhắc HR trước deadline 24h và tại deadline, idempotent để tránh duplicate.'],
  ['6', 'Audit logging', 'RequestLog/AuditLog records', 'Lưu trạng thái trước/sau, người thực hiện, metadata phục vụ tracking và báo cáo.'],
];

const dbTables = [
  ['users', 'Identity', 'Tài khoản, role, organization, department, avatar, Google Calendar token.'],
  ['organizations', 'Identity', 'Tổ chức sử dụng hệ thống, settings chung.'],
  ['departments', 'Identity', 'Cấu trúc phòng ban, trưởng phòng, parent-child hierarchy.'],
  ['recruitment_requests', 'Recruiting', 'Nhu cầu tuyển dụng: position, headcount, JD, skills, urgency, lifecycle status.'],
  ['approval_records', 'Recruiting', 'Quyết định approve/reject/revision của Admin.'],
  ['request_logs', 'Recruiting', 'Timeline trạng thái request phục vụ realtime tracking.'],
  ['overall_plans', 'Recruiting', 'Kế hoạch tổng thể theo request, timeline và trạng thái duyệt.'],
  ['task_plans', 'Recruiting', 'Task triển khai trong campaign: job posting, CV collection, screening, interview coordination.'],
  ['task_reminders', 'Recruiting/Notification', 'Lịch nhắc deadline cho task chưa hoàn thành.'],
  ['job_postings', 'Recruiting', 'Tin tuyển dụng public/private, trạng thái draft/published/closed.'],
  ['candidate_profiles', 'Profiles/CV', 'Hồ sơ ứng viên, structured CV data.'],
  ['candidate_cvs', 'Profiles/CV', 'File CV, raw text, processing status, screening status.'],
  ['cv_embeddings', 'Profiles/CV', 'Chunk text và vector embedding 384 chiều trong pgvector.'],
  ['applications', 'Recruiting', 'Ứng tuyển của candidate theo request/campaign.'],
  ['interview_schedules', 'Interview', 'Lịch phỏng vấn, candidate, panel, trạng thái và recommendation.'],
  ['interview_results', 'Interview', 'Feedback/điểm của evaluator theo interview.'],
  ['offer_letters', 'Recruiting/Notification', 'Offer generated/sent/responded, compensation và start date.'],
  ['notifications', 'Notification', 'Thông báo trong app cho người dùng.'],
  ['email_logs', 'Notification', 'Log email gửi đi, trạng thái sent/failed.'],
  ['audit_logs', 'Cross-cutting', 'Audit chung cho plan/task/interview/CV events.'],
];

const packageRows = [
  ['webapp', 'React 19 + Vite SPA', 'Giao diện người dùng theo role, routing, dashboard, forms, tables.'],
  ['services/gateway', 'NestJS HTTP Gateway', 'Global prefix /api/v1, auth/role guard, Swagger, proxy TCP tới services.'],
  ['services/identity', 'NestJS TCP service', 'Auth, users, organizations, departments, role management.'],
  ['services/recruiting', 'NestJS TCP service', 'Recruitment request lifecycle, plans, tasks, reports, applications, offers.'],
  ['services/interview', 'NestJS TCP service', 'Interview scheduling, reschedule/cancel, invitations, panel feedback.'],
  ['services/profiles', 'NestJS TCP service', 'Candidate profile, documents, CV metadata.'],
  ['services/cv', 'NestJS TCP service', 'CV upload/search/screening workflows.'],
  ['services/notification', 'NestJS TCP service', 'SSE notifications, email templates and delivery logs.'],
  ['services/worker', 'BullMQ worker', 'Async CV extraction, embeddings, deadline reminders.'],
  ['packages/contracts', 'Shared TypeScript package', 'Enums, Zod schemas, shared API types - single source of truth.'],
  ['packages/database', 'Prisma package', 'Schema, migrations, Prisma client, seed data.'],
  ['packages/ai', 'AI utilities', 'CV extractor, skill taxonomy, semantic/vector helpers.'],
  ['packages/config', 'Config package', 'Zod-validated environment schemas.'],
  ['packages/queue', 'Queue package', 'BullMQ queue names and job definitions.'],
  ['packages/logger/storage/ui', 'Shared packages', 'Logging, storage abstraction and shared UI primitives.'],
];

const apiRows = [
  ['Auth', 'POST /auth/register, /auth/login, /auth/refresh, /auth/logout, /auth/forgot-password, /auth/reset-password', 'Public/Auth', 'Identity'],
  ['Users/Org/Dept', 'GET/POST/PATCH /users, /organizations, /departments', 'ADMIN, HR scoped', 'Identity'],
  ['Recruitment Requests', 'GET/POST/PATCH /recruitment-requests, submit, assign, return-for-revision, forward-to-admin, decision', 'DEPARTMENT_HEAD, HR, ADMIN', 'Recruiting'],
  ['Plans/Tasks', 'POST/GET/PATCH /overall-plan, /task-plan', 'HR, ADMIN', 'Recruiting'],
  ['Job Postings', 'POST/GET/PATCH /job-postings, public listing, publish, close', 'HR, ADMIN, Public read', 'Recruiting'],
  ['Applications/CV', '/applications, /candidate-profiles, /candidate/cvs, /cv/search, /cv/:id/screen', 'Candidate, HR, ADMIN', 'Profiles/CV/Recruiting'],
  ['Interviews', '/interviews/schedules, reschedule, cancel, invitations, feedback, results', 'HR, Department Head, Admin, Candidate scoped', 'Interview'],
  ['Hiring/Offers', '/hiring-decisions/:requestId, /offers, /offers/:id/send, /offers/:id/respond', 'ADMIN, HR, Candidate', 'Recruiting/Notification'],
  ['Reports/Audit', '/reports/admin-dashboard, /reports/annual, /reports/departments, /reports/realtime-tracking, /audit-logs', 'ADMIN, HR, Department Head scoped', 'Recruiting'],
  ['Notifications', '/notifications/sse, /notifications, /notifications/:id/read, mark-all-read', 'Authenticated', 'Notification'],
];

const businessRules = [
  ['BR-01', 'Role-based Access Control', 'Mọi route nhạy cảm phải có JWT và role phù hợp. Role HR hiện được thống nhất thành một role HR_LEADER.'],
  ['BR-02', 'Request Ownership', 'Department Head chỉ tạo/cập nhật/xem request thuộc phòng ban hoặc phạm vi được phép.'],
  ['BR-03', 'Approval Chain', 'Request phải đi qua Department Head -> HR -> Admin trước khi triển khai.'],
  ['BR-04', 'Mandatory Rejection Reason', 'Từ chối request/plan/candidate phải có lý do để lưu audit và thông báo.'],
  ['BR-05', 'Plan Lock', 'Không cho job posting, CV screening, interview scheduling nếu chưa có request/overall plan/task được duyệt.'],
  ['BR-06', 'Task Timeline', 'TaskPlan phải nằm trong timeline của OverallPlan.'],
  ['BR-07', 'Interview Panel', 'Lịch phỏng vấn phải có ít nhất hai internal interviewers đang active.'],
  ['BR-08', 'Candidate Ownership', 'Candidate chỉ xem/cập nhật CV/profile/offer của chính mình.'],
  ['BR-09', 'Offer Response', 'Offer đã gửi chỉ candidate owner được accept/decline; response, note và timestamp được lưu.'],
  ['BR-10', 'Full Traceability', 'Chuyển trạng thái request/plan/task/interview/CV phải có log/audit.'],
  ['BR-11', 'No External AI Scoring', 'AI chỉ hỗ trợ parse/search; quyết định tuyển dụng do người dùng có thẩm quyền thực hiện.'],
  ['BR-12', 'Idempotent Reminder', 'Deadline reminder không được tạo duplicate cho cùng task/reminder key.'],
];

const detailedUseCases = [
  {
    title: 'UC-06 Submit Recruitment Request',
    actor: 'Department Head',
    trigger: 'Department Head bấm Submit trên một request đang DRAFT hoặc REVISION_NEEDED.',
    desc: 'Gửi nhu cầu tuyển dụng đến HR để review nghiệp vụ và tính khả thi.',
    pre: ['User đã đăng nhập với role DEPARTMENT_HEAD.', 'Request thuộc department của user.', 'Request có đủ position, headcount, JD, skills, urgency và justification.'],
    post: ['Request chuyển sang PENDING_HR_REVIEW.', 'RequestLog được tạo.', 'HR nhận notification/email nếu cấu hình sẵn.'],
    normal: ['Department Head mở My Requests.', 'Chọn request draft.', 'Kiểm tra nội dung và bấm Submit.', 'System validate completeness và ownership.', 'System cập nhật status, ghi log và gửi notification.'],
    alt: ['Nếu user chỉ lưu draft, request giữ trạng thái DRAFT.', 'Nếu request bị trả về chỉnh sửa, submit lại sau khi cập nhật nội dung.'],
    exc: ['Thiếu field bắt buộc: system trả validation error.', 'Request không thuộc quyền: system trả forbidden.', 'Request không ở trạng thái editable: system không cho submit.'],
  },
  {
    title: 'UC-08 Approve / Reject Recruitment Request',
    actor: 'Admin',
    trigger: 'Admin mở Approval Queue và chọn request chờ duyệt.',
    desc: 'Admin quyết định request có được phép lập kế hoạch tuyển dụng hay không.',
    pre: ['Admin đã đăng nhập.', 'Request đang ở PENDING_BOSS_APPROVAL hoặc trạng thái decision hợp lệ.', 'Thông tin request đủ để ra quyết định.'],
    post: ['Request được APPROVED, REJECTED hoặc REVISION_NEEDED.', 'ApprovalRecord/RequestLog được lưu.', 'Department Head và HR nhận thông báo.'],
    normal: ['Admin mở request detail.', 'Review position, headcount, urgency, justification và feedback của HR.', 'Chọn Approve hoặc Reject/Request Changes.', 'System yêu cầu reason nếu reject/revision.', 'System cập nhật trạng thái, ghi log và gửi thông báo.'],
    alt: ['Admin yêu cầu chỉnh sửa thay vì approve/reject.', 'HR bổ sung thông tin rồi forward lại.'],
    exc: ['Thiếu reason khi reject: system chặn.', 'Request không còn ở trạng thái chờ duyệt: system báo conflict.'],
  },
  {
    title: 'UC-09 Create Overall Plan',
    actor: 'HR',
    trigger: 'HR bắt đầu lập campaign cho request đã được Admin approve.',
    desc: 'Tạo kế hoạch tổng thể gồm start date, end date và các task triển khai.',
    pre: ['User có role HR.', 'RecruitmentRequest đã APPROVED.', 'Chưa có OverallPlan active cho request.'],
    post: ['OverallPlan được tạo ở PENDING_APPROVAL/DRAFT theo flow hiện hành.', 'TaskPlan có thể được thêm vào plan.', 'Request chuyển sang trạng thái planning phù hợp.'],
    normal: ['HR mở Campaign Detail.', 'Nhập timeline tổng thể.', 'Thêm TaskPlan cho job posting, CV collection, CV screening, interview coordination.', 'System validate timeline và assignee.', 'HR submit plan cho Admin duyệt.'],
    alt: ['HR lưu plan nháp trước khi submit.', 'Admin reject plan; HR chỉnh sửa và resubmit.'],
    exc: ['Task nằm ngoài timeline: system reject.', 'Assignee không active hoặc không phải HR: system reject.', 'Request chưa approved: system reject do plan-lock.'],
  },
  {
    title: 'UC-15 Semantic CV Search',
    actor: 'HR',
    trigger: 'HR nhập query tìm ứng viên trong Talent Pool/Candidate Search.',
    desc: 'Tìm ứng viên theo ngôn ngữ tự nhiên dựa trên CV embedding, skill taxonomy và filter theo campaign.',
    pre: ['HR đã đăng nhập.', 'Candidate đã upload CV và worker đã tạo embedding.', 'Campaign/request đáp ứng điều kiện plan-lock nếu search theo campaign.'],
    post: ['Danh sách ứng viên phù hợp được trả về cùng score/snapshot.', 'TalentSearchRun và feedback có thể được ghi để cải thiện truy vấn.'],
    normal: ['HR nhập query và filter.', 'System expand skills nếu cần.', 'System chạy vector/graph search.', 'System trả kết quả ranked candidate.', 'HR xem hồ sơ/CV hoặc ghi feedback.'],
    alt: ['Không có embedding: system trả kết quả rỗng hoặc fallback metadata.', 'HR điều chỉnh query/filter.'],
    exc: ['CV parse thất bại: candidate có processing error.', 'Search service/db vector unavailable: system trả lỗi phù hợp.'],
  },
  {
    title: 'UC-16 Schedule Interview',
    actor: 'HR',
    trigger: 'HR chọn candidate/application để lên lịch phỏng vấn.',
    desc: 'Tạo lịch phỏng vấn, kiểm tra conflict, panel và gửi invitation.',
    pre: ['Request/campaign đang active hoặc ở trạng thái cho phép interview.', 'Có TaskPlan interview coordination phù hợp.', 'Candidate thuộc request/application.', 'Panel có ít nhất hai internal active users.'],
    post: ['InterviewSchedule được tạo ở SCHEDULED.', 'Candidate và panel nhận invitation.', 'Request/application chuyển stage phù hợp.'],
    normal: ['HR mở Interview Schedule.', 'Chọn candidate, thời gian, duration, location/link và interviewers.', 'System kiểm tra conflict và panel.', 'System lưu schedule.', 'System gửi invitation và log email.'],
    alt: ['HR reschedule hoặc cancel với reason.', 'Candidate confirm attendance hoặc request reschedule.'],
    exc: ['Conflict thời gian: system cảnh báo/chặn.', 'Panel thiếu người: system reject.', 'Plan-lock chưa thỏa: system reject.'],
  },
  {
    title: 'UC-19 Make Hiring Decision',
    actor: 'Admin',
    trigger: 'Interview đã hoàn tất và kết quả/panel feedback sẵn sàng.',
    desc: 'Admin ra quyết định tuyển dụng cuối cùng HIRE hoặc REJECT.',
    pre: ['Admin đã đăng nhập.', 'Request đang ở DECISION_PENDING hoặc trạng thái tương đương.', 'Có interview result và candidate được xác định.'],
    post: ['Decision được ghi log.', 'Nếu HIRE, offer được tạo/queue theo dữ liệu compensation/start date.', 'Nếu REJECT, notification/rejection email được tạo.'],
    normal: ['Admin mở Interview Results/Decision screen.', 'Review feedback technical, communication, culture và summary notes.', 'Chọn HIRE hoặc REJECT.', 'System validate required fields.', 'System tạo offer/rejection artifacts và cập nhật workflow.'],
    alt: ['Admin yêu cầu bổ sung thông tin trước khi quyết định.', 'HR cập nhật thêm summary/evidence rồi gửi lại.'],
    exc: ['Thiếu compensation/start date cho HIRE: system reject.', 'Candidate không thuộc request: system reject.', 'Decision duplicate: system đảm bảo idempotency/unique constraint.'],
  },
];

function useCaseBlock(uc) {
  const rows = [
    ['UC ID and Name', uc.title],
    ['Created By', 'SE20A05 Group 7 / 2026-07-06'],
    ['Primary Actor', uc.actor],
    ['Secondary Actors', 'System, Notification service, related authorized users'],
    ['Trigger', uc.trigger],
    ['Description', uc.desc],
    ['Preconditions', uc.pre.map((x, i) => `PRE-${i + 1}: ${x}`).join('\n')],
    ['Postconditions', uc.post.map((x, i) => `POST-${i + 1}: ${x}`).join('\n')],
    ['Normal Flow', uc.normal.map((x, i) => `${i + 1}. ${x}`).join('\n')],
    ['Alternative Flows', uc.alt.map((x, i) => `A${i + 1}. ${x}`).join('\n')],
    ['Exceptions', uc.exc.map((x, i) => `E${i + 1}. ${x}`).join('\n')],
    ['Priority', 'High / Must Have'],
    ['Frequency of Use', 'Daily during recruitment operation; depends on hiring volume.'],
    ['Business Rules', 'BR-01, BR-03, BR-05, BR-07, BR-10 as applicable.'],
    ['Assumptions', 'Required services and database are available; user data and organization structure are configured.'],
  ];
  return heading(3, uc.title) + table(['Field', 'Description'], rows, [2300, 6700], { size: 18 });
}

const body = [];

body.push(para('Requirement & Design Specification', { align: 'center', bold: true, size: 40, color: '1F4E79', before: 1200, after: 240 }));
body.push(para('Recruitment Management System (RMS)', { align: 'center', bold: true, size: 32, color: '333333', after: 200 }));
body.push(para('Works Reruiter', { align: 'center', size: 26, color: '555555', after: 360 }));
body.push(para('Version: 1.0', { align: 'center', size: 23, after: 120 }));
body.push(para('Hanoi, July 2026', { align: 'center', italic: true, size: 22, after: 1000 }));
body.push(callout('Document purpose', 'Tài liệu này hoàn thiện báo cáo RDS cho project RMS dựa trên template RDS cung cấp và toàn bộ source/documentation hiện có trong repository. Nội dung phản ánh thiết kế hiện tại sau khi hệ thống thống nhất HR thành một role HR duy nhất.'));
body.push(pageBreak());

body.push(heading(1, 'Record of Changes'));
body.push(table(['Version', 'Date', 'A/M/D', 'In charge', 'Change Description'], [
  ['V1.0', '2026-07-06', 'A', 'SE20A05 Group 7', 'Initial RMS Requirement & Design Specification based on current project implementation and provided template.'],
], [1200, 1500, 1000, 2200, 3100]));

body.push(heading(1, 'Contents'));
[
  'I. Overview',
  '1. User Requirements',
  '1.1 Actors',
  '1.2 Use Cases',
  '2. Overall Functionalities',
  '2.1 Screen Flow',
  '2.2 Screen Descriptions',
  '2.3 Screen Authorization',
  '2.4 Non-UI Functions',
  '3. System High Level Design',
  '3.1 Database Design',
  '3.2 Code Packages',
  'II. Requirement Specifications',
  'III. Design Specifications',
  'IV. Appendix',
].forEach((item) => body.push(para(item, { indentLeft: item.includes('.') ? 360 : 0, after: 50 })));
body.push(pageBreak());

body.push(heading(1, 'I. Overview'));
body.push(heading(2, '1. User Requirements'));
body.push(para('RMS là hệ thống quản lý quy trình tuyển dụng nội bộ cho doanh nghiệp. Hệ thống số hóa toàn bộ pipeline từ nhu cầu tuyển dụng của phòng ban, review của HR, phê duyệt của Admin, lập kế hoạch, triển khai campaign, thu thập CV, phỏng vấn, ra quyết định cuối cùng, offer/rejection và báo cáo.'));
body.push(callout('Core workflow', 'Department Head tạo request -> HR review/forward -> Admin approve -> HR lập OverallPlan/TaskPlan -> Admin duyệt plan -> HR triển khai job posting/CV/interview -> Admin ra hiring decision -> Candidate nhận offer hoặc rejection.'));
body.push(heading(3, '1.1 Actors'));
body.push(table(['#', 'Actor', 'Description'], actors, [700, 2100, 6200]));
body.push(heading(3, '1.2 Use Cases'));
body.push(table(['ID', 'Feature', 'Use Case', 'Use Case Description'], useCases, [900, 1800, 2500, 3800], { size: 17 }));

body.push(heading(2, '2. Overall Functionalities'));
body.push(heading(3, '2.1 Screen Flow'));
body.push(para('Screen flow được tổ chức theo role. Sau khi đăng nhập, frontend điều hướng user đến dashboard tương ứng. Các màn hình nghiệp vụ liên kết theo workflow trạng thái thay vì cho phép thao tác tự do.'));
[
  'Public/Auth: Landing -> Sign Up -> OTP Verification -> Login/Forgot/Reset Password.',
  'Department Head: Dashboard -> Create Request -> My Requests -> Request Detail/Tracking -> Interviews/Feedback.',
  'HR: Dashboard -> Request Queue -> Campaigns -> Campaign Detail -> Task Planner -> Talent Pool/Candidate Search -> Interviews -> Results -> Reports/Notifications.',
  'Admin: Dashboard -> Approval Queue -> All Requests -> Users/Settings -> Interview Results -> Reports/Department Statistics.',
  'Candidate: Dashboard -> Profile -> Upload CV -> Notifications -> Interview Details -> Offer Response.',
].forEach((x, i) => body.push(numbered(x, i + 1)));
body.push(heading(3, '2.2 Screen Descriptions'));
body.push(table(['#', 'Feature', 'Screen', 'Description'], screens, [700, 1700, 3300, 3300], { size: 18 }));
body.push(heading(3, '2.3 Screen Authorization'));
body.push(table(authRows[0], authRows.slice(1), [2600, 1200, 1200, 1700, 1500], { size: 17, aligns: ['left', 'center', 'center', 'center', 'center'] }));
body.push(heading(3, '2.4 Non-UI Functions'));
body.push(table(['#', 'Feature', 'System Function', 'Description'], nonUi, [700, 1700, 2500, 4100], { size: 18 }));

body.push(heading(2, '3. System High Level Design'));
body.push(para('RMS dùng kiến trúc monorepo Turborepo với React SPA ở frontend, một API Gateway NestJS làm HTTP entry point, các microservice nội bộ giao tiếp bằng NestJS TCP transport, PostgreSQL/Prisma làm data store chính, Redis/BullMQ cho job nền và pgvector cho semantic search.'));
body.push(para('High-level flow: webapp -> API Gateway (/api/v1) -> Identity / Recruiting / Interview / Profiles / CV / Notification services -> PostgreSQL + Redis/BullMQ Worker.', { bold: true, color: '1F4E79' }));
body.push(heading(3, '3.1 Database Design'));
body.push(para('Database dùng PostgreSQL 16 với extension pgvector. Prisma schema lưu phần lớn entity, riêng vector(384) được thêm bằng raw SQL migration để phục vụ tìm kiếm ngữ nghĩa.'));
body.push(table(['No', 'Table', 'Owned Area', 'Description'], dbTables.map((r, i) => [String(i + 1), ...r]), [600, 2200, 1800, 4400], { size: 16 }));
body.push(heading(3, '3.2 Code Packages'));
body.push(table(['Package', 'Type', 'Description'], packageRows, [2600, 2100, 4300], { size: 17 }));

body.push(pageBreak());
body.push(heading(1, 'II. Requirement Specifications'));
body.push(heading(2, '1. Feature Requirements'));
body.push(table(['Feature ID', 'Feature', 'Main Actor', 'Requirement Summary'], [
  ['FR-01', 'Organization and Department Structure', 'Admin', 'Admin tạo organization, departments, gán head user và quản lý user active/inactive.'],
  ['FR-02', 'Recruitment Request Creation', 'Department Head', 'Tạo draft request với position, headcount, JD, skill requirements, urgency, justification.'],
  ['FR-03', 'Request Review and Approval', 'HR/Admin', 'HR review/forward; Admin approve/reject/request changes; mọi quyết định được log.'],
  ['FR-04', 'Overall Plan', 'HR', 'Tạo timeline campaign cho request đã approved.'],
  ['FR-05', 'Task Plan', 'HR', 'Phân công task triển khai trong plan cho job posting, CV collection, screening, interview coordination.'],
  ['FR-06', 'Plan Approval', 'Admin', 'Admin duyệt/reject plan; only approved plan unlocks recruitment activities.'],
  ['FR-07', 'Plan-Locked Execution', 'System', 'Service layer chặn downstream action nếu request/plan/task chưa hợp lệ.'],
  ['FR-08', 'Candidate CV Upload', 'Candidate', 'Candidate upload CV; file và metadata được lưu, status hiển thị.'],
  ['FR-09', 'CV Extraction', 'Worker', 'Trích xuất raw text/structured data từ CV.'],
  ['FR-10', 'CV Embeddings', 'Worker', 'Sinh vector embedding 384 chiều dùng pgvector.'],
  ['FR-11', 'Semantic Candidate Search', 'HR', 'Search ứng viên bằng natural language, vector score, skill graph và filters.'],
  ['FR-12', 'Interview Scheduling', 'HR', 'Lên lịch interview, validate panel/conflict và gửi invitation.'],
  ['FR-13', 'Interview Feedback', 'HR/Department Head', 'Ghi điểm technical/communication/culture, notes và recommendation.'],
  ['FR-14', 'Hiring Decision', 'Admin', 'Admin HIRE/REJECT cuối cùng; hệ thống tạo offer hoặc rejection flow.'],
  ['FR-15', 'Offer Letter', 'HR/Candidate', 'HR generate/send offer; candidate accept/decline.'],
  ['FR-16', 'Notifications and Email', 'System', 'In-app/SSE/email cho request, plan, task, interview, offer, rejection.'],
  ['FR-17', 'Realtime Tracking', 'Admin/HR/Department Head', 'Dashboard theo dõi request, task, interview, offer và latest log.'],
  ['FR-18', 'Reports', 'Admin/HR', 'Annual report, department statistics, pipeline overview, time-to-hire.'],
  ['FR-19', 'Audit Logs', 'System', 'Audit trail cho trạng thái request/plan/task/interview/CV.'],
  ['FR-20', 'Health and Operational Observability', 'System/Admin', 'Health endpoint tổng hợp trạng thái Gateway và microservices.'],
], [1000, 2200, 1600, 4200], { size: 16 }));

body.push(heading(2, '2. Functional Use Case Details'));
detailedUseCases.forEach((uc) => body.push(useCaseBlock(uc)));
body.push(heading(2, '3. Common Functions'));
body.push(table(['Common Function', 'Description', 'Related Components'], [
  ['Login System', 'Xác thực email/password, cấp JWT access token và refresh token, route user theo role.', 'webapp, gateway, identity, refresh_tokens/Redis'],
  ['Role Guard', 'Gateway đọc @Roles và user context để quyết định quyền truy cập.', 'JwtAuthGuard, RolesGuard, @wr/contracts/UserRole'],
  ['Notification Center', 'User xem notification, mark read/all read và nhận realtime SSE.', 'notification service, notifications table'],
  ['File Storage', 'Lưu CV/avatar/document, metadata, stream/download file theo quyền.', 'storage package, cv/profiles services'],
  ['Audit/Tracking', 'RequestLog/AuditLog phục vụ timeline, realtime tracking và reports.', 'recruiting service, reports module'],
], [2200, 4300, 2500], { size: 18 }));

body.push(pageBreak());
body.push(heading(1, 'III. Design Specifications'));
body.push(heading(2, '1. UI / Screen Design'));
body.push(heading(3, '1.1 System Access'));
body.push(table(['Field / Component', 'Type', 'Description'], [
  ['Email', 'Text box', 'Người dùng nhập email hợp lệ để đăng nhập/đăng ký.'],
  ['Password', 'Password box', 'Mật khẩu, kiểm tra độ mạnh khi đăng ký/reset.'],
  ['OTP Code', '6-digit input', 'Mã xác thực email đăng ký hoặc reset password.'],
  ['Role/account type', 'Radio/select', 'Candidate, Department Head, HR; Admin tạo qua quản trị.'],
  ['Login / Sign Up / Reset', 'Button', 'Trigger auth API tương ứng.'],
  ['Google sign-in', 'OAuth action', 'Hỗ trợ đăng nhập/đăng ký qua Supabase Google session nếu cấu hình.'],
], [2500, 1800, 4700], { size: 18 }));

body.push(heading(3, '1.2 Recruitment Request Screens'));
body.push(table(['Screen', 'Main Fields / Actions', 'Database Access'], [
  ['Create Request', 'position, headcount, jobDescription, skillRequirements, urgency, justification, expected timeline; save draft/submit.', 'recruitment_requests: C/U; request_logs: C on submit.'],
  ['Request Queue', 'filter status, open detail, return for revision, forward to Admin.', 'recruitment_requests: R/U; request_logs: C; notifications: C.'],
  ['Admin Approval Queue', 'view request, approve/reject/request changes with reason.', 'approval_records: C; recruitment_requests: U; request_logs: C.'],
  ['Request Tracking', 'current stage, owner, task/interview/offer counters, latest log.', 'request_logs/interview_schedules/task_plans/offer_letters: R.'],
], [2100, 4100, 2800], { size: 17 }));

body.push(heading(3, '1.3 Campaign, CV and Interview Screens'));
body.push(table(['Screen', 'Main Fields / Actions', 'Database Access'], [
  ['Campaign Detail / Overall Plan', 'startDate, endDate, submit/resubmit, approve/reject.', 'overall_plans: C/R/U; recruitment_requests: U.'],
  ['Task Planner', 'taskType, assignee, dates, status, assignment.', 'task_plans: C/R/U; task_reminders: C/R.'],
  ['Talent Pool / Candidate Search', 'query, filters, candidate snapshot, CV preview, feedback.', 'candidate_profiles/candidate_cvs/cv_embeddings/talent_search_runs: R/C.'],
  ['Interview Schedule', 'candidate, scheduledAt, duration, location, interviewers, invitation action.', 'interview_schedules: C/R/U; email_logs: C.'],
  ['Interview Results', 'panel feedback, technical/communication/culture, finalRecommendation, summaryNotes.', 'interview_results/interview_schedules: C/R/U.'],
  ['Offer Letter', 'compensation, startDate, content, send/respond.', 'offer_letters/email_logs/notifications: C/R/U.'],
], [2100, 4100, 2800], { size: 17 }));

body.push(heading(2, '2. API and Service Design'));
body.push(para('Gateway exposes HTTP endpoints under /api/v1. Internal services expose @MessagePattern handlers over TCP. Frontend must call Gateway only; direct service calls are not part of client contract.'));
body.push(table(['Domain', 'Representative HTTP Endpoints', 'Access', 'Owning Service'], apiRows, [1700, 4100, 1800, 1400], { size: 15 }));

body.push(heading(2, '3. Data Access and Transaction Design'));
body.push(table(['Function', 'Tables', 'CRUD', 'Transaction / Consistency Notes'], [
  ['Register account', 'users, candidate_profiles, notifications/email_logs', 'C/R', 'Validate email unique; OTP flow must keep pending/verified state consistent.'],
  ['Submit request', 'recruitment_requests, request_logs, notifications', 'R/U/C', 'Status transition and log creation are treated as one workflow operation.'],
  ['Approve request', 'recruitment_requests, approval_records, request_logs, notifications', 'R/U/C', 'Reason required for reject/revision; actor role checked before update.'],
  ['Create plan/tasks', 'overall_plans, task_plans, users', 'C/R', 'Validate request approved, task assignee active HR, task dates inside plan timeline.'],
  ['Schedule interview', 'interview_schedules, candidate_profiles, users, task_plans, email_logs', 'C/R', 'Plan-lock and minimum panel validation before saving schedule/invitations.'],
  ['Hiring decision/offer', 'recruitment_requests, applications, offer_letters, notifications, email_logs', 'R/U/C', 'HIRE requires compensation/startDate; unique offer per request-candidate.'],
  ['CV processing', 'candidate_cvs, candidate_profiles, cv_embeddings, audit_logs', 'R/U/C', 'Worker updates status and records parse/embed events; vector column maintained by raw SQL.'],
], [1800, 2500, 900, 3800], { size: 16 }));

body.push(heading(2, '4. Security and Non-Functional Design'));
body.push(table(['Category', 'Design Decision'], [
  ['Authentication', 'JWT access token, refresh token rotation, Gateway attaches user context to downstream TCP payload.'],
  ['Authorization', 'Central UserRole enum: ADMIN, DEPARTMENT_HEAD, HR_LEADER, CANDIDATE. HR is a single role in current implementation.'],
  ['Validation', 'Zod schemas in @wr/contracts and DTO validation at Gateway/service boundaries.'],
  ['Traceability', 'RequestLog and AuditLog record lifecycle changes, actor, status transition and metadata.'],
  ['Reliability', 'BullMQ/Redis handles async CV parsing, embedding generation, email/notification retries and deadline reminders.'],
  ['AI policy', 'AI/vector search supports extraction and discovery only; hiring decisions remain human-controlled.'],
  ['Performance', 'PostgreSQL indexes on status, foreign keys and vector search with pgvector support candidate retrieval and dashboards.'],
  ['Maintainability', 'Turborepo workspaces separate services/packages; @wr/contracts and @wr/database serve as shared source of truth.'],
], [2100, 6900], { size: 18 }));

body.push(pageBreak());
body.push(heading(1, 'IV. Appendix'));
body.push(heading(2, '1. Assumptions & Dependencies'));
body.push(table(['ID', 'Assumption / Dependency'], [
  ['AS-01', 'PostgreSQL 16 with pgvector extension and Redis 7 are available through docker-compose or equivalent infrastructure.'],
  ['AS-02', 'SMTP/email provider and notification service configuration are available for OTP, invitation, offer and rejection emails.'],
  ['AS-03', 'Organization, departments and initial admin account are seeded before production use.'],
  ['AS-04', 'Candidate CV input is PDF/DOC/DOCX and within configured file size/type limits.'],
  ['DE-01', 'Frontend consumes only Gateway /api/v1 endpoints.'],
  ['DE-02', 'Worker service must run for CV parse/embedding and deadline reminder automation.'],
], [1200, 7800], { size: 18 }));

body.push(heading(2, '2. Limitations & Exclusions'));
body.push(table(['ID', 'Limitation / Exclusion'], [
  ['LM-01', 'AI is not used to make final hiring decisions or automatically reject candidates.'],
  ['LM-02', 'Current MVP uses a shared PostgreSQL database; DB-per-service is a future architecture option.'],
  ['LM-03', 'Calendar conflict checking depends on available user/calendar data and integrations configured in the environment.'],
  ['LM-04', 'Generated reports depend on complete RequestLog/AuditLog coverage and data quality.'],
  ['LM-05', 'The document reflects the current project state after HR role unification; older docs may still contain legacy wording if not regenerated.'],
], [1200, 7800], { size: 18 }));

body.push(heading(2, '3. Business Rules'));
body.push(table(['ID', 'Category', 'Rule Definition'], businessRules.map((r) => [r[0], r[1], r[2]]), [1000, 2200, 5800], { size: 17 }));

body.push(heading(2, '4. Technology Stack Summary'));
body.push(table(['Layer', 'Technology'], [
  ['Runtime / Language', 'Node.js 22+, TypeScript strict mode'],
  ['Frontend', 'React 19, Vite, Tailwind CSS, Radix UI primitives'],
  ['Backend', 'NestJS 11 microservices, API Gateway + TCP transport'],
  ['Database', 'PostgreSQL 16, Prisma 6, pgvector'],
  ['Async Processing', 'Redis 7, BullMQ worker'],
  ['Validation / Contracts', 'Zod schemas, @wr/contracts, DTO validation'],
  ['AI Utilities', '@xenova/transformers, local embeddings, skill graph/vector search'],
  ['Tooling', 'Turborepo, npm workspaces, ESLint, Prettier'],
], [2600, 6400], { size: 18 }));

body.push(heading(2, '5. Source References Used'));
[
  'docs/project-overview.md',
  'docs/architecture.md',
  'docs/FeatureRequired.md',
  'docs/use-case-specifications.md',
  'docs/data-models.md',
  'docs/enterprise-hiring-workflow.md',
  'docs/api-contracts.md',
  'docs/backend-endpoints-summary.md',
  'packages/contracts/src/enums/index.ts',
  'packages/database/prisma/schema.prisma',
  'package.json, turbo.json, services/*, packages/*, webapp/src/*',
].forEach((x) => body.push(bullet(x)));

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" xmlns:cx1="http://schemas.microsoft.com/office/drawing/2015/9/8/chartex" xmlns:cx2="http://schemas.microsoft.com/office/drawing/2015/10/21/chartex" xmlns:cx3="http://schemas.microsoft.com/office/drawing/2016/5/9/8/chartex" xmlns:cx4="http://schemas.microsoft.com/office/drawing/2016/5/10/21/chartex" xmlns:cx5="http://schemas.microsoft.com/office/drawing/2016/5/11/24/chartex" xmlns:cx6="http://schemas.microsoft.com/office/drawing/2016/5/12/9/chartex" xmlns:cx7="http://schemas.microsoft.com/office/drawing/2016/5/13/3/chartex" xmlns:cx8="http://schemas.microsoft.com/office/drawing/2016/5/14/4/chartex" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:aink="http://schemas.microsoft.com/office/drawing/2016/ink" xmlns:am3d="http://schemas.microsoft.com/office/drawing/2017/model3d" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" xmlns:w16cex="http://schemas.microsoft.com/office/word/2018/wordml/cex" xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid" xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml" xmlns:w16du="http://schemas.microsoft.com/office/word/2023/wordml/word16du" xmlns:w16sdtdh="http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash" xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 w15 w16se w16cid w16 w16cex w16sdtdh w16du wp14"><w:body>${body.join('')}${sectPr}</w:body></w:document>`;

const parsed = new DOMParser({
  errorHandler: {
    warning: () => {},
    error: (msg) => {
      throw new Error(msg);
    },
    fatalError: (msg) => {
      throw new Error(msg);
    },
  },
}).parseFromString(documentXml, 'text/xml');

if (!parsed || !parsed.documentElement || parsed.documentElement.nodeName !== 'w:document') {
  throw new Error('Generated document XML is invalid.');
}

zip.file('word/document.xml', documentXml);

const corePath = 'docProps/core.xml';
if (zip.file(corePath)) {
  const now = new Date().toISOString();
  const core = await zip.file(corePath).async('text');
  const updated = core
    .replace(/<dc:title>[\s\S]*?<\/dc:title>/, '<dc:title>Requirement & Design Specification - Recruitment Management System (RMS)</dc:title>')
    .replace(/<dc:creator>[\s\S]*?<\/dc:creator>/, '<dc:creator>SE20A05 Group 7</dc:creator>')
    .replace(/<cp:lastModifiedBy>[\s\S]*?<\/cp:lastModifiedBy>/, '<cp:lastModifiedBy>Codex</cp:lastModifiedBy>')
    .replace(/<dcterms:modified[^>]*>[\s\S]*?<\/dcterms:modified>/, `<dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>`);
  zip.file(corePath, updated);
}

const output = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(outPath, output);
console.log(outPath);
