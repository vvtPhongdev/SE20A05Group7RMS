import fs from 'fs';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import { DOMParser } from '@xmldom/xmldom';

const templatePath = 'docs/Report/RBL.docx';
const outPath = 'docs/Report/RBL_RMS_Vector_Search_Hybrid.docx';
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
  return `<w:r><w:rPr>${props}</w:rPr><w:t${preserve ? ' xml:space="preserve"' : ''}>${esc(text)}</w:t></w:r>`;
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

function heading(level, text, options = {}) {
  const config = {
    1: { size: 30, color: '2E74B5', before: 300, after: 150 },
    2: { size: 25, color: '2E74B5', before: 220, after: 110 },
    3: { size: 23, color: '1F4D78', before: 150, after: 80 },
  }[level];
  return para(text, { keepNext: true, bold: true, ...config, ...options });
}

function bullet(text, level = 0) {
  return para(text, { indentLeft: 720 + level * 360, hanging: 240, after: 80, line: 276, size: 21 });
}

function pageBreak() {
  return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
}

function cell(content, width, options = {}) {
  const {
    bold,
    italic,
    align = 'left',
    valign = 'top',
    size = 20,
    color = '000000',
    fill,
  } = options;
  const paragraphs = Array.isArray(content) ? content : String(content ?? '').split('\n');
  const inner = paragraphs
    .filter((item) => String(item).length > 0)
    .map((item) => para(item, { after: 45, line: 250, bold, italic, align, size, color }))
    .join('') || para('', { after: 45, line: 250, size, color });
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${fill ? `<w:shd w:fill="${fill}"/>` : ''}<w:vAlign w:val="${valign}"/><w:tcMar><w:top w:w="100" w:type="dxa"/><w:left w:w="130" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:right w:w="130" w:type="dxa"/></w:tcMar></w:tcPr>${inner}</w:tc>`;
}

function table(headers, rows, widths, options = {}) {
  const tableWidth = widths.reduce((sum, width) => sum + width, 0);
  const borders = '<w:tblBorders><w:top w:val="single" w:sz="4" w:color="B7C9D6"/><w:left w:val="single" w:sz="4" w:color="B7C9D6"/><w:bottom w:val="single" w:sz="4" w:color="B7C9D6"/><w:right w:val="single" w:sz="4" w:color="B7C9D6"/><w:insideH w:val="single" w:sz="4" w:color="D9E2EA"/><w:insideV w:val="single" w:sz="4" w:color="D9E2EA"/></w:tblBorders>';
  const headerRow = `<w:tr><w:trPr><w:tblHeader/></w:trPr>${headers
    .map((header, i) => cell(header, widths[i], { fill: options.headerFill ?? 'E8EEF5', bold: true, align: 'center', valign: 'center', size: options.headerSize ?? 19, color: '0B2545' }))
    .join('')}</w:tr>`;
  const bodyRows = rows
    .map((row, ri) => `<w:tr>${row.map((value, i) => cell(value, widths[i], {
      fill: ri % 2 === 1 ? 'F7FAFC' : undefined,
      align: options.aligns?.[i] ?? 'left',
      size: options.size ?? 19,
    })).join('')}</w:tr>`)
    .join('');
  return `<w:tbl><w:tblPr><w:tblW w:w="${tableWidth}" w:type="dxa"/><w:tblInd w:w="120" w:type="dxa"/><w:tblLayout w:type="fixed"/>${borders}</w:tblPr><w:tblGrid>${widths.map((width) => `<w:gridCol w:w="${width}"/>`).join('')}</w:tblGrid>${headerRow}${bodyRows}</w:tbl>${para('', { after: 90 })}`;
}

function callout(title, body) {
  return `<w:tbl><w:tblPr><w:tblW w:w="9360" w:type="dxa"/><w:tblInd w:w="120" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:top w:val="single" w:sz="8" w:color="70AD47"/><w:left w:val="single" w:sz="8" w:color="70AD47"/><w:bottom w:val="single" w:sz="8" w:color="70AD47"/><w:right w:val="single" w:sz="8" w:color="70AD47"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="9360"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:tcW w:w="9360" w:type="dxa"/><w:shd w:fill="F0F6EC"/><w:tcMar><w:top w:w="140" w:type="dxa"/><w:left w:w="180" w:type="dxa"/><w:bottom w:w="140" w:type="dxa"/><w:right w:w="180" w:type="dxa"/></w:tcMar></w:tcPr>${para(title, { bold: true, color: '375623', after: 40, size: 21 })}${para(body, { size: 20, after: 40 })}</w:tc></w:tr></w:tbl>${para('', { after: 90 })}`;
}

const templateBytes = fs.readFileSync(templatePath);
const zip = await JSZip.loadAsync(templateBytes);
const originalDocumentXml = await zip.file('word/document.xml').async('text');
const sectPrMatch = originalDocumentXml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/);
const sectPr = sectPrMatch
  ? sectPrMatch[0]
  : '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>';

let body = '';
body += para('RESEARCH BY LEARNING REPORT', { align: 'center', bold: true, size: 34, color: '2E74B5', before: 260, after: 120 });
body += para('Hybrid Vector Search for Candidate Discovery in Recruitment Management System (RMS)', { align: 'center', bold: true, size: 28, color: '1F4D78', after: 180 });
body += para('Research-Oriented Software Engineering Project', { align: 'center', italic: true, size: 22, color: '555555', after: 240 });
body += table(
  ['Project Information', 'Description'],
  [
    ['Course', 'SWP391 - Software Engineering Project (Research-Based Learning)'],
    ['Research Title', 'Research and development of a Recruitment Management System with Hybrid Vector Search for candidate discovery'],
    ['Institution', 'FPT University'],
    ['Software Artifact', 'Recruitment Management System (RMS) - monorepo with React, NestJS microservices, PostgreSQL pgvector, Redis/BullMQ and local ONNX embedding model'],
    ['Research Focus', 'Compare ordinary candidate search algorithms with the RMS hybrid search approach that combines semantic vector similarity, skill graph expansion, deterministic coverage scoring and HR feedback learning.'],
  ],
  [2500, 6860],
  { size: 19 },
);
body += pageBreak();

body += heading(1, '1. Software Engineering Problem Statement');
body += para('Trong tuyển dụng, HR thường phải tìm ứng viên từ CV không đồng nhất về ngôn ngữ, format, tên kỹ năng và cách mô tả kinh nghiệm. Nếu chỉ dùng thuật toán tìm kiếm thường như SQL LIKE, exact keyword matching hoặc filter theo trường dữ liệu, hệ thống dễ bỏ sót ứng viên phù hợp nhưng dùng từ khác với JD.', { size: 21 });
body += bullet('Ví dụ: JD yêu cầu "backend Java Spring Boot", nhưng CV ghi "REST API, microservices, Hibernate, JVM". Tìm kiếm từ khóa thường có thể không nhận ra mức liên quan ngữ nghĩa.');
body += bullet('Ví dụ: HR tìm "React", ứng viên ghi "front-end SPA, TypeScript, component-based UI". Exact match có thể chấm thấp dù năng lực thực tế phù hợp.');
body += bullet('Ngược lại, nếu chỉ dùng vector semantic search, kết quả có thể quá rộng: các CV liên quan ngữ cảnh nhưng thiếu kỹ năng bắt buộc vẫn được đưa lên cao.');
body += callout('Research problem', 'RMS cần một cơ chế tìm kiếm ứng viên vừa hiểu ngữ nghĩa CV-JD, vừa giữ được ràng buộc kỹ năng, vai trò, kinh nghiệm và feedback thực tế từ HR.');

body += heading(1, '2. Research Objectives');
body += bullet('Phân tích sự khác biệt giữa tìm kiếm ứng viên bằng thuật toán thường và Hybrid Vector Search.');
body += bullet('Thiết kế cách kết hợp vector similarity, skill graph, coverage score và HR feedback trong quy trình RMS.');
body += bullet('Đánh giá ưu điểm, giới hạn và tiêu chí đo lường: Precision, Recall, Latency, Explainability và HR Acceptance.');
body += bullet('Đảm bảo AI chỉ hỗ trợ tìm kiếm/sàng lọc, không thay thế quyết định tuyển dụng cuối cùng.');

body += heading(1, '3. Research Questions');
body += table(
  ['Research Question', 'Meaning in RMS'],
  [
    ['RQ1', 'Hybrid Vector Search có cải thiện khả năng tìm đúng ứng viên so với keyword/exact search không?'],
    ['RQ2', 'Việc kết hợp skill graph và coverage score có giảm kết quả nhiễu do semantic/vector search quá rộng không?'],
    ['RQ3', 'Local ONNX embedding model 384 chiều + PostgreSQL pgvector có phù hợp với hạ tầng SME về latency và bảo mật dữ liệu CV không?'],
    ['RQ4', 'Feedback loop từ HR có giúp hệ thống học dần cách xếp hạng ứng viên sát nhu cầu tuyển dụng hơn không?'],
  ],
  [2300, 7060],
  { size: 19 },
);

body += heading(1, '4. Proposed Approach / System Overview');
body += para('RMS sử dụng pipeline tìm kiếm ứng viên theo hướng hybrid. CV được parse thành raw text và structured data, worker sinh embedding 384 chiều bằng local RMS ONNX model, vector được lưu trong PostgreSQL pgvector. Khi HR tìm kiếm, hệ thống tạo query embedding, truy vấn cosine similarity, mở rộng kỹ năng qua skill graph, sau đó tính điểm tổng hợp.', { size: 21 });
body += table(
  ['Component', 'Implementation in RMS', 'Research Role'],
  [
    ['CV parsing pipeline', 'Worker extracts raw CV text and structured profile data from uploaded CV documents.', 'Chuẩn hóa dữ liệu đầu vào trước khi tìm kiếm.'],
    ['Embedding generation', 'packages/ai creates normalized 384-dimensional query/passage embeddings using local rms-embedding-model or configured embedding API.', 'Biến CV/JD thành vector để so sánh ngữ nghĩa.'],
    ['Vector store', 'PostgreSQL pgvector stores vector(384); ivfflat vector_cosine_ops index supports similarity search.', 'Tối ưu truy vấn nearest-neighbor trong dữ liệu CV.'],
    ['Talent Search Service', 'services/recruiting combines vector scores, skill graph proximity, coverage score and feedback adjustment.', 'Tạo ranking ứng viên theo nhiều tín hiệu thay vì một thuật toán đơn.'],
    ['Feedback loop', 'TalentSearchFeedback stores actions such as VIEW_CV, SHORTLIST, INVITE, HIRE, REJECT and exports training triplets.', 'RBL loop: hệ thống học từ hành vi đánh giá thực tế của HR.'],
  ],
  [2100, 4100, 3160],
  { size: 18 },
);

body += heading(2, '4.1 Hybrid Search Flow');
body += table(
  ['Step', 'Process', 'Output'],
  [
    ['1', 'HR nhập query hoặc chọn recruitment request/campaign. System kết hợp JD, position, department, required skills và query thủ công.', 'Effective search query'],
    ['2', 'SearchExpander mở rộng skill liên quan từ skill graph.', 'Expanded skills + resolved skill'],
    ['3', 'getQueryEmbedding sinh vector truy vấn 384 chiều.', 'Query vector'],
    ['4', 'pgvector tính MAX(1 - embedding <=> queryVector) theo candidate.', 'Vector similarity score'],
    ['5', 'MatchScorer tính graph proximity và coverage of required skills.', 'Graph score + coverage score'],
    ['6', 'Feedback actions được cộng/trừ trọng số theo candidate và request context.', 'Feedback score adjustment'],
    ['7', 'overallScore được sort giảm dần và hiển thị cho HR kèm explanation.', 'Ranked candidates'],
  ],
  [700, 6100, 2560],
  { size: 18, aligns: ['center', 'left', 'left'] },
);

body += pageBreak();
body += heading(1, '5. Hybrid Vector Search vs Ordinary Search Algorithms');
body += table(
  ['Criteria', 'Ordinary Search', 'RMS Hybrid Vector Search'],
  [
    ['Matching basis', 'Khớp chính xác từ khóa, LIKE, filter hoặc rule đơn giản.', 'Khớp ngữ nghĩa CV-JD bằng vector, mở rộng skill bằng graph và kiểm tra coverage kỹ năng.'],
    ['Synonyms and terminology', 'Yếu khi ứng viên dùng thuật ngữ khác JD.', 'Tốt hơn vì embedding hiểu ngữ cảnh và skill graph nối các skill liên quan.'],
    ['Typo / abbreviation handling', 'Dễ bỏ sót nếu không có rule riêng.', 'Vector và skill graph có thể giảm bỏ sót, nhưng vẫn cần validation/filter để tránh nhiễu.'],
    ['Ranking quality', 'Thường xếp hạng theo số lần xuất hiện keyword hoặc filter boolean.', 'Xếp hạng theo composite score: 40% vector similarity, 35% graph proximity, 25% skill coverage, cộng/trừ feedback HR.'],
    ['Explainability', 'Dễ giải thích nhưng nghèo tín hiệu.', 'Có explanation: semantic similarity, skill graph proximity, required skill coverage, feedback adjustment, matched skills và gaps.'],
    ['Risk', 'High precision với keyword rõ, nhưng recall thấp.', 'Recall cao hơn; rủi ro semantic noise được giảm bằng coverage, graph gap và human review.'],
    ['Learning ability', 'Không học từ hành vi HR nếu không xây thêm log/ML.', 'Có feedback loop: VIEW_CV, SHORTLIST, INVITE, HIRE tăng điểm; REJECT giảm điểm; export triplets phục vụ cải thiện model.'],
    ['Infrastructure', 'Rẻ và đơn giản, chạy tốt với SQL index thường.', 'Cần embedding model, worker, pgvector index và kiểm soát latency, nhưng vẫn triển khai local để bảo mật CV.'],
  ],
  [1700, 3650, 4010],
  { size: 17 },
);

body += heading(2, '5.1 Key Difference Explained');
body += para('Thuật toán thường hỏi: "CV có chứa đúng từ khóa HR nhập không?". Hybrid Vector Search hỏi sâu hơn: "Nội dung CV có gần nghĩa với nhu cầu tuyển dụng không, ứng viên có các kỹ năng liên quan không, mức phủ kỹ năng bắt buộc ra sao, và HR trước đây phản ứng thế nào với ứng viên tương tự?".', { size: 21 });
body += para('Vì vậy, Hybrid Search không chỉ là vector search đơn lẻ. Trong RMS, vector similarity là một tín hiệu quan trọng, nhưng kết quả cuối còn được cân bằng bằng skill graph, coverage score và feedback từ quy trình tuyển dụng.', { size: 21 });

body += heading(1, '6. Research Methodology');
body += table(
  ['Experiment', 'Baseline / Variant', 'Measurement'],
  [
    ['E1 - Keyword baseline', 'SQL LIKE / exact skill filter / keyword count.', 'Precision@K, Recall@K, latency, number of missed relevant candidates.'],
    ['E2 - Vector-only baseline', 'Rank by pgvector cosine similarity only.', 'Recall improvement, semantic noise rate, manual HR acceptance.'],
    ['E3 - RMS hybrid search', 'Vector similarity + skill graph proximity + coverage + feedback score.', 'Precision/Recall balance, explanation usefulness, shortlist conversion.'],
    ['E4 - Feedback learning', 'Compare ranking before and after HR actions are recorded.', 'Change in top-K relevance and reduction of repeated poor matches.'],
  ],
  [2000, 3700, 3660],
  { size: 18 },
);
body += heading(2, '6.1 Suggested Evaluation Metrics');
body += bullet('Precision@K: tỷ lệ ứng viên đúng trong top K kết quả.');
body += bullet('Recall@K: tỷ lệ ứng viên phù hợp được tìm thấy trong top K.');
body += bullet('Latency: thời gian phản hồi cho một truy vấn HR.');
body += bullet('Semantic Noise Rate: tỷ lệ ứng viên được vector đưa lên nhưng thiếu kỹ năng bắt buộc.');
body += bullet('HR Acceptance Rate: tỷ lệ kết quả được HR view, shortlist, invite hoặc hire.');

body += heading(1, '7. Expected Contributions');
body += bullet('Một artifact phần mềm có khả năng tìm kiếm ứng viên thông minh trong RMS, chạy với PostgreSQL pgvector và local embedding model.');
body += bullet('Một phương pháp RBL đo được sự khác biệt giữa search thường, vector-only và hybrid search.');
body += bullet('Một cơ chế feedback loop giúp hệ thống cải thiện dần dựa trên hành vi HR mà không để AI tự quyết định tuyển dụng.');
body += bullet('Một tài liệu giải thích rõ ràng để nhóm bảo vệ được giá trị nghiên cứu: hybrid search tăng recall mà vẫn giữ precision nhờ rule/graph/coverage.');

body += heading(1, '8. Research Plan & Milestones');
body += table(
  ['Phase', 'Output', 'Evidence in Project'],
  [
    ['Literature Review', 'Problem framing and comparison criteria.', 'RBL report, project overview, AI/vector search pipeline documentation.'],
    ['System Design', 'Hybrid search architecture and data flow.', 'TalentSearchService, worker embedding processor, pgvector migrations.'],
    ['Implementation', 'Candidate search UI/API/worker pipeline.', '/api/v1/talent/search, /api/v1/talent/feedback, CandidateSearch and HRTalentPool pages.'],
    ['Evaluation', 'Baseline vs vector-only vs hybrid result comparison.', 'Precision/Recall/Latency test scenarios and HR feedback logs.'],
    ['Reporting', 'Research report and recommendations.', 'Final RBL document and RDS report sections.'],
  ],
  [2100, 3600, 3660],
  { size: 18 },
);

body += pageBreak();
body += heading(1, '9. Technical Mapping to Current Repository');
body += table(
  ['Repository Area', 'Relevant Evidence'],
  [
    ['packages/ai/src/embedding.ts', 'Defines EMBEDDING_DIMENSIONS = 384, rms-custom-e5-small-v1 model version, local ONNX loading, query/passage prefixing and normalized embeddings.'],
    ['services/worker/src/processors/cv-embedding.processor.ts', 'Generates CV embedding from raw text, replaces stale embeddings and writes vector to cv_embeddings via raw SQL.'],
    ['services/recruiting/src/modules/talent-search/talent-search.service.ts', 'Builds effective query, expands skills, retrieves vector scores, computes composite match score and records feedback.'],
    ['packages/ai/src/matching/scorer.ts', 'Computes deterministic overallScore = 0.4 vector + 0.35 graph + 0.25 coverage, assigns readiness label and gaps.'],
    ['packages/database migrations', 'Enable pgvector, create vector(384) column and ivfflat vector_cosine_ops index.'],
    ['webapp CandidateSearch / HRTalentPool', 'Displays ranked results, vector score, semantic match and feedback actions for HR workflow.'],
  ],
  [3000, 6360],
  { size: 18 },
);

body += heading(1, '10. Conclusion');
body += para('So với thuật toán tìm kiếm thường, Hybrid Vector Search trong RMS khác ở chỗ nó không chỉ kiểm tra chuỗi ký tự. Hệ thống chuyển CV và JD thành vector ngữ nghĩa, tính cosine similarity, mở rộng kỹ năng bằng skill graph, đo coverage kỹ năng bắt buộc, và điều chỉnh ranking bằng feedback HR. Cách này giúp giảm bỏ sót ứng viên tiềm năng nhưng vẫn giữ quyền kiểm soát tuyển dụng ở con người.', { size: 21 });
body += para('Trong định hướng Research By Learning, đây là một chủ đề phù hợp vì có artifact phần mềm thật, có câu hỏi nghiên cứu rõ ràng, có baseline để so sánh, có chỉ số đo lường và có vòng lặp cải thiện dựa trên dữ liệu sử dụng.', { size: 21 });

const newDocumentXml = originalDocumentXml.replace(/<w:body>[\s\S]*<\/w:body>/, `<w:body>${body}${sectPr}</w:body>`);
if (newDocumentXml === originalDocumentXml) {
  throw new Error('Could not replace RBL template document body.');
}

zip.file('word/document.xml', newDocumentXml);
const output = await zip.generateAsync({ type: 'nodebuffer' });
fs.writeFileSync(outPath, output);

const generatedZip = await JSZip.loadAsync(output);
const generatedXml = await generatedZip.file('word/document.xml').async('text');
const doc = new DOMParser().parseFromString(generatedXml, 'application/xml');
if (!doc.getElementsByTagNameNS(W, 'body').length) {
  throw new Error('Generated DOCX has no Word body.');
}

const extracted = await mammoth.extractRawText({ path: outPath });
console.log(JSON.stringify({
  output: outPath,
  chars: extracted.value.length,
  hasTitle: extracted.value.includes('RESEARCH BY LEARNING REPORT'),
  hasHybrid: extracted.value.includes('Hybrid Vector Search'),
  hasComparison: extracted.value.includes('Ordinary Search'),
  hasPgvector: extracted.value.includes('pgvector'),
  hasFeedbackLoop: extracted.value.includes('feedback loop'),
}, null, 2));
