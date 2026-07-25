/**
 * generate_testing_tools_report.mjs
 *
 * Điền nội dung báo cáo "Testing Tools" vào section "TEST TOOLS" trong tempate.docx
 * Chiến lược:
 *   1. Đọc file _template_debug.xml (XML dump của template gốc, không bị overwrite)
 *   2. Tách thành các block (w:p / w:tbl)
 *   3. Tìm block "TEST TOOLS" (heading) và block "TEST DATA MANAGEMENT" (heading kế tiếp)
 *   4. Thay thế toàn bộ blocks giữa hai heading đó bằng nội dung báo cáo mới
 *   5. Đọc tempate.docx gốc (từ _template_debug.xml), replace word/document.xml
 *   6. Ghi lại tempate.docx
 *
 * Usage: node scripts/generate_testing_tools_report.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TEMPLATE_DEBUG_XML = path.join(ROOT, '_template_debug.xml');
const TEMPLATE_DOCX = path.join(ROOT, 'tempate.docx');
const OUTPUT_PATH = path.join(ROOT, 'tempate.docx');

// ─── XML Helpers ─────────────────────────────────────────────────────────────

const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Build a <w:p> paragraph element.
 */
const para = (
  text,
  {
    level = 0,
    bold = false,
    italic = false,
    center = false,
    size = null,
    color = null,
    spaceAfter = null,
    pageBreak = false,
  } = {},
) => {
  const defaultSizes = { 0: 22, 1: 32, 2: 28, 3: 24, 4: 22 };
  const sz = size || defaultSizes[level] || 22;
  const before =
    level === 1 ? 320 : level === 2 ? 240 : level === 3 ? 180 : 40;
  const after = spaceAfter !== null ? spaceAfter : level ? 120 : 100;
  const pStyle = level ? `<w:pStyle w:val="Heading${level}"/>` : '';
  const outlineLvl = level ? `<w:outlineLvl w:val="${Math.min(level - 1, 8)}"/>` : '';
  const keepNext = level ? '<w:keepNext/>' : '';
  const pageBreakXml = pageBreak ? '<w:pageBreakBefore/>' : '';
  const justCenter = center ? '<w:jc w:val="center"/>' : '';
  return (
    `<w:p>` +
    `<w:pPr>${pStyle}${pageBreakXml}${keepNext}<w:spacing w:before="${before}" w:after="${after}" w:line="276" w:lineRule="auto"/>${justCenter}${outlineLvl}</w:pPr>` +
    `<w:r>` +
    `<w:rPr>` +
    `<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>` +
    `<w:sz w:val="${sz}"/>` +
    (bold || level ? '<w:b/>' : '') +
    (italic ? '<w:i/>' : '') +
    (color ? `<w:color w:val="${color}"/>` : '') +
    `</w:rPr>` +
    `<w:t xml:space="preserve">${esc(text)}</w:t>` +
    `</w:r>` +
    `</w:p>`
  );
};

const bullet = (text, indent = 540) =>
  `<w:p>` +
  `<w:pPr><w:ind w:left="${indent}" w:hanging="270"/><w:spacing w:after="70" w:line="276" w:lineRule="auto"/></w:pPr>` +
  `<w:r>` +
  `<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="22"/></w:rPr>` +
  `<w:t xml:space="preserve">• ${esc(text)}</w:t>` +
  `</w:r>` +
  `</w:p>`;

const cell = (text, width, { head = false, center = false } = {}) =>
  `<w:tc>` +
  `<w:tcPr>` +
  `<w:tcW w:w="${width}" w:type="dxa"/>` +
  `<w:tcMar><w:top w:w="90" w:type="dxa"/><w:left w:w="110" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:right w:w="110" w:type="dxa"/></w:tcMar>` +
  (head ? '<w:shd w:fill="D9EAF7"/>' : '') +
  `<w:vAlign w:val="center"/>` +
  `</w:tcPr>` +
  `<w:p>` +
  `<w:pPr><w:spacing w:after="20" w:line="240" w:lineRule="auto"/>${center ? '<w:jc w:val="center"/>' : ''}</w:pPr>` +
  `<w:r>` +
  `<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="${head ? 21 : 19}"/>${head ? '<w:b/>' : ''}</w:rPr>` +
  `<w:t xml:space="preserve">${esc(text)}</w:t>` +
  `</w:r>` +
  `</w:p>` +
  `</w:tc>`;

