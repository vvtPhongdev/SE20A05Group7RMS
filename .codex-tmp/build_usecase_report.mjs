import fs from 'fs';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import { DOMParser } from '@xmldom/xmldom';

const templatePath = 'docs/Report/Template2_RDS Document.docx';
const sourcePath = 'docs/use-case-specifications.md';
const outPath = 'docs/Report/Bao_Cao_RDS_RMS_UseCase.docx';

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function clean(value) {
  return String(value ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function splitRow(line) {
  return line.trim().slice(1, -1).split('|').map((cell) => clean(cell));
}

function parseMarkdownTable(section) {
  return section
    .split(/\r?\n/)
    .filter((line) => /^\|.+\|$/.test(line.trim()))
    .filter((line) => !/^\|\s*-+/.test(line.trim()))
    .map(splitRow);
}

function sectionBetween(markdown, startHeading, endHeadingRegex) {
  const start = markdown.indexOf(startHeading);
  if (start < 0) return '';
  const afterStart = markdown.slice(start + startHeading.length);
  const endMatch = afterStart.match(endHeadingRegex);
  return endMatch ? afterStart.slice(0, endMatch.index) : afterStart;
}

function parseDetails(markdown) {
  const details = new Map();
  const re = /^### (UC-\d+) - (.+?)\r?\n([\s\S]*?)(?=^### UC-\d+ - |^## 4\.|$)/gm;
  let match;
  while ((match = re.exec(markdown))) {
    const [, id, title, body] = match;
    const fields = {};
    for (const row of parseMarkdownTable(body)) {
      if (row.length >= 2 && row[0] !== 'Field') {
        fields[row[0]] = row.slice(1).join(' | ');
      }
    }
    details.set(id, { id, title: clean(title), fields });
  }
  return details;
}

function run(text, options = {}) {
  const {
    bold,
    italic,
    color = '000000',
    size = 21,
    font = 'Arial',
    preserve = true,
  } = options;
  const props = [
    `<w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}"/>`,
    bold ? '<w:b/><w:bCs/>' : '',
    italic ? '<w:i/><w:iCs/>' : '',
    `<w:color w:val="${color}"/>`,
    `<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>`,
  ].join('');
  const space = preserve ? ' xml:space="preserve"' : '';
  return `<w:r><w:rPr>${props}</w:rPr><w:t${space}>${esc(text)}</w:t></w:r>`;
}

function para(text = '', options = {}) {
  const {
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
  } = options;
  const pPr = [
    keepNext ? '<w:keepNext/>' : '',
    pageBreakBefore ? '<w:pageBreakBefore/>' : '',
    align ? `<w:jc w:val="${align}"/>` : '',
    `<w:spacing w:before="${before}" w:after="${after}" w:line="${line}" w:lineRule="auto"/>`,
    indentLeft ? `<w:ind w:left="${indentLeft}"${hanging ? ` w:hanging="${hanging}"` : ''}/>` : '',
  ].join('');
  return `<w:p><w:pPr>${pPr}</w:pPr>${run(text, { bold, italic, color, size, font })}</w:p>`;
}

function multiPara(text, options = {}) {
  const lines = clean(text).split('\n').filter(Boolean);
  if (lines.length === 0) return para('', options);
  return lines.map((line) => para(line, options)).join('');
}

function heading(level, text, options = {}) {
  const config = {
    1: { size: 31, color: '1F4E79', before: 360, after: 160 },
    2: { size: 25, color: '1F4E79', before: 260, after: 120 },
    3: { size: 22, color: '333333', before: 180, after: 80 },
  }[level];
  return para(text, { keepNext: true, bold: true, ...config, ...options });
}

function pageBreak() {
  return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
}

function bullet(text, level = 0) {
  return para(text, { indentLeft: 620 + level * 360, hanging: 240, after: 70, size: 20 });
}

function cell(content, width, options = {}) {
  const {
    fill,
    bold,
    align = 'left',
    valign = 'top',
    size = 18,
    color = '000000',
  } = options;
  const inner = Array.isArray(content)
    ? content.map((item) => (typeof item === 'string' ? multiPara(item, { after: 35, line: 235, bold, align, size, color }) : item)).join('')
    : multiPara(content, { after: 35, line: 235, bold, align, size, color });
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${fill ? `<w:shd w:fill="${fill}"/>` : ''}<w:vAlign w:val="${valign}"/><w:tcMar><w:top w:w="80" w:type="dxa"/><w:left w:w="95" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="95" w:type="dxa"/></w:tcMar></w:tcPr>${inner}</w:tc>`;
}

function table(headers, rows, widths, options = {}) {
  const tableWidth = widths.reduce((sum, width) => sum + width, 0);
  const borders = '<w:tblBorders><w:top w:val="single" w:sz="4" w:color="9FBAD0"/><w:left w:val="single" w:sz="4" w:color="9FBAD0"/><w:bottom w:val="single" w:sz="4" w:color="9FBAD0"/><w:right w:val="single" w:sz="4" w:color="9FBAD0"/><w:insideH w:val="single" w:sz="4" w:color="D9E2EA"/><w:insideV w:val="single" w:sz="4" w:color="D9E2EA"/></w:tblBorders>';
  const headerRow = `<w:tr><w:trPr><w:tblHeader/></w:trPr>${headers
    .map((header, i) => cell(header, widths[i], { fill: options.headerFill ?? '1F4E79', bold: true, color: 'FFFFFF', align: 'center', valign: 'center', size: options.headerSize ?? 18 }))
    .join('')}</w:tr>`;
  const bodyRows = rows
    .map((row, ri) => `<w:tr>${row
      .map((value, i) => cell(value, widths[i], {
        fill: ri % 2 === 1 ? 'F7FAFC' : undefined,
        align: options.aligns?.[i] ?? 'left',
        valign: options.valign ?? 'top',
        size: options.size ?? 18,
      }))
      .join('')}</w:tr>`)
    .join('');
  return `<w:tbl><w:tblPr><w:tblW w:w="${tableWidth}" w:type="dxa"/><w:tblLayout w:type="fixed"/>${borders}<w:tblCellMar><w:top w:w="80" w:type="dxa"/><w:left w:w="95" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="95" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${widths.map((width) => `<w:gridCol w:w="${width}"/>`).join('')}</w:tblGrid>${headerRow}${bodyRows}</w:tbl>${para('', { after: 70 })}`;
}

function callout(title, body, color = '70AD47') {
  return `<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:top w:val="single" w:sz="8" w:color="${color}"/><w:left w:val="single" w:sz="8" w:color="${color}"/><w:bottom w:val="single" w:sz="8" w:color="${color}"/><w:right w:val="single" w:sz="8" w:color="${color}"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="9000"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:tcW w:w="9000" w:type="dxa"/><w:shd w:fill="F0F6EC"/><w:tcMar><w:top w:w="130" w:type="dxa"/><w:left w:w="180" w:type="dxa"/><w:bottom w:w="130" w:type="dxa"/><w:right w:w="180" w:type="dxa"/></w:tcMar></w:tcPr>${para(title, { bold: true, color: '375623', after: 40, size: 21 })}${multiPara(body, { size: 20, after: 40 })}</w:tc></w:tr></w:tbl>${para('', { after: 80 })}`;
}

function idNumber(id) {
  return Number(id.replace(/\D/g, ''));
}

function actorMarks(actorText) {
  const text = actorText.toLowerCase();
  const allUsers = text.includes('all users') || text.includes('authenticated user');
  return {
    Admin: allUsers || text.includes('admin'),
    HR: allUsers || /\bhr\b/.test(text),
    'Department Head': allUsers || text.includes('department head'),
    Candidate: allUsers || text.includes('candidate') || text.includes('public'),
    'System/Worker': text.includes('system') || text.includes('worker'),
  };
}

function groupForModule(moduleName) {
  const module = moduleName.toLowerCase();
  if (module.includes('auth') || module.includes('identity') || module.includes('security') || module.includes('health')) return 'Access, Identity & Governance';
  if (module.includes('recruiting') || module.includes('planning') || module.includes('task')) return 'Recruitment Request & Planning';
  if (module.includes('job posting') || module.includes('application') || module.includes('profile') || module.includes('cv') || module.includes('talent') || module.includes('evaluation')) return 'Sourcing, CV & Talent Intelligence';
  if (module.includes('interview') || module.includes('hiring')) return 'Interview, Result & Hiring Decision';
  if (module.includes('offer') || module.includes('notification') || module.includes('dashboard') || module.includes('report')) return 'Offer, Notification & Reporting';
  return 'Other Supporting Capabilities';
}

function ucRange(ids) {
  const numbers = ids.map(idNumber).sort((a, b) => a - b);
  const ranges = [];
  let start = numbers[0];
  let prev = numbers[0];
  for (const n of numbers.slice(1)) {
    if (n === prev + 1) {
      prev = n;
    } else {
      ranges.push(start === prev ? `UC-${String(start).padStart(2, '0')}` : `UC-${String(start).padStart(2, '0')}..UC-${String(prev).padStart(2, '0')}`);
      start = prev = n;
    }
  }
  if (numbers.length) {
    ranges.push(start === prev ? `UC-${String(start).padStart(2, '0')}` : `UC-${String(start).padStart(2, '0')}..UC-${String(prev).padStart(2, '0')}`);
  }
  return ranges.join(', ');
}

const markdown = fs.readFileSync(sourcePath, 'utf8');
const templateBytes = fs.readFileSync(templatePath);
const zip = await JSZip.loadAsync(templateBytes);
const originalDocumentXml = await zip.file('word/document.xml').async('text');
const sectPrMatch = originalDocumentXml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/);
const sectPr = sectPrMatch
  ? sectPrMatch[0]
  : '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>';

const actorSection = sectionBetween(markdown, '## 1. Actors', /^## 2\./m);
const catalogSection = sectionBetween(markdown, '## 2. Use Case Catalog', /^## 3\./m);
const rulesSection = sectionBetween(markdown, '## 4. Cross-Cutting Business Rules', /^## /m);

const actors = parseMarkdownTable(actorSection)
  .filter((row) => row[0] !== 'Actor')
  .map(([actor, description]) => ({ actor, description }));

const catalog = parseMarkdownTable(catalogSection)
  .filter((row) => row[0] !== 'UC ID')
  .map(([id, name, primaryActor, module]) => ({
    id,
    name,
    primaryActor,
    module,
    group: groupForModule(module),
  }))
  .sort((a, b) => idNumber(a.id) - idNumber(b.id));

const details = parseDetails(markdown);
const rules = parseMarkdownTable(rulesSection)
  .filter((row) => row[0] !== 'ID')
  .map(([id, rule]) => ({ id, rule }));

if (catalog.length !== 61) {
  throw new Error(`Expected 61 use cases, found ${catalog.length}.`);
}

const groupOrder = [
  'Access, Identity & Governance',
  'Recruitment Request & Planning',
  'Sourcing, CV & Talent Intelligence',
  'Interview, Result & Hiring Decision',
  'Offer, Notification & Reporting',
  'Other Supporting Capabilities',
];

const groupRows = groupOrder
  .map((group) => {
    const items = catalog.filter((uc) => uc.group === group);
    if (!items.length) return null;
    const actorsInGroup = new Set();
    for (const uc of items) {
      for (const [actor, marked] of Object.entries(actorMarks(uc.primaryActor))) {
        if (marked) actorsInGroup.add(actor);
      }
    }
    return [
      group,
      String(items.length),
      ucRange(items.map((uc) => uc.id)),
      [...actorsInGroup].join(', '),
    ];
  })
  .filter(Boolean);

const modules = [...new Set(catalog.map((uc) => uc.module))];
const moduleRows = modules.map((module) => {
  const items = catalog.filter((uc) => uc.module === module);
  const groups = [...new Set(items.map((uc) => uc.group))].join(', ');
  return [module, groups, String(items.length), items.map((uc) => uc.id).join(', ')];
});

const roleMatrixRows = groupOrder
  .map((group) => {
    const items = catalog.filter((uc) => uc.group === group);
    if (!items.length) return null;
    const byActor = ['Admin', 'HR', 'Department Head', 'Candidate', 'System/Worker'].map((actor) => {
      const ids = items.filter((uc) => actorMarks(uc.primaryActor)[actor]).map((uc) => uc.id);
      return ids.length ? ids.join(', ') : '-';
    });
    return [group, ...byActor];
  })
  .filter(Boolean);

const journeyRows = [
  ['1', 'Access & account setup', 'UC-01..UC-15, UC-60, UC-61', 'User enters the system, gets the right role, profile, organization scope and secure access.'],
  ['2', 'Recruitment demand intake', 'UC-16..UC-24', 'Department Head creates hiring demand; HR/Admin review, assign, decide and preserve audit history.'],
  ['3', 'Planning and execution readiness', 'UC-25..UC-31', 'HR builds overall plan and task plan; Admin approval unlocks downstream recruiting operations.'],
  ['4', 'Sourcing, CV and candidate intelligence', 'UC-32..UC-45', 'System publishes jobs, collects applications/CVs, parses CVs, enables screening and talent search.'],
  ['5', 'Interview and decision loop', 'UC-46..UC-54', 'HR schedules interviews, panel records feedback, Admin reviews results and makes final hiring decision.'],
  ['6', 'Offer, communication and management insight', 'UC-55..UC-59', 'HR/Admin handle offer letters, candidate responds, notifications and reports keep stakeholders aligned.'],
];

const catalogRows = catalog.map((uc) => [uc.id, uc.name, uc.primaryActor, uc.module, uc.group]);

function compactDetailRows(items) {
  return items.map((uc) => {
    const detail = details.get(uc.id)?.fields ?? {};
    return [
      uc.id,
      uc.name,
      detail.Trigger || '-',
      detail.Description || '-',
      detail.Postconditions || '-',
      detail['Related Endpoints'] || detail['Related Screens'] || detail['Related Components'] || '-',
    ];
  });
}

let body = '';
body += para('Recruitment Management System (RMS)', { align: 'center', bold: true, size: 30, color: '1F4E79', before: 520, after: 120 });
body += para('Use Case Report', { align: 'center', bold: true, size: 42, color: '1F4E79', before: 140, after: 180 });
body += para('Thiết kế lại phần Use Case dựa trên template RDS và use-case-specifications.md', { align: 'center', size: 22, color: '555555', after: 260 });
body += table(
  ['Document', 'Value'],
  [
    ['Source template', 'docs/Report/Template2_RDS Document.docx'],
    ['Use Case source', 'docs/use-case-specifications.md'],
    ['Scope', 'Full RMS system use case coverage'],
    ['Total use cases', `${catalog.length} use cases, ${actors.length} actors, ${modules.length} module/feature labels`],
    ['Role model', 'User-facing HR role is unified as HR; source code maps it to HR_LEADER. The report does not split HR into separate sub-roles.'],
  ],
  [2600, 6400],
  { size: 19 },
);
body += callout('Coverage objective', 'Phần Use Case này không chỉ liệt kê từng UC riêng lẻ, mà gom theo actor, module, hành trình nghiệp vụ và ma trận coverage. Nhờ đó người đọc có thể kiểm tra nhanh rằng báo cáo bao quát đầy đủ từ đăng nhập, nhu cầu tuyển dụng, lập kế hoạch, CV/AI, phỏng vấn, quyết định tuyển dụng, offer, notification, báo cáo đến bảo mật/health check.');
body += pageBreak();

body += heading(1, '1. Document Control');
body += table(
  ['Version', 'Date', 'Author', 'Description'],
  [['1.0', '2026-07-06', 'SE20A05 Group 7', 'Redesigned Use Case report section using the current full-system UC catalog.']],
  [1100, 1600, 2500, 3800],
  { size: 18 },
);
body += heading(1, '2. Use Case Coverage Summary');
body += para('The Use Case section is organized around five views: actors, end-to-end business journeys, functional coverage groups, detailed UC catalog and cross-cutting business rules.', { size: 20 });
body += table(
  ['Metric', 'Value', 'Meaning'],
  [
    ['Actors', String(actors.length), 'Admin, HR, Department Head, Candidate and System/Worker responsibilities are represented.'],
    ['Use cases', String(catalog.length), 'Every use case from UC-01 to UC-61 is included.'],
    ['Coverage groups', String(groupRows.length), 'UCs are grouped into business capability areas for system-level review.'],
    ['Feature labels', String(modules.length), 'Original module/feature tags from the specification are preserved.'],
  ],
  [1900, 1300, 5800],
  { size: 18, aligns: ['left', 'center', 'left'] },
);
body += heading(2, '2.1 Actors');
body += table(['Actor', 'System Responsibility'], actors.map((item) => [item.actor, item.description]), [2200, 6800], { size: 18 });

body += heading(2, '2.2 End-to-End Business Journey');
body += table(['Step', 'Journey', 'UC Coverage', 'Business Meaning'], journeyRows, [700, 2300, 2200, 3800], { size: 18, aligns: ['center', 'left', 'left', 'left'] });

body += heading(2, '2.3 Functional Coverage Groups');
body += table(['Coverage Group', 'UC Count', 'UC Range', 'Covered Actors'], groupRows, [2900, 1100, 2500, 2500], { size: 18, aligns: ['left', 'center', 'left', 'left'] });

body += heading(2, '2.4 Module Coverage');
body += table(['Module / Feature', 'Coverage Group', 'Count', 'Use Cases'], moduleRows, [1900, 2800, 900, 3400], { size: 17, aligns: ['left', 'left', 'center', 'left'] });

body += heading(2, '2.5 Actor Coverage Matrix');
body += table(['Coverage Group', 'Admin', 'HR', 'Department Head', 'Candidate', 'System / Worker'], roleMatrixRows, [2100, 1450, 1450, 1450, 1450, 1100], { size: 15 });
body += pageBreak();

body += heading(1, '3. Full Use Case Catalog');
body += para('This catalog preserves all UC IDs, names, primary actors and module labels from the source specification. It is the baseline traceability table for the rest of the RDS document.', { size: 20 });
body += table(['UC ID', 'Use Case', 'Primary Actor', 'Module / Feature', 'Coverage Group'], catalogRows, [850, 2850, 1900, 1600, 1800], { size: 16, aligns: ['center', 'left', 'left', 'left', 'left'] });
body += pageBreak();

body += heading(1, '4. Compact Use Case Specifications');
body += para('The compact specification below keeps the report readable while still covering every system UC. For each UC, it records the trigger, business goal, resulting state and implementation trace reference from the detailed markdown source.', { size: 20 });

for (const group of groupOrder) {
  const items = catalog.filter((uc) => uc.group === group);
  if (!items.length) continue;
  body += heading(2, group);
  body += table(
    ['ID', 'Use Case', 'Trigger', 'Goal / Description', 'Postcondition', 'Trace Reference'],
    compactDetailRows(items),
    [650, 1800, 1900, 2100, 1550, 1000],
    { size: 14, aligns: ['center', 'left', 'left', 'left', 'left', 'left'] },
  );
}

body += pageBreak();
body += heading(1, '5. Cross-Cutting Business Rules');
body += para('These rules apply across multiple UCs and should be referenced by screen design, API authorization, workflow validation and test cases.', { size: 20 });
body += table(['Rule ID', 'Rule'], rules.map((rule) => [rule.id, rule.rule]), [1100, 7900], { size: 18, aligns: ['center', 'left'] });

body += heading(1, '6. Design Notes for the RDS Use Case Section');
body += bullet('Keep UC IDs stable across requirement, design, API, testing and issue tracking artifacts.');
body += bullet('Use the coverage groups as the top-level report structure, then place the full UC catalog and compact detail tables underneath.');
body += bullet('Represent HR as one unified business role in the report. The implementation role value is HR_LEADER, and the report does not split HR into separate sub-roles.');
body += bullet('For testing traceability, map each UI/API test case back to one or more UC IDs from the catalog.');

const newDocumentXml = originalDocumentXml.replace(/<w:body>[\s\S]*<\/w:body>/, `<w:body>${body}${sectPr}</w:body>`);
if (newDocumentXml === originalDocumentXml) {
  throw new Error('Could not replace document body in template.');
}

zip.file('word/document.xml', newDocumentXml);
const output = await zip.generateAsync({ type: 'nodebuffer' });
fs.writeFileSync(outPath, output);

const generatedZip = await JSZip.loadAsync(output);
const generatedXml = await generatedZip.file('word/document.xml').async('text');
const doc = new DOMParser().parseFromString(generatedXml, 'application/xml');
if (!doc.getElementsByTagNameNS(W, 'body').length) {
  throw new Error('Generated document has no Word body.');
}
const extracted = await mammoth.extractRawText({ path: outPath });
const checks = {
  catalogCount: catalog.length,
  detailCount: details.size,
  hasUC01: extracted.value.includes('UC-01'),
  hasUC61: extracted.value.includes('UC-61'),
  hasNoRecruiterRole: !/HR_RECRUITER|HR Recruiter/i.test(extracted.value),
  output: outPath,
};
console.log(JSON.stringify(checks, null, 2));
