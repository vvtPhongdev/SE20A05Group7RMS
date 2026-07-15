import fs from 'fs';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import { DOMParser } from '@xmldom/xmldom';

const templatePath = 'docs/Report/Template2_RDS Document.docx';
const sourcePath = 'docs/use-case-specifications.md';
const outPath = 'docs/Report/Bao_Cao_RDS_RMS_Requirement_Specifications_v3.docx';

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const CREATED_BY = 'SE20A05 Group 7 - Business Analyst';
const DATE_CREATED = '2026-07-06';

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
  const re = /^### (UC-\d+) - (.+?)\r?\n([\s\S]*?)(?=^### UC-\d+ - |^## 4\.|(?![\s\S]))/gm;
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
    size = 22,
    font = 'Calibri',
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
    line = 264,
    indentLeft,
    hanging,
    keepNext,
    bold,
    italic,
    color,
    size,
    font,
  } = options;
  const pPr = [
    keepNext ? '<w:keepNext/>' : '',
    align ? `<w:jc w:val="${align}"/>` : '',
    `<w:spacing w:before="${before}" w:after="${after}" w:line="${line}" w:lineRule="auto"/>`,
    indentLeft ? `<w:ind w:left="${indentLeft}"${hanging ? ` w:hanging="${hanging}"` : ''}/>` : '',
  ].join('');
  return `<w:p><w:pPr>${pPr}</w:pPr>${run(text, { bold, italic, color, size, font })}</w:p>`;
}

function multiPara(text, options = {}) {
  const value = clean(text);
  const lines = value ? value.split('\n').filter(Boolean) : ['N/A'];
  return lines.map((line) => para(line, options)).join('');
}

function pageBreak() {
  return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
}

function heading(level, text, options = {}) {
  const config = {
    1: { size: 32, color: '2E74B5', before: 320, after: 160 },
    2: { size: 26, color: '2E74B5', before: 220, after: 110 },
    3: { size: 24, color: '1F4D78', before: 140, after: 80 },
  }[level];
  return para(text, { keepNext: true, ...config, ...options });
}

