import fs from 'node:fs';
import path from 'node:path';

function extractArrayVariable(fileContent, varName) {
  const startIndex = fileContent.indexOf(`const ${varName}=[` || `const ${varName} = [`);
  if (startIndex < 0) return [];
  
  // Find matching bracket
  let bracketCount = 1;
  let index = fileContent.indexOf('[', startIndex) + 1;
  let startOfArray = index - 1;
  
  while (index < fileContent.length && bracketCount > 0) {
    if (fileContent[index] === '[') bracketCount++;
    else if (fileContent[index] === ']') bracketCount--;
    index++;
  }
  
  const arrayText = fileContent.substring(startOfArray, index);
  // Safely evaluate or parse the array
  try {
    // We can evaluate it using a Function constructor or simple eval in a safe context
    const fn = new Function(`return ${arrayText};`);
    return fn();
  } catch (err) {
    console.error(`Error parsing variable ${varName}:`, err.message);
    return [];
  }
}

async function run() {
  const ROOT = process.cwd();
  
  // 1. Read files
  const rdsMd = fs.readFileSync(path.join(ROOT, 'rds_extracted.md'), 'utf8');
  const rdsScript = fs.readFileSync(path.join(ROOT, 'scripts', 'complete_rds_sections_iii_iv.mjs'), 'utf8');
  
  // Extract arrays from script
  const modules = extractArrayVariable(rdsScript, 'modules');
  const assumptions = extractArrayVariable(rdsScript, 'assumptions');
  const deps = extractArrayVariable(rdsScript, 'deps');
  const limits = extractArrayVariable(rdsScript, 'limits');
  const rules = extractArrayVariable(rdsScript, 'rules');
  const refs = extractArrayVariable(rdsScript, 'refs');
  
  console.log(`Extracted modules: ${modules.length}`);
  console.log(`Extracted assumptions: ${assumptions.length}`);
  console.log(`Extracted dependencies: ${deps.length}`);
  console.log(`Extracted limitations: ${limits.length}`);
  console.log(`Extracted business rules: ${rules.length}`);
  console.log(`Extracted references: ${refs.length}`);
  
  // 2. Extract sections from rds_extracted.md using markers
  // Let's divide rdsMd into lines
  const lines = rdsMd.split('\n');
  
  // Helper to extract lines between two heading markers
  function getLinesBetween(startHeading, endHeadingPattern) {
    let result = [];
    let record = false;
    for (const line of lines) {
      if (line.trim() === startHeading) {
        record = true;
        continue;
      }
      if (record && line.trim().match(endHeadingPattern)) {
        break;
      }
      if (record) {
        result.push(line);
      }
    }
    return result.join('\n').trim();
  }
  
  // Actors description
  const actorsContent = getLinesBetween('# I. Overview', /^#\s+II\./i);
  
  // Use case specifications (Section II)
  const ucContent = getLinesBetween('# II. Requirement Specifications', /^#\s+III\./i);
  
  // 3. Assemble SRS Markdown
  let srs = '';
  srs += `# SOFTWARE REQUIREMENT SPECIFICATION\n\n`;
  srs += `## Recruitment Workflow Management System (RMS)\n\n`;
  srs += `**Project Team:** SE20A05 Group 7\n`;
  srs += `**Last Updated:** July 2026\n`;
  srs += `**Status:** Final Draft (SRS v2.0)\n\n`;
  
  srs += `---\n\n`;
  srs += `# I. Record of Changes\n\n`;
  srs += `| Date | A*M, D | In charge | Change Description |\n`;
  srs += `| --- | --- | --- | --- |\n`;
  srs += `| 13/07/2026 | A | SE20A05 Group 7 | Initial SRS v2.0 for Recruitment Workflow Management System (RMS) |\n\n`;
  srs += `*A - Added, M - Modified, D - Deleted\n\n`;
  
  srs += `---\n\n`;
  srs += `# II. Software Requirement Specification\n\n`;
  srs += `## 1. Product Overview\n\n`;
  srs += `### Executive Summary\n`;
  srs += `Works Recruiter is an **internal enterprise Recruitment Workflow Management System (RMS)** that digitizes, automates, and optimizes the end-to-end hiring workflow across the organization. The system enforces a mandatory approval pipeline — **Trưởng Phòng Ban → Phòng Tuyển Dụng / Trưởng Phòng Nhân Sự → Admin (Sếp/Giám Đốc)** — ensuring every recruitment activity is plan-locked and fully traceable.\n\n`;
  srs += `The system supports a 4-actor enterprise hierarchy — Department Head, HR Manager, Admin/Boss, and Candidate — with a 13-state recruitment request lifecycle. AI is used strictly as a utility for CV text extraction and semantic search (pgvector), not for scoring or decision-making.\n\n`;
  
  srs += `### Technology Stack\n\n`;
  srs += `| Layer | Technology | Description |\n`;
  srs += `| --- | --- | --- |\n`;
  srs += `| **Runtime** | Node.js (>= 22) | High-performance Javascript execution environment |\n`;
  srs += `| **Language** | TypeScript (^5.8.3) | Static typing for type safety and developer productivity |\n`;
  srs += `| **Framework** | NestJS (^11.1.0) | Structure-oriented microservice framework |\n`;
  srs += `| **Database** | PostgreSQL 16 | Transactional relational storage with pgvector support |\n`;
  srs += `| **ORM** | Prisma (^6.8.2) | Modern Database client for type-safe database queries |\n`;
  srs += `| **Queue** | BullMQ + Redis 7 | Asynchronous job scheduler and background queue processing |\n`;
  srs += `| **Frontend** | React 19 + Vite 6 | High-speed Single Page Application (SPA) frontend |\n`;
  srs += `| **Vector Search** | pgvector (384) | 384-dimensional semantic search for CV matching |\n`;
  srs += `| **AI Model** | Xenova Transformers | Local inference with all-MiniLM-L6-v2 model for embeddings |\n\n`;
  
  srs += `### Repository and Architecture Structure\n\n`;
  srs += `The repository is organized as a Turborepo monorepo:\n`;
  srs += `- \`services/gateway\`: NestJS HTTP Gateway entry point. Communicates with microservices via TCP.\n`;
  srs += `- \`services/identity\`: User authentication, roles, organization, and department management.\n`;
  srs += `- \`services/recruiting\`: Recruitment request lifecycle, plans, and hiring decision workflows.\n`;
  srs += `- \`services/profiles\`: Candidate profiles, CV data parsing, and semantic vector search.\n`;
  srs += `- \`services/interview\`: Interview schedules, feedback collection, and evaluator scores.\n`;
  srs += `- \`services/notification\`: Outbound emails and in-app SSE notifications.\n`;
  srs += `- \`services/worker\`: BullMQ background processing for heavy tasks (embeddings, reminders).\n`;
  srs += `- \`packages/contracts\`: Shared single-source-of-truth Zod schemas and TypeScript types.\n`;
  srs += `- \`packages/database\`: Prisma schemas and migrations.\n`;
  srs += `- \`webapp\`: React SPA client application.\n\n`;
  
  srs += `## 2. User Requirements\n\n`;
  srs += `### 2.1 Actors\n\n`;
  srs += `| Actor | Description |\n`;
  srs += `| --- | --- |\n`;
  srs += `| **Admin** | Quản trị hệ thống, quản lý người dùng/phòng ban, duyệt yêu cầu/kế hoạch, ra quyết định tuyển dụng cuối cùng, xem báo cáo. |\n`;
  srs += `| **HR Manager** | Điều phối tuyển dụng: review request, lập kế hoạch, phân công task, quản lý campaign, CV, phỏng vấn, offer và pipeline. |\n`;
  srs += `| **Department Head** | Tạo nhu cầu tuyển dụng, theo dõi tiến độ, tham gia hội đồng phỏng vấn và gửi feedback. |\n`;
  srs += `| **Candidate** | Đăng ký tài khoản, quản lý hồ sơ/CV, theo dõi thông báo/phỏng vấn, phản hồi offer. |\n`;
  srs += `| **System / Worker** | Tác nhân nền xử lý CV, embedding, email, notification, reminder, audit log và health check. |\n\n`;
  
  srs += `### 2.2 Use Cases\n\n`;
  srs += `#### 2.2.1 Diagram(s)\n\n`;
  srs += `The unified system use case diagram is documented in: [docs/system-use-case.puml](file:///${ROOT.replace(/\\/g, '/')}/docs/system-use-case.puml)\n\n`;
  srs += `*(Image embed references are preserved in the DOCX file representation)*\n\n`;
  
  srs += `#### 2.2.2 Descriptions\n\n`;
  srs += ucContent + `\n\n`;
  
  srs += `---\n\n`;
  srs += `# III. Functional Requirements\n\n`;
  srs += `## 3.1 System Functional Overview\n\n`;
  srs += `### 3.1.1 Screens Flow\n\n`;
  srs += `The screen flow navigation maps roles to permitted workflows. Diagrams are referenced in:\n`;
  srs += `- Admin Screen Flow: \`docs/admin-screen-flow.uml\`\n`;
  srs += `- HR Screen Flow: \`docs/hr-screen-flow.uml\`\n`;
  srs += `- Department Head Screen Flow: \`docs/department-head-screen-flow.uml\`\n`;
  srs += `- Candidate Screen Flow: \`docs/candidate-public-screen-flow.uml\`\n\n`;
  
  srs += `### 3.1.2 Screen Descriptions\n\n`;
  // Extract screen descriptions table or list
  const screenDescLines = [];
  let inScreenDesc = false;
  for (const line of lines) {
    if (line.includes('### 2.2 Screen Descriptions')) {
      inScreenDesc = true;
      continue;
    }
    if (inScreenDesc && line.startsWith('### ')) {
      break;
    }
    if (inScreenDesc) {
      screenDescLines.push(line);
    }
  }
  srs += screenDescLines.join('\n').trim() + `\n\n`;
  
  srs += `### 3.1.3 Screen Authorization\n\n`;
  const authLines = [];
  let inAuth = false;
  for (const line of lines) {
    if (line.includes('### 2.3 Screen Authorization')) {
      inAuth = true;
      continue;
    }
    if (inAuth && line.startsWith('### ')) {
      break;
    }
    if (inAuth) {
      authLines.push(line);
    }
  }
  srs += authLines.join('\n').trim() + `\n\n`;
  
  srs += `### 3.1.4 Non-Screen Functions\n\n`;
  const nonUiLines = [];
  let inNonUi = false;
  for (const line of lines) {
    if (line.includes('### 2.4 Non-UI Functions')) {
      inNonUi = true;
      continue;
    }
    if (inNonUi && line.startsWith('### ')) {
      break;
    }
    if (inNonUi) {
      nonUiLines.push(line);
    }
  }
  srs += nonUiLines.join('\n').trim() + `\n\n`;
  
  srs += `### 3.1.5 Entity Relationship Diagram\n\n`;
  srs += `The enterprise database relational schema uses pgvector for semantic index and matches the models defined in:\n`;
  srs += `Database Schema model: [packages/database/prisma/schema.prisma](file:///${ROOT.replace(/\\/g, '/')}/packages/database/prisma/schema.prisma)\n\n`;
  
  srs += `## Detailed Functional Modules\n\n`;
  
  // Format the 8 design modules
  let sectionIndex = 2;
  for (const m of modules) {
    srs += `---\n\n`;
    srs += `## 3.${sectionIndex} ${m.title}\n\n`;
    srs += `### 3.${sectionIndex}.1 Screen / Function Description\n`;
    srs += `${m.desc}\n\n`;
    srs += `*Related Use Cases:* ${m.ucs}\n\n`;
    
    srs += `#### UI Design and Components\n\n`;
    srs += `| Field / Component | Field Type | Description |\n`;
    srs += `| --- | --- | --- |\n`;
    for (const f of m.fields) {
      srs += `| ${f[0]} | ${f[1]} | ${f[2]} |\n`;
    }
    srs += `\n`;
    
    srs += `#### Database Access\n\n`;
    srs += `| Table / Store | CRUD | Description |\n`;
    srs += `| --- | --- | --- |\n`;
    for (const d of m.db) {
      srs += `| ${d[0]} | ${d[1]} | ${d[2]} |\n`;
    }
    srs += `\n`;
    
    srs += `#### API / Implementation Design\n\n`;
    srs += `${m.impl}\n\n`;
    srs += `*Data-access rule:* All mutations are validated and authorized before Prisma/queue operations. Queries are parameterized; passwords, tokens, and secrets are never returned in API payloads.\n\n`;
    
    sectionIndex++;
  }
  
  srs += `---\n\n`;
  srs += `# IV. Non-Functional Requirements\n\n`;
  srs += `## 4.1 External Interfaces\n\n`;
  srs += `- **SMTP Email Server:** System requires connection parameters to outbound email servers to distribute OTP and reminder notices.\n`;
  srs += `- **Google Calendar API:** Enables optional interviewer connection for Meet links and schedules.\n`;
  srs += `- **Supabase API:** Optional authorization connection backing OAuth login sessions.\n\n`;
  
  srs += `## 4.2 Quality Attributes\n\n`;
  srs += `### 4.2.1 Usability\n`;
  srs += `- Scoped roles permit single-page dashboard access customized for specific tasks.\n`;
  srs += `- Forms contain field-validation feedback on both frontend (Zod validation) and backend.\n\n`;
  srs += `### 4.2.2 Reliability\n`;
  srs += `- Asynchronous operations (BullMQ) contain automatic retry logic with exponential backoff configurations.\n`;
  srs += `- Background queue items are idempotent to prevent double-email or double-notification deliveries.\n\n`;
  srs += `### 4.2.3 Performance\n`;
  srs += `- CV parsing and Xenova-backed embedding generation are executed out-of-band in worker threads to prevent main Gateway event loop blocks.\n`;
  srs += `- Talent pool searches leverage pgvector index optimization (\`ivfflat\`) to maintain sub-second response queries.\n\n`;
  
  srs += `---\n\n`;
  srs += `# 05. Requirement Appendix\n\n`;
  srs += `## 5.1 Business Rules\n\n`;
  srs += `| ID | Category | Rule Definition |\n`;
  srs += `| --- | --- | --- |\n`;
  for (const r of rules) {
    srs += `| ${r[0]} | ${r[1]} | ${r[2]} |\n`;
  }
  srs += `\n\n`;
  
  srs += `## 5.2 Assumptions & Dependencies\n\n`;
  srs += `### Assumptions\n\n`;
  srs += `| ID | Assumption |\n`;
  srs += `| --- | --- |\n`;
  for (const a of assumptions) {
    srs += `| ${a[0]} | ${a[1]} |\n`;
  }
  srs += `\n\n`;
  
  srs += `### Dependencies\n\n`;
  srs += `| ID | Dependency |\n`;
  srs += `| --- | --- |\n`;
  for (const d of deps) {
    srs += `| ${d[0]} | ${d[1]} |\n`;
  }
  srs += `\n\n`;
  
  srs += `## 5.3 Limitations & Exclusions\n\n`;
  srs += `| ID | Limitation / Exclusion |\n`;
  srs += `| --- | --- |\n`;
  for (const l of limits) {
    srs += `| ${l[0]} | ${l[1]} |\n`;
  }
  srs += `\n\n`;
  
  srs += `## 5.4 Traceability and Technical References\n\n`;
  srs += `| Area | Repository Reference |\n`;
  srs += `| --- | --- |\n`;
  for (const r of refs) {
    srs += `| ${r[0]} | ${r[1]} |\n`;
  }
  srs += `\n`;
  
  // Write to file
  const outPath = path.join(ROOT, 'docs', 'D10_RT02_SRS_v2.0.md');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, srs, 'utf8');
  console.log(`Assembled SRS Markdown written to ${outPath}`);
}

run().catch(console.error);