const tbl = (headers, rows, widths) => {
  const totalW = widths.reduce((a, b) => a + b, 0);
  const gridCols = widths.map((w) => `<w:gridCol w:w="${w}"/>`).join('');
  const headerRow =
    `<w:tr><w:trPr><w:tblHeader/></w:trPr>` +
    headers.map((h, i) => cell(h, widths[i], { head: true, center: true })).join('') +
    `</w:tr>`;
  const dataRows = rows
    .map(
      (r) =>
        `<w:tr>` +
        r.map((v, i) => cell(v, widths[i], { center: i === 0 })).join('') +
        `</w:tr>`,
    )
    .join('');
  return (
    `<w:tbl>` +
    `<w:tblPr>` +
    `<w:tblW w:w="${totalW}" w:type="dxa"/>` +
    `<w:tblInd w:w="0" w:type="dxa"/>` +
    `<w:tblLayout w:type="fixed"/>` +
    `<w:tblBorders>` +
    `<w:top w:val="single" w:sz="6" w:color="7F7F7F"/>` +
    `<w:left w:val="single" w:sz="6" w:color="7F7F7F"/>` +
    `<w:bottom w:val="single" w:sz="6" w:color="7F7F7F"/>` +
    `<w:right w:val="single" w:sz="6" w:color="7F7F7F"/>` +
    `<w:insideH w:val="single" w:sz="4" w:color="BFBFBF"/>` +
    `<w:insideV w:val="single" w:sz="4" w:color="BFBFBF"/>` +
    `</w:tblBorders>` +
    `</w:tblPr>` +
    `<w:tblGrid>${gridCols}</w:tblGrid>` +
    headerRow +
    dataRows +
    `</w:tbl>` +
    para('')
  );
};

// ─── Report Content ───────────────────────────────────────────────────────────