function cell(content, width, options = {}) {
  const {
    bold = false,
    italic = false,
    align = 'left',
    valign = 'center',
    size = 21,
    color = '000000',
    fill,
    span,
  } = options;
  const inner = Array.isArray(content)
    ? content.map((item) => (typeof item === 'string' ? multiPara(item, { after: 30, line: 250, bold, italic, align, size, color }) : item)).join('')
    : multiPara(content, { after: 30, line: 250, bold, italic, align, size, color });
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${span ? `<w:gridSpan w:val="${span}"/>` : ''}${fill ? `<w:shd w:fill="${fill}"/>` : ''}<w:vAlign w:val="${valign}"/><w:tcMar><w:top w:w="95" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="95" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tcMar></w:tcPr>${inner}</w:tc>`;
}

function tableRows(rows, widths, options = {}) {
  const tableWidth = widths.reduce((sum, width) => sum + width, 0);
  const borders = '<w:tblBorders><w:top w:val="single" w:sz="6" w:color="000000"/><w:left w:val="single" w:sz="6" w:color="000000"/><w:bottom w:val="single" w:sz="6" w:color="000000"/><w:right w:val="single" w:sz="6" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:color="000000"/><w:insideV w:val="single" w:sz="4" w:color="000000"/></w:tblBorders>';
  const rowXml = rows
    .map((row) => {
      let colIndex = 0;
      const cells = row.map((item) => {
        const span = item.span ?? 1;
        const width = item.width ?? widths.slice(colIndex, colIndex + span).reduce((sum, value) => sum + value, 0);
        colIndex += span;
        return cell(item.text, width, { ...options, ...item });
      });
      return `<w:tr>${cells.join('')}</w:tr>`;
    })
    .join('');
  return `<w:tbl><w:tblPr><w:tblW w:w="${tableWidth}" w:type="dxa"/><w:tblInd w:w="120" w:type="dxa"/><w:tblLayout w:type="fixed"/>${borders}<w:tblCellMar><w:top w:w="95" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="95" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${widths.map((width) => `<w:gridCol w:w="${width}"/>`).join('')}</w:tblGrid>${rowXml}</w:tbl>${para('', { after: 80 })}`;
}

function fullWidthRow(label, value) {
  return [
    { text: label, bold: true, align: 'right', fill: 'F2F4F7' },
    { text: value || 'N/A', align: 'left', span: 3 },
  ];
}

function inferActors(primaryActor) {
  const value = clean(primaryActor);
  const roles = value
    .replace(/\(.*?\)/g, '')
    .split(/,|\band\b|\//i)
    .map((part) => part.trim())
    .filter(Boolean);
  if (/All Users/i.test(value)) {
    return {
      primary: 'Authenticated User',
      secondary: 'Admin, HR, Department Head, Candidate',
    };
  }
  if (/Public Registration Flow/i.test(value)) {
    return {
      primary: roles[0] || value,
      secondary: 'Public Registration Flow',
    };
  }
  return {
    primary: roles[0] || value || 'N/A',
    secondary: roles.slice(1).join(', ') || 'N/A',
  };
}

function inferFrequency(module) {
  const m = module.toLowerCase();
  if (m.includes('auth') || m.includes('dashboard') || m.includes('notification')) return 'High';
  if (m.includes('health') || m.includes('report')) return 'Low';
  return 'Medium';
}

function inferPriority(module) {
  const m = module.toLowerCase();
  if (m.includes('report') || m.includes('health')) return 'Should Have';
  return 'Must Have';
}

function actorPhrase(primaryActor) {
  const actors = inferActors(primaryActor);
  return actors.primary === 'Authenticated User' ? 'User' : actors.primary;
}

function fieldOrDefault(uc, fields, key) {
  const value = fields[key];
  if (value && value.trim()) return value;
  const actor = actorPhrase(fields['Primary Actor'] || uc.primaryActor);
  switch (key) {
    case 'Trigger':
      return `${actor} starts "${uc.name}" from the ${uc.module} workspace or from a related workflow action.`;
    case 'Description':
      return `Supports "${uc.name}" within the ${uc.module} feature so the actor can complete the relevant recruitment workflow step.`;
    case 'Preconditions':
      return `${actor} is authenticated when required, has permission for the ${uc.module} feature, and the related business record exists when the use case depends on one.`;
    case 'Postconditions':
      return `The ${uc.module} data/state is updated or returned successfully, and the system preserves traceability where the action changes workflow state.`;
    case 'Normal Flow':
      return `1. ${actor} opens the ${uc.module} feature.\n2. ${actor} selects "${uc.name}".\n3. System validates permission, input data and workflow state.\n4. System processes the request and returns the result.\n5. System updates related data, logs or notifications when applicable.`;
    case 'Alternative Flows':
      return `A1. ${actor} cancels the "${uc.name}" action before submission; system keeps the previous state unchanged.\nA2. Required context is missing or incomplete; system guides the actor back to the related ${uc.module} screen to complete prerequisite information.\nA3. Actor opens the action from a dashboard, notification or detail page; system resolves the same use case using the selected record context.`;
    case 'Exceptions':
      return `E1. ${actor} does not have permission for the requested ${uc.module} action.\nE2. Required data is invalid, missing or no longer available.\nE3. System cannot complete the action because a dependent service or workflow validation fails.`;
    default:
      return 'N/A';
  }
}

function relatedRulesForUc(uc) {
  const n = Number(uc.id.replace(/\D/g, ''));
  const rules = ['BR-01', 'BR-02'];
  if (n >= 16 && n <= 24) rules.push('BR-03', 'BR-04', 'BR-05', 'BR-10');
  if (n >= 25 && n <= 31) rules.push('BR-06', 'BR-12');
  if (n >= 38 && n <= 45) rules.push('BR-08', 'BR-11');
  if (n >= 46 && n <= 54) rules.push('BR-07', 'BR-10');
  if (n >= 55 && n <= 56) rules.push('BR-09');
  return [...new Set(rules)].join(', ');
}

function requirementTable(uc, detail) {
  const fields = detail?.fields ?? {};
  const actors = inferActors(fields['Primary Actor'] || uc.primaryActor);
  const priority = inferPriority(uc.module);
  const frequency = inferFrequency(uc.module);
  const traceInfo = fields['Related Endpoints'] || fields['Related Screens'] || fields['Related Components'] || 'N/A';
  const widths = [2100, 2900, 1900, 2460];
  const rows = [
    fullWidthRow('UC ID and Name:', `${uc.id} - ${uc.name}`),
    [
      { text: 'Created By:', bold: true, align: 'right', fill: 'F2F4F7' },
      { text: CREATED_BY },
      { text: 'Date Created:', bold: true, align: 'right', fill: 'F2F4F7' },
      { text: DATE_CREATED, align: 'center' },
    ],
    [
      { text: 'Primary Actor:', bold: true, align: 'right', fill: 'F2F4F7' },
      { text: actors.primary },
      { text: 'Secondary Actors:', bold: true, align: 'right', fill: 'F2F4F7' },
      { text: actors.secondary },
    ],
    fullWidthRow('Trigger:', fieldOrDefault(uc, fields, 'Trigger')),
    fullWidthRow('Description:', fieldOrDefault(uc, fields, 'Description')),
    fullWidthRow('Preconditions:', fieldOrDefault(uc, fields, 'Preconditions')),
    fullWidthRow('Postconditions:', fieldOrDefault(uc, fields, 'Postconditions')),
    fullWidthRow('Normal Flow:', fieldOrDefault(uc, fields, 'Normal Flow')),
    fullWidthRow('Alternative Flows:', fieldOrDefault(uc, fields, 'Alternative Flows')),
    fullWidthRow('Exceptions:', fieldOrDefault(uc, fields, 'Exceptions')),
    fullWidthRow('Priority:', priority),
    fullWidthRow('Frequency of Use:', frequency),
    fullWidthRow('Business Rules:', relatedRulesForUc(uc)),
    fullWidthRow('Other Information:', `Module / Feature: ${uc.module}. Trace: ${traceInfo}`),
    fullWidthRow('Assumptions:', 'User has appropriate account status, role permission, and organization/department scope where applicable.'),
  ];
  return tableRows(rows, widths, { size: 20 });
}

function idNumber(id) {
  return Number(id.replace(/\D/g, ''));
}

const markdown = fs.readFileSync(sourcePath, 'utf8');
const templateBytes = fs.readFileSync(templatePath);
const zip = await JSZip.loadAsync(templateBytes);
const originalDocumentXml = await zip.file('word/document.xml').async('text');
const sectPrMatch = originalDocumentXml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/);
const sectPr = sectPrMatch
  ? sectPrMatch[0]
  : '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>';

const catalogSection = sectionBetween(markdown, '## 2. Use Case Catalog', /^## 3\./m);
const catalog = parseMarkdownTable(catalogSection)
  .filter((row) => row[0] !== 'UC ID')
  .map(([id, name, primaryActor, module]) => ({ id, name, primaryActor, module }))
  .sort((a, b) => idNumber(a.id) - idNumber(b.id));
const details = parseDetails(markdown);

if (catalog.length !== 61 || details.size !== 61) {
  throw new Error(`Expected 61 catalog/detail use cases. Found catalog=${catalog.length}, detail=${details.size}.`);
}

const featureOrder = [];
const byFeature = new Map();
for (const uc of catalog) {
  if (!byFeature.has(uc.module)) {
    byFeature.set(uc.module, []);
    featureOrder.push(uc.module);
  }
  byFeature.get(uc.module).push(uc);
}

let body = '';
body += heading(1, 'II. Requirement Specifications', { bold: false, color: '2E74B5', size: 34, before: 80, after: 170 });
body += para('The following section follows the RDS functional description template. Requirement specifications are grouped by Feature Name, and each related use case is documented with trigger, description, flows, exceptions, priority, business rules and trace information.', { size: 22, after: 180 });

featureOrder.forEach((feature, featureIndex) => {
  const ucs = byFeature.get(feature);
  body += heading(2, `${featureIndex + 1}. ${feature}`, { bold: false, size: 28, after: 90 });
  body += para(`Related Use Cases: ${ucs.map((uc) => `${uc.id} ${uc.name}`).join('; ')}`, { size: 20, after: 120 });
  ucs.forEach((uc, ucIndex) => {
    const detail = details.get(uc.id);
    body += heading(3, `${featureIndex + 1}.${ucIndex + 1} ${uc.id}_${uc.name}`, { bold: false, size: 25, after: 65 });
    body += para('a. Functionalities', { italic: true, color: '2E74B5', size: 21, after: 65 });
    body += para('Provide the functional description for the use case using the template below.', { size: 20, after: 35 });
    body += para('Functional Description Template', { bold: true, size: 21, after: 20 });
    body += requirementTable(uc, detail);
  });
  if (featureIndex < featureOrder.length - 1) {
    body += pageBreak();
  }
});

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
const tableLabelCount = (extracted.value.match(/Functional Description Template/g) || []).length;
console.log(JSON.stringify({
  output: outPath,
  catalogCount: catalog.length,
  detailCount: details.size,
  featureCount: featureOrder.length,
  functionalTemplateCount: tableLabelCount,
  hasRequirementHeading: extracted.value.includes('II. Requirement Specifications'),
  hasUC01: extracted.value.includes('UC-01_Register Account'),
  hasUC61: extracted.value.includes('UC-61_Monitor System Health'),
  hasNoSplitHrRole: !/HR_RECRUITER|HR Recruiter/i.test(extracted.value),
}, null, 2));
