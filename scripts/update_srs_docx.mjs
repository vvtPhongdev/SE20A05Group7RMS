import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

const esc = (s='') => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const replaceTextInParagraph = (pXml, searchStr, replaceStr) => {
  const text = [...pXml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map(q => q[1]).join('');
  if (text.includes(searchStr)) {
    const newText = text.replace(new RegExp(searchStr, 'g'), replaceStr);
    const firstRunMatch = pXml.match(/<w:r(?:\s[^>]*)?>/);
    if (firstRunMatch) {
      const pPrMatch = pXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
      const pPr = pPrMatch ? pPrMatch[0] : '';
      const firstRunIndex = firstRunMatch.index;
      const firstRunEndIndex = pXml.indexOf('</w:r>', firstRunIndex) + 6;
      const firstRunXml = pXml.substring(firstRunIndex, firstRunEndIndex);
      const rPrMatch = firstRunXml.match(/<w:rPr>[\s\S]*?<\/w:rPr>/);
      const rPr = rPrMatch ? rPrMatch[0] : '';
      return `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${esc(newText)}</w:t></w:r></w:p>`;
    }
  }
  return pXml;
};

// Helper to wrap paragraph XML
const p = (text, {level=0, bold=false, italic=false, center=false, breakBefore=false, keep=false, size=null, color=null}={}) => {
  const sizes = { 0: 22, 1: 32, 2: 28, 3: 24, 4: 22 };
  const sz = size || sizes[level] || 22;
  const before = level === 1 ? 320 : level === 2 ? 240 : level === 3 ? 180 : 40;
  const after = level ? 120 : 100;
  const num = level ? `<w:outlineLvl w:val="${Math.min(level-1, 8)}"/>` : '';
  const pStyle = level ? `<w:pStyle w:val="Heading${level}"/>` : '';
  
  return `<w:p><w:pPr>${pStyle}${breakBefore ? '<w:pageBreakBefore/>' : ''}${keep || level ? '<w:keepNext/>' : ''}<w:spacing w:before="${before}" w:after="${after}" w:line="276" w:lineRule="auto"/>${center ? '<w:jc w:val="center"/>' : ''}${num}</w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="${sz}"/>${bold || level ? '<w:b/>' : ''}${italic ? '<w:i/>' : ''}${color ? `<w:color w:val="${color}"/>` : ''}</w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
};

// Helper to wrap list item XML
const bullet = (text) => {
  return `<w:p><w:pPr><w:ind w:left="540" w:hanging="270"/><w:spacing w:after="70" w:line="276" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">• ${esc(text)}</w:t></w:r></w:p>`;
};

// Helper to wrap cell XML
const cell = (text, width, {head=false, center=false}={}) => {
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/><w:tcMar><w:top w:w="90" w:type="dxa"/><w:left w:w="110" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:right w:w="110" w:type="dxa"/></w:tcMar>${head ? '<w:shd w:fill="D9EAF7"/>' : ''}<w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:spacing w:after="20" w:line="240" w:lineRule="auto"/>${center ? '<w:jc w:val="center"/>' : ''}</w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="19"/>${head ? '<w:b/>' : ''}</w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p></w:tc>`;
};

// Helper to wrap table XML
const table = (headers, rows, widths) => {
  return `<w:tbl><w:tblPr><w:tblW w:w="${widths.reduce((a,b)=>a+b,0)}" w:type="dxa"/><w:tblInd w:w="0" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:top w:val="single" w:sz="6" w:color="7F7F7F"/><w:left w:val="single" w:sz="6" w:color="7F7F7F"/><w:bottom w:val="single" w:sz="6" w:color="7F7F7F"/><w:right w:val="single" w:sz="6" w:color="7F7F7F"/><w:insideH w:val="single" w:sz="4" w:color="BFBFBF"/><w:insideV w:val="single" w:sz="4" w:color="BFBFBF"/></w:tblBorders></w:tblPr><w:tblGrid>${widths.map(w => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid><w:tr><w:trPr><w:tblHeader/></w:trPr>${headers.map((h,i) => cell(h, widths[i], {head:true, center:true})).join('')}</w:tr>${rows.map(r => `<w:tr>${r.map((v,i) => cell(v, widths[i], {center: i===0 || i===1})).join('')}</w:tr>`).join('')}</w:tbl>${p('')}`;
};

// Extract array variables from the script
function extractArrayVariable(fileContent, varName) {
  const startIndex = fileContent.indexOf(`const ${varName}=[` || `const ${varName} = [`);
  if (startIndex < 0) return [];
  let bracketCount = 1;
  let index = fileContent.indexOf('[', startIndex) + 1;
  let startOfArray = index - 1;
  while (index < fileContent.length && bracketCount > 0) {
    if (fileContent[index] === '[') bracketCount++;
    else if (fileContent[index] === ']') bracketCount--;
    index++;
  }
  const arrayText = fileContent.substring(startOfArray, index);
  try {
    const fn = new Function(`return ${arrayText};`);
    return fn();
  } catch (err) {
    console.error(`Error parsing variable ${varName}:`, err.message);
    return [];
  }
}

async function run() {
  const ROOT = process.cwd();
  const srcDocxPath = path.join(ROOT, 'Template2_RDS Document (1).docx');
  const tgtDocxPath = path.join(ROOT, 'D10_RT02_SRS_v2.0.docx');
  const rdsScriptPath = path.join(ROOT, 'scripts', 'complete_rds_sections_iii_iv.mjs');
  
  if (!fs.existsSync(srcDocxPath)) throw new Error(`Source docx not found: ${srcDocxPath}`);
  if (!fs.existsSync(tgtDocxPath)) throw new Error(`Target docx not found: ${tgtDocxPath}`);
  
  // 1. Load ZIP archives
  console.log('Loading DOCX archives...');
  const zipSrc = await JSZip.loadAsync(fs.readFileSync(srcDocxPath));
  const zipTgt = await JSZip.loadAsync(fs.readFileSync(tgtDocxPath));
  
  // 2. Read XML structures
  const xmlSrc = await zipSrc.file('word/document.xml').async('string');
  const xmlTgt = await zipTgt.file('word/document.xml').async('string');
  
  // 3. Extract array variables from RDS script for Section III (modules) and IV (appendix)
  console.log('Parsing configuration variables from script...');
  const rdsScript = fs.readFileSync(rdsScriptPath, 'utf8');
  const modules = extractArrayVariable(rdsScript, 'modules');
  const assumptions = extractArrayVariable(rdsScript, 'assumptions');
  const deps = extractArrayVariable(rdsScript, 'deps');
  const limits = extractArrayVariable(rdsScript, 'limits');
  const rules = extractArrayVariable(rdsScript, 'rules');
  const refs = extractArrayVariable(rdsScript, 'refs');
  
  // 4. Split source XML into block elements (paragraphs and tables)
  const blocksSrc = [...xmlSrc.matchAll(/(<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>|<w:tbl(?:\s[^>]*)?>[\s\S]*?<\/w:tbl>)/g)].map(m => m[0]);
  console.log(`Source XML blocks: ${blocksSrc.length}`);
  
  // Extract Section I: Overview (Block 87 to 521)
  const sectionIBlocks = blocksSrc.slice(87, 522).join('\n');
  // Extract Section II: Requirement Specifications (Block 522 to 827)
  const sectionIIBlocks = blocksSrc.slice(522, 828).join('\n');
  
  // 5. Build New Body XML content
  console.log('Assembling body content XML...');
  let content = '';
  
  // Chapter 1: Record of Changes
  content += p('I. Record of Changes', {level: 1, bold: true});
  content += table(
    ['Date', 'A*M, D', 'In charge', 'Change Description'],
    [
      ['13/07/2026', 'A', 'SE20A05 Group 7', 'Initial SRS v2.0 for Recruitment Workflow Management System (RMS)']
    ],
    [1500, 1000, 2000, 5580]
  );
  content += p('*A - Added, M - Modified, D - Deleted\n');
  
  // Chapter 2: Software Requirement Specification
  content += p('II. Software Requirement Specification', {level: 1, bold: true, breakBefore: true});
  
  // Section 1: Product Overview
  content += p('1. Product Overview', {level: 2, bold: true});
  content += p('Executive Summary', {level: 3, bold: true});
  content += p('Works Recruiter is an internal enterprise Recruitment Workflow Management System (RMS) that digitizes, automates, and optimizes the end-to-end hiring workflow across the organization. The system enforces a mandatory approval pipeline — Trưởng Phòng Ban → Phòng Tuyển Dụng / Trưởng Phòng Nhân Sự → Admin (Sếp/Giám Đốc) — ensuring every recruitment activity is plan-locked and fully traceable.');
  content += p('The system supports a 4-actor enterprise hierarchy — Department Head, HR Manager, Admin/Boss, and Candidate — with a 13-state recruitment request lifecycle. AI is used strictly as a utility for CV text extraction and semantic search (pgvector), not for scoring or decision-making.');
  
  content += p('Technology Stack', {level: 3, bold: true});
  content += table(
    ['Layer', 'Technology', 'Description'],
    [
      ['Runtime', 'Node.js (>= 22)', 'High-performance Javascript execution environment'],
      ['Language', 'TypeScript (^5.8.3)', 'Static typing for type safety and developer productivity'],
      ['Framework', 'NestJS (^11.1.0)', 'Structure-oriented microservice framework'],
      ['Database', 'PostgreSQL 16', 'Transactional relational storage with pgvector support'],
      ['ORM', 'Prisma (^6.8.2)', 'Modern Database client for type-safe database queries'],
      ['Queue', 'BullMQ + Redis 7', 'Asynchronous job scheduler and background queue processing'],
      ['Frontend', 'React 19 + Vite 6', 'High-speed Single Page Application (SPA) frontend'],
      ['Vector Search', 'pgvector (384)', '384-dimensional semantic search for CV matching'],
      ['AI Model', 'Xenova Transformers', 'Local inference with all-MiniLM-L6-v2 model for embeddings']
    ],
    [2500, 3000, 4580]
  );
  
  content += p('Repository and Architecture Structure', {level: 3, bold: true});
  content += p('The repository is organized as a Turborepo monorepo:');
  content += bullet('services/gateway: NestJS HTTP Gateway entry point. Communicates with microservices via TCP.');
  content += bullet('services/identity: User authentication, roles, organization, and department management.');
  content += bullet('services/recruiting: Recruitment request lifecycle, plans, and hiring decision workflows.');
  content += bullet('services/profiles: Candidate profiles, CV data parsing, and semantic vector search.');
  content += bullet('services/interview: Interview schedules, feedback collection, and evaluator scores.');
  content += bullet('services/notification: Outbound emails and in-app SSE notifications.');
  content += bullet('services/worker: BullMQ background processing for heavy tasks (embeddings, reminders).');
  content += bullet('packages/contracts: Shared single-source-of-truth Zod schemas and TypeScript types.');
  content += bullet('packages/database: Prisma database client and migration files.');
  content += bullet('webapp: React SPA client application.');
  
  // Section 2: User Requirements
  content += p('2. User Requirements', {level: 2, bold: true, breakBefore: true});
  // Inject Section I.1.1 (Actors) and Section I.1.2 (Use Cases)
  content += sectionIBlocks; // This will bring in: 1.1 Actors, 1.2 Use Cases (diagram + descriptions)
  
  // Inject Section II Use Case Descriptions UC-01 to UC-61 and RS-01 to RS-07
  content += sectionIIBlocks;
  
  // Section 3: Functional Requirements
  content += p('III. Functional Requirements', {level: 1, bold: true, breakBefore: true});
  
  // Section 3.1: System Functional Overview
  // We'll write the title and let the source section handle screen flow, descriptions, auth, non-UI, and ERD!
  // Note: source Overview contains screen flow (Block 165 to 521).
  // Block 165 starts with: "2. Overall Functionalities"
  // Block 473 starts with: "3. System High Level Design" (Database Design and Code Packages)
  // Let's inject them!
  const overviewFuncXml = blocksSrc.slice(165, 522).join('\n');
  content += overviewFuncXml;
  
  // Section 3.2 to 3.9: Detailed Functional Modules (from the 8 modules)
  let sectionIndex = 2;
  for (const m of modules) {
    content += p(`3.${sectionIndex} ${m.title}`, {level: 3, bold: true, breakBefore: true});
    content += p(`3.${sectionIndex}.1 Screen / Function Description`, {level: 4, bold: true});
    content += p(m.desc);
    content += p(`Related Use Cases: ${m.ucs}`, {italic: true});
    
    content += p('UI Design and Components', {level: 4, bold: true});
    content += table(
      ['Field / Component', 'Field Type', 'Description'],
      m.fields,
      [2100, 1800, 5460]
    );
    
    content += p('Database Access', {level: 4, bold: true});
    content += table(
      ['Table / Store', 'CRUD', 'Description'],
      m.db,
      [2350, 900, 6110]
    );
    
    content += p('API / Implementation Design', {level: 4, bold: true});
    content += p(m.impl);
    content += p('Data-access rule: All mutations are validated and authorized before Prisma/queue operations. Queries are parameterized through Prisma or safe pgvector helpers; passwords, tokens and secrets are never returned in API payloads.');
    
    sectionIndex++;
  }
  
  // Section 4: Non-Functional Requirements
  content += p('IV. Non-Functional Requirements', {level: 1, bold: true, breakBefore: true});
  content += p('1. External Interfaces', {level: 2, bold: true});
  content += bullet('SMTP Email Server: System requires connection parameters to outbound email servers to distribute OTP and reminder notices.');
  content += bullet('Google Calendar API: Enables optional interviewer connection for Meet links and schedules.');
  content += bullet('Supabase API: Optional authorization connection backing OAuth login sessions.');
  
  content += p('2. Quality Attributes', {level: 2, bold: true});
  content += p('2.1 Usability', {level: 3, bold: true});
  content += bullet('Scoped roles permit single-page dashboard access customized for specific tasks.');
  content += bullet('Forms contain field-validation feedback on both frontend (Zod validation) and backend.');
  
  content += p('2.2 Reliability', {level: 3, bold: true});
  content += bullet('Asynchronous operations (BullMQ) contain automatic retry logic with exponential backoff configurations.');
  content += bullet('Background queue items are idempotent to prevent double-email or double-notification deliveries.');
  
  content += p('2.3 Performance', {level: 3, bold: true});
  content += bullet('CV parsing and Xenova-backed embedding generation are executed out-of-band in worker threads to prevent main Gateway event loop blocks.');
  content += bullet('Talent pool searches leverage pgvector index optimization (ivfflat) to maintain sub-second response queries.');
  
  // Section 5: Requirement Appendix
  content += p('V. Requirement Appendix', {level: 1, bold: true, breakBefore: true});
  content += p('1. Business Rules', {level: 2, bold: true});
  content += table(
    ['ID', 'Category', 'Rule Definition'],
    rules,
    [1050, 1650, 6660]
  );
  
  content += p('2. Assumptions & Dependencies', {level: 2, bold: true});
  content += p('Assumptions', {level: 3, bold: true});
  content += table(
    ['ID', 'Assumption'],
    assumptions,
    [1200, 8160]
  );
  content += p('Dependencies', {level: 3, bold: true});
  content += table(
    ['ID', 'Dependency'],
    deps,
    [1200, 8160]
  );
  
  content += p('3. Limitations & Exclusions', {level: 2, bold: true});
  content += table(
    ['ID', 'Limitation / Exclusion'],
    limits,
    [1200, 8160]
  );
  
  content += p('4. Traceability and Technical References', {level: 2, bold: true});
  content += table(
    ['Area', 'Repository Reference'],
    refs,
    [2450, 6910]
  );
  
  // 6. Split target XML into block elements
  const blocksTgt = [...xmlTgt.matchAll(/(<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>|<w:tbl(?:\s[^>]*)?>[\s\S]*?<\/w:tbl>)/g)].map(m => m[0]);
  
  // Overwrite cover page title 'EYESPIRE' -> 'RMS - Recruitment Workflow Management System'
  console.log('Updating cover page...');
  const coverBlocks = blocksTgt.slice(0, 20).map(block => {
    let b = block;
    b = replaceTextInParagraph(b, 'EYESPIRE', 'Recruitment Workflow Management System (RMS)');
    b = replaceTextInParagraph(b, 'Da Nang, June 2025', 'Hanoi, July 2026');
    return b;
  });

  // Extract TOC blocks from source (24 to 86)
  console.log('Injecting correct Table of Contents from source...');
  const tocBlocks = blocksSrc.slice(24, 87);
  
  // The final document XML structure:
  // coverBlocks + tocBlocks + content + final section properties of target document
  const finalSectMatch = xmlTgt.match(/<w:sectPr(?:\s[^>]*)?>[\s\S]*?<\/w:sectPr>\s*<\/w:body>/);
  if (!finalSectMatch) throw new Error('Could not find final section properties in target document');
  const finalSect = finalSectMatch[0];
  
  const finalBodyXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${coverBlocks.join('\n')}\n${tocBlocks.join('\n')}\n${content}\n${finalSect}</w:document>`;
  
  // 7. Save document.xml back into target zip
  zipTgt.file('word/document.xml', finalBodyXml);
  
  // 8. Copy image files from source zip to target zip
  console.log('Copying image assets...');
  const mediaFiles = Object.keys(zipSrc.files).filter(f => f.startsWith('word/media/') && !zipSrc.files[f].dir);
  for (const mediaFile of mediaFiles) {
    const contentBuffer = await zipSrc.file(mediaFile).async('nodebuffer');
    zipTgt.file(mediaFile, contentBuffer);
    console.log(` - Copied: ${mediaFile}`);
  }
  
  // 9. Update Relationships (document.xml.rels)
  // We will build a clean rels xml file that keeps rId1 to rId5 of target, and adds rId7 to rId20 from source
  console.log('Updating document relationships...');
  const targetRelsXml = await zipTgt.file('word/_rels/document.xml.rels').async('string');
  const srcRelsXml = await zipSrc.file('word/_rels/document.xml.rels').async('string');
  
  // Extract target standard relationships (rId1 to rId5)
  const relsMatches = [...targetRelsXml.matchAll(/<Relationship\s+Id="([^"]+)"\s+Type="([^"]+)"\s+Target="([^"]+)"[^>]*\/>/gi)];
  const standardRels = relsMatches.filter(m => {
    const num = parseInt(m[1].replace('rId', ''));
    return num <= 5;
  });
  
  // Extract source image relationships (rId7 to rId20)
  const srcRelsMatches = [...srcRelsXml.matchAll(/<Relationship\s+Id="([^"]+)"\s+Type="([^"]+)"\s+Target="([^"]+)"[^>]*\/>/gi)];
  const imageRels = srcRelsMatches.filter(m => {
    const num = parseInt(m[1].replace('rId', ''));
    return num >= 7 && num <= 20;
  });
  
  let newRelsXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
  for (const r of standardRels) {
    newRelsXml += `<Relationship Id="${r[1]}" Type="${r[2]}" Target="${r[3]}"/>`;
  }
  for (const r of imageRels) {
    newRelsXml += `<Relationship Id="${r[1]}" Type="${r[2]}" Target="${r[3]}"/>`;
  }
  newRelsXml += '</Relationships>';
  
  zipTgt.file('word/_rels/document.xml.rels', newRelsXml);
  
  // 10. Enable updateFields in settings.xml
  if (zipTgt.file('word/settings.xml')) {
    let settings = await zipTgt.file('word/settings.xml').async('string');
    if (!settings.includes('<w:updateFields')) {
      settings = settings.replace('</w:settings>', '<w:updateFields w:val="true"/></w:settings>');
    }
    zipTgt.file('word/settings.xml', settings);
  }
  
  // 11. Generate bytes and save file
  console.log('Writing updated DOCX file...');
  const outBytes = await zipTgt.generateAsync({type: 'nodebuffer', compression: 'DEFLATE'});
  fs.writeFileSync(tgtDocxPath, outBytes);
  
  console.log(`Target document ${tgtDocxPath} has been successfully updated!`);
}

run().catch(console.error);