function buildContent() {
  let xml = '';

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. STATIC CODE ANALYSIS TOOL
  // ═══════════════════════════════════════════════════════════════════════════
  xml += para('1. Static Code Analysis Tool', { level: 2, bold: true });
  xml += para(
    'Nhóm sử dụng hai công cụ phân tích tĩnh chính nhằm đảm bảo chất lượng mã nguồn ngay từ giai đoạn viết code, ' +
    'trước khi thực thi. Các công cụ này phát hiện lỗi cú pháp, vi phạm coding conventions, lỗi kiểu dữ liệu và ' +
    'các anti-patterns mà không cần chạy chương trình.',
  );

  // 1.1 ESLint
  xml += para('1.1  ESLint + typescript-eslint', { level: 3, bold: true });
  xml += para(
    'ESLint (^9.20.0) được cấu hình kết hợp với typescript-eslint (^8.24.0) để phân tích tĩnh toàn bộ mã ' +
    'TypeScript/JavaScript trong monorepo. File cấu hình eslint.config.mjs được đặt tại thư mục gốc, áp dụng ' +
    'nhất quán cho tất cả services và packages.',
  );
  xml += para('Các quy tắc kiểm tra chính:', { bold: true, size: 22 });
  xml += bullet('@typescript-eslint/no-unused-vars: warn – cảnh báo biến/tham số khai báo nhưng không sử dụng.');
  xml += bullet('@typescript-eslint/no-explicit-any: warn – cảnh báo sử dụng kiểu any không tường minh.');
  xml += bullet('@typescript-eslint/no-empty-object-type: off – tắt cảnh báo type/interface rỗng (linh hoạt cho pattern mở rộng).');
  xml += bullet('Kế thừa js.configs.recommended từ @eslint/js – bao gồm toàn bộ quy tắc JavaScript cơ bản.');
  xml += para('Phạm vi kiểm tra / Loại trừ:', { bold: true, size: 22 });
  xml += bullet('Kiểm tra: Tất cả file *.ts, *.tsx, *.mjs, *.js trong services/*, packages/*, webapp/.');
  xml += bullet('Loại trừ: **/node_modules/**, **/dist/**, **/.turbo/**, **/build/**, **/coverage/**, *.config.{js,mjs,ts}.');
  xml += para('Tích hợp workflow:', { bold: true, size: 22 });
  xml += bullet('Lệnh kiểm tra: npm run lint (Turborepo chạy song song trên tất cả workspaces).');
  xml += bullet('Là quality gate bắt buộc – phải pass trước khi build hoặc merge code.');

  // 1.2 TypeScript Strict
  xml += para('1.2  TypeScript Compiler – Strict Mode', { level: 3, bold: true });
  xml += para(
    'TypeScript (^5.8.3) được bật chế độ strict toàn diện, hoạt động như công cụ phân tích tĩnh mạnh mẽ. ' +
    'Cấu hình được chia sẻ qua packages/typescript-config/ và áp dụng đồng nhất cho toàn bộ codebase.',
  );
  xml += para('Các flag strict được bật:', { bold: true, size: 22 });
  xml += bullet('strict: true – bật toàn bộ kiểm tra kiểu nghiêm ngặt (strictNullChecks, noImplicitAny, strictFunctionTypes, ...).');
  xml += bullet('noUnusedLocals: true – báo lỗi build nếu có biến cục bộ khai báo nhưng không dùng.');
  xml += bullet('noUnusedParameters: true – báo lỗi build nếu có tham số hàm không được sử dụng.');
  xml += bullet('noFallthroughCasesInSwitch: true – báo lỗi nếu case trong switch không có break/return.');
  xml += para('Tích hợp workflow:', { bold: true, size: 22 });
  xml += bullet('Lệnh kiểm tra: npm run typecheck (Turborepo chạy song song trên tất cả workspaces).');
  xml += bullet('Lỗi TypeScript được coi là lỗi build – ngăn không cho merge code không hợp lệ.');

  // Summary table 1
  xml += para('Bảng tổng hợp công cụ phân tích tĩnh:', { bold: true, size: 22 });
  xml += tbl(
    ['Công cụ', 'Phiên bản', 'Mục đích', 'Lệnh chạy', 'Phạm vi'],
    [
      ['ESLint', '^9.20.0', 'Phân tích lỗi cú pháp, coding style, anti-patterns trong JS/TS', 'npm run lint', 'Toàn bộ monorepo'],
      ['typescript-eslint', '^8.24.0', 'Bổ sung quy tắc đặc thù TypeScript cho ESLint', 'npm run lint', 'Toàn bộ monorepo'],
      ['TypeScript Compiler', '^5.8.3', 'Phân tích kiểu tĩnh, phát hiện lỗi type, unused vars/params', 'npm run typecheck', 'Toàn bộ monorepo'],
      ['Prettier', '^3.5.3', 'Kiểm tra và đồng nhất format code (semi, quotes, printWidth=100)', 'npm run format:check', 'Toàn bộ monorepo'],
    ],
    [2100, 1500, 3800, 2000, 2100],
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. AUTOMATION TESTING TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  xml += para('2. Automation Testing Tools', { level: 2, bold: true });
  xml += para(
    'Dự án RMS sử dụng kết hợp nhiều công cụ tự động hóa kiểm thử ở các cấp độ khác nhau: ' +
    'unit testing, integration testing và end-to-end testing. Mỗi cấp độ phát hiện các loại lỗi khác nhau, ' +
    'đảm bảo chất lượng từ business logic đến toàn bộ workflow.',
  );

  // 2.1 Jest
  xml += para('2.1  Jest + ts-jest – Unit & Integration Testing', { level: 3, bold: true });
  xml += para(
    'Jest (^29.x) với ts-jest (^29.3.0) là framework kiểm thử chính cho các service NestJS. Jest được tích hợp ' +
    'trong từng workspace service và package, cho phép kiểm thử cô lập từng component mà không cần chạy toàn bộ hệ thống.',
  );
  xml += para('Đặc điểm sử dụng trong dự án:', { bold: true, size: 22 });
  xml += bullet('@nestjs/testing: Tạo TestingModule để khởi tạo NestJS context cô lập cho unit/integration test.');
  xml += bullet('PrismaService được mock hoàn toàn – không kết nối database thật trong unit tests, đảm bảo tốc độ và isolation.');
  xml += bullet('Test files đặt co-located cùng source code hoặc trong thư mục __tests__/ của từng module.');
  xml += bullet('Chạy với cờ --runInBand để đảm bảo các test chạy tuần tự, tránh xung đột khi mock shared state.');
  xml += bullet('ts-jest xử lý TypeScript trực tiếp – không cần pre-compile, giảm thời gian setup.');

  xml += para('Danh sách workspaces được kiểm thử bằng Jest:', { bold: true, size: 22 });
  xml += tbl(
    ['Workspace / Service', 'Package', 'Scope kiểm thử', 'Lệnh chạy'],
    [
      ['services/gateway', '@wr/gateway', 'HTTP controllers, JWT guards, RBAC, request routing', 'npm test --workspace=@wr/gateway -- --runInBand'],
      ['services/identity', '@wr/identity', 'Auth service, JWT signing/refresh, user CRUD, org/dept mgmt', 'npm test --workspace=@wr/identity -- --runInBand'],
      ['services/recruiting', '@wr/recruiting', '13-state workflow engine, plan logic, state machine transitions', 'npm test --workspace=@wr/recruiting -- --runInBand'],
      ['services/interview', '@wr/interview', 'Interview scheduling, panel management, feedback, result logic', 'npm test --workspace=@wr/interview -- --runInBand'],
      ['services/notification', '@wr/notification', 'Email dispatch (SMTP), SSE notification, delivery logs', 'npm test --workspace=@wr/notification -- --runInBand'],
      ['services/worker', '@wr/worker', 'BullMQ processors: CV parsing, embedding generation, reminders', 'npm test --workspace=@wr/worker -- --runInBand'],
      ['packages/ai', '@wr/ai', 'Pure functions: vector similarity, embedding helpers (no DB/DI)', 'npm test --workspace=@wr/ai -- --runInBand'],
    ],
    [2400, 1900, 3800, 4400],
  );

  // 2.2 Puppeteer
  xml += para('2.2  Puppeteer – UI Smoke Testing (End-to-End)', { level: 3, bold: true });
  xml += para(
    'Puppeteer được sử dụng trong script scripts/ui-role-smoke.mjs để tự động hóa kiểm thử giao diện người dùng ' +
    'cho từng role. Script mở trình duyệt headless, đăng nhập với từng role, kiểm tra layout và phát hiện lỗi runtime.',
  );
  xml += para('Các kiểm tra được tự động hóa:', { bold: true, size: 22 });
  xml += bullet('Role redirect: Sau đăng nhập, xác minh URL redirect đúng (HR→/hr, Dept→/dept-head, Candidate→/candidate, Admin→/admin).');
  xml += bullet('Heading validation: Kiểm tra heading trang hiển thị đúng nội dung sau khi dữ liệu tải xong.');
  xml += bullet('JavaScript runtime errors: Lắng nghe sự kiện pageerror và console.error để phát hiện lỗi JS.');
  xml += bullet('Horizontal overflow: Phát hiện các element tràn ngang viewport (scrollWidth > clientWidth + 2px).');
  xml += bullet('Button text overflow: Kiểm tra các nút bị cắt chữ (button.scrollWidth > button.clientWidth).');
  xml += bullet('Screenshot: Chụp fullPage screenshot lưu tại /tmp/rms-<role>-<viewport>.png để review thủ công.');
  xml += para('Viewport và môi trường kiểm thử:', { bold: true, size: 22 });
  xml += tbl(
    ['Viewport', 'Kích thước', 'Chế độ', 'Roles kiểm thử'],
    [
      ['Desktop', '1440 x 900 px', 'Standard browser', 'HR, Department Head, Candidate, Admin'],
      ['Mobile', '390 x 844 px', 'Mobile + Touch emulation (isMobile, hasTouch)', 'HR, Department Head, Candidate, Admin'],
    ],
    [1500, 1800, 3200, 6000],
  );
  xml += para('Lệnh chạy:', { bold: true, size: 22 });
  xml += bullet('npm run test:ui:roles -- --hr-email=<email> --hr-password=<pwd> --dept-email=<email> --dept-password=<pwd> --candidate-email=<email> --candidate-password=<pwd> --admin-email=<email> --admin-password=<pwd>');
  xml += bullet('Credentials truyền qua CLI arguments – không lưu trong source control (bảo mật).');

  // 2.3 Custom E2E Script
  xml += para('2.3  Custom E2E API Testing Script – Full Workflow', { level: 3, bold: true });
  xml += para(
    'Script scripts/e2e-role-flow.mjs là custom Node.js E2E testing script sử dụng native fetch API để kiểm thử ' +
    'toàn bộ luồng tuyển dụng từ đầu đến cuối mà không dùng mock hay test double. ' +
    'Script gọi trực tiếp API thật tại http://127.0.0.1:3001/api/v1.',
  );
  xml += para('Các bước workflow được tự động kiểm thử (9 bước chính):', { bold: true, size: 22 });
  xml += tbl(
    ['Bước', 'Actor', 'Hành động', 'API Endpoint'],
    [
      ['1', 'System', 'Health check – kiểm tra Gateway và tất cả microservices hoạt động', 'GET /api/v1/health'],
      ['2', 'All roles', 'Đăng nhập đồng thời 4 roles, kiểm tra JWT và role assignment', 'POST /api/v1/auth/login'],
      ['3', 'Candidate', 'Kiểm tra role guard – Candidate bị từ chối Admin dashboard (403)', 'GET /api/v1/reports/admin-dashboard'],
      ['4', 'Department Head', 'Tạo và submit recruitment request', 'POST/PATCH /api/v1/recruitment-requests'],
      ['5', 'HR + Admin', 'HR assign request, forward lên Admin, Admin phê duyệt', 'PATCH /api/v1/recruitment-requests/:id/decision'],
      ['6', 'HR + Admin', 'HR tạo Overall Plan + Task Plans, submit, Admin approve, start campaign', 'POST/PATCH /api/v1/overall-plan'],
      ['7', 'HR', 'Tạo job posting và publish công khai', 'POST /api/v1/job-postings/:id/publish'],
      ['8', 'Candidate', 'Upload CV (multipart/form-data) và nộp đơn ứng tuyển', 'POST /api/v1/candidate/cvs, /api/v1/applications'],
      ['9', 'HR + Panel', 'Lịch phỏng vấn; xác nhận tham dự; ghi nhận feedback; Admin hire decision; Candidate chấp nhận offer', 'POST /api/v1/interviews/schedules → /offers/:id/respond'],
    ],
    [700, 1600, 4000, 6200],
  );
  xml += para('Đặc điểm kỹ thuật nổi bật:', { bold: true, size: 22 });
  xml += bullet('E2E marker: Mỗi run tạo marker E2E-<yyyyMMddHHmmss> để phân biệt dữ liệu test với dữ liệu production.');
  xml += bullet('No mocks: Gọi trực tiếp API thật – phát hiện lỗi integration thực tế giữa các microservices.');
  xml += bullet('CV upload: Test multipart/form-data upload với file cv-demo.pdf thực tế.');
  xml += bullet('Exit code: Trả về exit code 1 với message [FAIL] khi bất kỳ step nào thất bại.');
  xml += bullet('Output JSON: Khi thành công trả về { marker, requestId, planId, scheduleId } để trace trong DB.');

  // Summary table 2
  xml += para('Bảng tổng hợp công cụ kiểm thử tự động:', { bold: true, size: 22 });
  xml += tbl(
    ['Công cụ', 'Phiên bản', 'Loại kiểm thử', 'Phạm vi', 'Lệnh'],
    [
      ['Jest + ts-jest', '^29.x / ^29.3.0', 'Unit & Integration Testing', 'Backend services + @wr/ai package', 'npm test --workspace=@wr/<service>'],
      ['@nestjs/testing', '^11.x', 'NestJS Module Testing', 'Controllers, Services, Guards, Pipes', 'npm test --workspace=@wr/<service>'],
      ['Puppeteer', 'latest', 'UI Smoke Test (E2E Browser)', 'React SPA – 4 roles × 2 viewports', 'npm run test:ui:roles'],
      ['Custom fetch E2E script', 'Node.js 22+', 'API Workflow E2E Test', 'Full 9-step recruitment workflow', 'npm run test:e2e:roles'],
    ],
    [2200, 2000, 2500, 3200, 3400],
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. TEST MANAGEMENT TOOLS
  // ═══════════════════════════════════════════════════════════════════════════
  xml += para('3. Test Management Tools', { level: 2, bold: true });
  xml += para(
    'Nhóm sử dụng kết hợp các công cụ quản lý kiểm thử để lập kế hoạch, theo dõi tiến độ, ' +
    'quản lý test cases, ghi nhận kết quả và báo cáo theo toàn bộ vòng đời dự án.',
  );

  // 3.1 GitHub Issues + Projects
  xml += para('3.1  GitHub Issues & GitHub Projects – Quản lý Test Cases và Bug Tracking', { level: 3, bold: true });
  xml += para(
    'GitHub Issues là công cụ quản lý kiểm thử trung tâm. Script scripts/create-issues.sh tự động tạo các issue ' +
    'kiểm thử từ test plan. GitHub Projects (Kanban board) dùng để theo dõi trạng thái thực thi kiểm thử.',
  );
  xml += para('Tính năng sử dụng:', { bold: true, size: 22 });
  xml += bullet('Test Case Management: Mỗi use case (UC-01 đến UC-61) được tạo thành GitHub Issue với template chuẩn.');
  xml += bullet('Labels: Phân loại theo loại test (unit/integration/e2e), mức độ ưu tiên (critical/high/medium/low), trạng thái (pass/fail/blocked).');
  xml += bullet('Milestones: Gắn các test activities với sprint/milestone cụ thể (Sprint 1 → Sprint N).');
  xml += bullet('GitHub Projects Kanban: Cột To Do → In Progress → Done → Closed cho từng test execution cycle.');
  xml += bullet('Automated bulk creation: create-issues.sh tạo hàng loạt issues từ danh sách use cases trong TestPlan document.');
  xml += bullet('Assignees: Phân công thành viên phụ trách từng nhóm test cases theo module.');

  // 3.2 Turborepo
  xml += para('3.2  Turborepo – CI Pipeline Orchestration', { level: 3, bold: true });
  xml += para(
    'Turborepo (v2.9.7) đóng vai trò điều phối pipeline kiểm thử, đảm bảo các bước chạy đúng thứ tự ' +
    'dependency và song song khi có thể, với cơ chế caching thông minh.',
  );
  xml += para('Cấu hình pipeline (turbo.json):', { bold: true, size: 22 });
  xml += tbl(
    ['Task', 'Thứ tự thực thi', 'Mô tả', 'Caching'],
    [
      ['lint', 'Song song (no deps)', 'Chạy ESLint trên tất cả workspaces đồng thời', 'Có – cache theo file hash'],
      ['typecheck', 'Song song (no deps)', 'Chạy TypeScript type checking đồng thời', 'Có – cache theo file hash'],
      ['build', 'Tuần tự (dependency graph)', 'Build packages trước → services → webapp', 'Có – rebuild khi source thay đổi'],
      ['test', 'Song song (sau build)', 'Chạy Jest test suite cho từng workspace', 'Có – rerun khi source thay đổi'],
    ],
    [1500, 2300, 4000, 2700],
  );

  // 3.3 Test Plan Document
  xml += para('3.3  TestPlan_RMS_UseCaseTesting_SE20A05Group7.docx – Test Plan chính thức (ISTQB v4.0)', { level: 3, bold: true });
  xml += para(
    'Nhóm duy trì tài liệu Test Plan chính thức theo chuẩn ISTQB v4.0, lưu trực tiếp trong repository. ' +
    'Đây là nguồn tham chiếu duy nhất (single source of truth) cho toàn bộ hoạt động kiểm thử của nhóm.',
  );
  xml += para('Cấu trúc tài liệu:', { bold: true, size: 22 });
  xml += tbl(
    ['Mục', 'Nội dung'],
    [
      ['Document Information', 'Tên dự án, phiên bản, người chuẩn bị/review/phê duyệt, ngày tạo, trạng thái'],
      ['Revision History', 'Lịch sử thay đổi tài liệu theo phiên bản'],
      ['Introduction & Purpose', 'Mục tiêu kiểm thử, giá trị business, tổng quan hệ thống RMS'],
      ['Test Scope', 'Danh sách modules/features trong và ngoài phạm vi kiểm thử'],
      ['Test Strategy', 'Chiến lược kiểm thử tổng thể: level, type, technique sử dụng'],
      ['Test Environment', 'Cấu hình môi trường: Docker, Node.js 22, PostgreSQL 16, Redis 7, pgvector'],
      ['Testing Tools', 'ESLint, TypeScript Compiler, Jest, Puppeteer, custom E2E scripts'],
      ['Test Schedule', 'Lịch trình kiểm thử theo sprint/milestone của dự án'],
      ['Entry/Exit Criteria', 'Điều kiện bắt đầu và kết thúc từng giai đoạn kiểm thử'],
      ['Risk & Mitigation', 'Rủi ro kiểm thử và biện pháp giảm thiểu'],
      ['Use Case Test Table', 'Bảng test cases UC-01..UC-61: test ID, precondition, steps, expected/actual result, status'],
    ],
    [3000, 9500],
  );

  // 3.4 Team assignment docs
  xml += para('3.4  Tài liệu Phân công & Báo cáo Kiểm thử', { level: 3, bold: true });
  xml += para(
    'Ngoài Test Plan chính, nhóm duy trì thêm tài liệu phân công và báo cáo tiến độ kiểm thử ' +
    '(docs/Bao_cao_ke_hoach_va_phan_cong_kiem_thu_RMS.docx và RMS_5_Member_Task_Assignment_Clear.docx) ' +
    'để quản lý trách nhiệm từng thành viên trong nhóm SE20A05 Group 7.',
  );
  xml += para('Nội dung quản lý:', { bold: true, size: 22 });
  xml += bullet('Phân công kiểm thử: Mỗi thành viên phụ trách kiểm thử các module và use cases cụ thể.');
  xml += bullet('Timeline: Lịch trình theo tuần cho từng giai đoạn (Unit → Integration → E2E → UAT).');
  xml += bullet('Tiến độ: Báo cáo số lượng test cases pass/fail/blocked theo từng iteration.');
  xml += bullet('Quality Gates: Điều kiện merge code bắt buộc: format:check + lint + typecheck + build + unit tests.');

  // Final summary table
  xml += para('Bảng tổng hợp công cụ quản lý kiểm thử:', { bold: true, size: 22 });
  xml += tbl(
    ['Công cụ / Tài liệu', 'Mục đích chính', 'Phạm vi áp dụng'],
    [
      ['GitHub Issues', 'Bug tracking, test case lifecycle, traceability (UC-01..UC-61)', 'Toàn bộ dự án – tất cả 5 thành viên'],
      ['GitHub Projects (Kanban)', 'Theo dõi trạng thái test execution theo sprint (To Do→Done)', 'QA team + Dev team'],
      ['Turborepo Pipeline', 'Điều phối CI: lint → typecheck → build → test với caching', 'Monorepo CI/CD automation'],
      ['TestPlan_RMS_*.docx', 'Test plan ISTQB v4.0, test cases table UC-01..UC-61', 'Toàn bộ nhóm + stakeholders'],
      ['Bao_cao_ke_hoach_*.docx', 'Phân công kiểm thử, lịch trình, báo cáo tiến độ nhóm', 'Nội bộ SE20A05 Group 7'],
    ],
    [3200, 5500, 3800],
  );

  // Quality Gates Integration
  xml += para('4. Tích hợp CI/CD và Quality Gates', { level: 2, bold: true });
  xml += para(
    'Tất cả công cụ kiểm thử được tích hợp thành một pipeline CI/CD hoàn chỉnh. ' +
    'Mọi pull request phải pass toàn bộ quality gates sau trước khi được merge:',
  );
  xml += tbl(
    ['#', 'Bước', 'Công cụ', 'Lệnh', 'Điều kiện pass'],
    [
      ['1', 'Format check', 'Prettier ^3.5.3', 'npm run format:check', '0 dòng vi phạm format rules'],
      ['2', 'Static analysis', 'ESLint + typescript-eslint', 'npm run lint', '0 lỗi ESLint (warnings chấp nhận được)'],
      ['3', 'Type checking', 'TypeScript ^5.8.3 (strict)', 'npm run typecheck', '0 type errors trong toàn bộ codebase'],
      ['4', 'Unit & Integration tests', 'Jest + ts-jest + @nestjs/testing', 'npm test --workspace=@wr/<svc>', '100% test cases pass, coverage đạt ngưỡng'],
      ['5', 'Build validation', 'Turborepo + tsc + Vite ^6.3.0', 'npm run build', 'Build thành công, 0 compilation errors'],
      ['6', 'E2E API workflow test', 'Custom Node.js fetch script', 'npm run test:e2e:roles', 'Tất cả 9 bước workflow pass, exit code 0'],
      ['7', 'UI Smoke test', 'Puppeteer (headless Chrome)', 'npm run test:ui:roles', '4 roles × 2 viewports pass, 0 JS errors, 0 overflow'],
    ],
    [600, 2200, 3000, 3200, 3500],
  );

  return xml;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Step 1: Read the original template XML from _template_debug.xml
  console.log(`📄 Reading original template XML: ${TEMPLATE_DEBUG_XML}`);
  if (!fs.existsSync(TEMPLATE_DEBUG_XML)) {
    throw new Error(`Template debug XML not found: ${TEMPLATE_DEBUG_XML}`);
  }
  const originalXml = fs.readFileSync(TEMPLATE_DEBUG_XML, 'utf8');

  // Step 2: Split into blocks
  const blockRegex = /(<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>|<w:tbl(?:\s[^>]*)?>[\s\S]*?<\/w:tbl>)/g;
  const blocks = [...originalXml.matchAll(blockRegex)].map((m) => m[0]);
  console.log(`   Found ${blocks.length} blocks in template XML.`);

  // Step 3: Find "TEST TOOLS" section boundaries
  let startIdx = -1; // index of "TEST TOOLS" heading block
  let endIdx = -1;   // index of "TEST DATA MANAGEMENT" heading block (exclusive)

  for (let i = 0; i < blocks.length; i++) {
    const text = blocks[i].replace(/<[^>]+>/g, '').trim();
    if (text === 'TEST TOOLS' && startIdx === -1) {
      startIdx = i;
      console.log(`   Found "TEST TOOLS" at block index ${i}.`);
    } else if (startIdx >= 0 && text === 'TEST DATA MANAGEMENT') {
      endIdx = i;
      console.log(`   Found "TEST DATA MANAGEMENT" (next section) at block index ${i}.`);
      break;
    }
  }

  if (startIdx === -1) {
    throw new Error('Could not find "TEST TOOLS" section in template XML.');
  }
  if (endIdx === -1) {
    console.warn('   ⚠ Could not find next section after TEST TOOLS. Will replace to end of document.');
    endIdx = blocks.length;
  }

  // Step 4: Build new content
  console.log('📝 Building report content...');
  const reportContent = buildContent();

  // Reconstruct: keep blocks before TEST TOOLS heading, insert new content, then keep from TEST DATA MANAGEMENT
  const beforeBlocks = blocks.slice(0, startIdx); // everything before "TEST TOOLS"
  const afterBlocks = blocks.slice(endIdx);        // from "TEST DATA MANAGEMENT" onwards

  const newBody = [
    ...beforeBlocks,
    // Re-insert the "TEST TOOLS" heading (keep original formatting)
    blocks[startIdx],
    // Inject our report content
    reportContent,
    ...afterBlocks,
  ].join('\n');

  // Step 5: Wrap into full document XML
  // Extract header from original XML
  const docHeaderMatch = originalXml.match(/^[\s\S]*?<w:body>/);
  const docHeader = docHeaderMatch ? docHeaderMatch[0] : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>';

  // Extract sectPr from original XML
  const sectPrMatch = originalXml.match(/<w:sectPr(?:\s[^>]*)?>[\s\S]*?<\/w:sectPr>\s*<\/w:body>/);
  const docFooter = sectPrMatch ? sectPrMatch[0] + '</w:document>' : '</w:body></w:document>';

  const newDocXml = docHeader + newBody + '\n' + docFooter;

  // Step 6: Load tempate.docx, replace document.xml, save
  console.log(`💾 Loading DOCX: ${TEMPLATE_DOCX}`);
  if (!fs.existsSync(TEMPLATE_DOCX)) {
    throw new Error(`DOCX file not found: ${TEMPLATE_DOCX}`);
  }
  const zip = await JSZip.loadAsync(fs.readFileSync(TEMPLATE_DOCX));
  zip.file('word/document.xml', newDocXml);

  // Enable TOC auto-update
  if (zip.file('word/settings.xml')) {
    let settings = await zip.file('word/settings.xml').async('string');
    if (!settings.includes('<w:updateFields')) {
      settings = settings.replace('</w:settings>', '<w:updateFields w:val="true"/></w:settings>');
      zip.file('word/settings.xml', settings);
    }
  }

  const outBytes = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(OUTPUT_PATH, outBytes);

  console.log(`\n✅ Done! Report written to: ${OUTPUT_PATH}`);
  console.log('   Mở file trong Microsoft Word và nhấn Ctrl+A → F9 để cập nhật Table of Contents.');
  console.log('\n📋 Nội dung đã điền vào section "TEST TOOLS":');
  console.log('   • 1. Static Code Analysis Tool (ESLint, typescript-eslint, TypeScript Compiler, Prettier)');
  console.log('   • 2. Automation Testing Tools (Jest+ts-jest, Puppeteer UI Smoke, Custom E2E API Script)');
  console.log('   • 3. Test Management Tools (GitHub Issues/Projects, Turborepo, TestPlan.docx, Assignment docs)');
  console.log('   • 4. CI/CD Quality Gates Pipeline');
  console.log('\n📌 Phần DOCUMENT INFORMATION đã để trống để bạn tự điền.');
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});