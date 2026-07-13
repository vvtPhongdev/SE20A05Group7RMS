import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

const ROOT = process.cwd();
const outDir = path.join(ROOT, 'outputs', 'team-task-assignment');
const outFile = path.join(outDir, 'Phan_cong_nhiem_vu_RMS_nhom_5_nguoi.docx');
fs.mkdirSync(outDir, { recursive: true });

const esc = (s='') => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const strip = (s='') => s.replace(/`/g,'').replace(/\[([^\]]+)\]\([^\)]+\)/g,'$1').trim();

function parseTaskFile(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  let phase = 'Khác'; const tasks=[];
  for (const line of lines) {
    const h=line.match(/^##\s+(Phase[^:]*:\s*.+)$/); if(h) phase=h[1];
    const m=line.match(/^\|\s*(T-\d{3})\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|/);
    if(m) tasks.push({id:m[1], title:strip(m[2]), depends:strip(m[3]), phase});
  }
  return tasks;
}
function parseMatrix(file) {
  const lines=fs.readFileSync(file,'utf8').split(/\r?\n/); const map=new Map();
  for(const line of lines){
    const m=line.match(/^\|\s*(T-\d{3})\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|/);
    if(m) map.set(m[1],{target:strip(m[2]), acceptance:strip(m[3])});
  }
  return map;
}

const tasks=parseTaskFile(path.join(ROOT,'docs','all-tasks.md'));
const matrix=parseMatrix(path.join(ROOT,'docs','specs','spec-rms-implementation','task-implementation-matrix.md'));
const people=['Dũng','Phong','Hiếu','Nam','Lý'];
const role={
  'Dũng':'Backend nền tảng, Identity/Auth, Gateway và bảo mật',
  'Phong':'Frontend React, UI/UX, route guard và trải nghiệm người dùng',
  'Hiếu':'Database, Prisma, AI/CV, worker, Redis/BullMQ và tích hợp dữ liệu',
  'Nam':'Recruiting workflow, kế hoạch, phỏng vấn và quyết định tuyển dụng',
  'Lý':'Notification, báo cáo, kiểm thử tích hợp, tài liệu và chất lượng phát hành'
};
const prefs={
  'Dũng':/identity|auth|jwt|role|gateway|user|organization|department|service scaffold/i,
  'Phong':/frontend|page|form|dashboard|view|ui|login page|registration page|route guard/i,
  'Hiếu':/prisma|database|pgvector|vector|embedding|cv |worker|bullmq|redis|docker|seed|storage/i,
  'Nam':/request|plan|task plan|interview|hiring decision|approve|reject|schedule|campaign/i,
  'Lý':/notification|email|report|audit|typecheck|build|metrics|pipeline|reminder|tracking/i
};
const counts=Object.fromEntries(people.map(p=>[p,0]));
for(const t of tasks){
  const candidates=people.filter(p=>counts[p]<17);
  let ranked=candidates.map((p,i)=>({p,score:(prefs[p].test(t.title)?10:0)-counts[p]*0.45-i*0.01}));
  ranked.sort((a,b)=>b.score-a.score); t.owner=ranked[0].p; counts[t.owner]++;
}
for(const t of tasks){
  const i=people.indexOf(t.owner); t.tester=people[(i+1)%people.length];
  const detail=matrix.get(t.id)||{}; t.target=detail.target||t.title; t.acceptance=detail.acceptance||'Hoàn thành chức năng, có unit/integration test phù hợp và cập nhật tài liệu liên quan.';
}

const W={page:12240, margin:1080, content:10080};
const font='Calibri';
const run=(text,opt={})=>`<w:r><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}"/><w:sz w:val="${opt.size||20}"/>${opt.bold?'<w:b/>':''}${opt.color?`<w:color w:val="${opt.color}"/>`:''}</w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
const para=(text,opt={})=>`<w:p><w:pPr>${opt.style?`<w:pStyle w:val="${opt.style}"/>`:''}<w:spacing w:before="${opt.before||0}" w:after="${opt.after??100}" w:line="${opt.line||280}" w:lineRule="auto"/>${opt.align?`<w:jc w:val="${opt.align}"/>`:''}${opt.keep?'<w:keepNext/>':''}</w:pPr>${run(text,opt)}</w:p>`;
const cell=(text,width,opt={})=>`<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/><w:tcMar><w:top w:w="80" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tcMar>${opt.fill?`<w:shd w:fill="${opt.fill}"/>`:''}<w:vAlign w:val="center"/></w:tcPr>${para(text,{size:opt.size||17,bold:opt.bold,color:opt.color,after:30,line:240,align:opt.align})}</w:tc>`;
const table=(headers,rows,widths)=>`<w:tbl><w:tblPr><w:tblW w:w="${widths.reduce((a,b)=>a+b,0)}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:top w:val="single" w:sz="6" w:color="AAB7C4"/><w:left w:val="single" w:sz="6" w:color="AAB7C4"/><w:bottom w:val="single" w:sz="6" w:color="AAB7C4"/><w:right w:val="single" w:sz="6" w:color="AAB7C4"/><w:insideH w:val="single" w:sz="4" w:color="D6DEE5"/><w:insideV w:val="single" w:sz="4" w:color="D6DEE5"/></w:tblBorders></w:tblPr><w:tblGrid>${widths.map(w=>`<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid><w:tr><w:trPr><w:tblHeader/></w:trPr>${headers.map((h,i)=>cell(h,widths[i],{fill:'1F4E78',bold:true,color:'FFFFFF',size:17,align:'center'})).join('')}</w:tr>${rows.map((r,ri)=>`<w:tr>${r.map((v,i)=>cell(v,widths[i],{fill:ri%2?'F5F8FA':'FFFFFF',size:16,align:i===0||i>=r.length-2?'center':undefined})).join('')}</w:tr>`).join('')}</w:tbl>${para('',{after:80})}`;

let body='';
body+=para('KẾ HOẠCH PHÂN CÔNG NHIỆM VỤ',{size:34,bold:true,color:'17365D',align:'center',after:80});
body+=para('Recruitment Workflow Management System (RMS)',{size:25,bold:true,color:'2E74B5',align:'center',after:220});
body+=para('Nhóm thực hiện: Dũng • Phong • Hiếu • Nam • Lý',{size:21,align:'center',after:60});
body+=para('Phạm vi: toàn bộ 85 task T-001 đến T-085 trong tài liệu dự án',{size:19,color:'666666',align:'center',after:280});
body+=para('Mục tiêu tài liệu',{style:'Heading1',keep:true});
body+=para('Phân rã toàn bộ phạm vi RMS thành các nhiệm vụ có mã, đầu ra, điều kiện nghiệm thu, phụ thuộc, người thực hiện chính và người kiểm thử độc lập. Phân công được cân bằng ở mức 17 task chính cho mỗi thành viên; tester không trùng với người thực hiện.');
body+=para('Nguyên tắc làm việc',{style:'Heading1',keep:true});
for(const x of ['Mỗi task phải tạo branch/commit hoặc pull request có mã T-xxx.','Người thực hiện chịu trách nhiệm code, tự kiểm tra cục bộ và cập nhật tài liệu liên quan.','Người test đọc tiêu chí nghiệm thu, chạy unit/integration/E2E phù hợp và ghi bằng chứng kiểm thử.','Task chỉ được đóng khi tester xác nhận Pass; lỗi phải được trả lại đúng người thực hiện.','Ưu tiên triển khai theo phụ thuộc; không làm task downstream khi task nền tảng chưa ổn định.']) body+=para('• '+x,{after:55});
body+=para('Vai trò chính và khối lượng',{style:'Heading1',keep:true});
body+=table(['Thành viên','Trọng tâm phụ trách','Task chính','Task kiểm thử'],people.map(p=>[p,role[p],String(tasks.filter(t=>t.owner===p).length),String(tasks.filter(t=>t.tester===p).length)]),[1300,5700,1400,1680]);

const phases=[...new Set(tasks.map(t=>t.phase))];
body+=para('Ma trận phân công chi tiết',{style:'Heading1',keep:true});
body+=para('Trạng thái khởi tạo cho tất cả task: Chưa bắt đầu. Độ ưu tiên được xác định theo thứ tự phụ thuộc và phase.',{color:'555555'});
for(const ph of phases){
  body+=para(ph,{style:'Heading2',keep:true});
  const rows=tasks.filter(t=>t.phase===ph).map(t=>[
    t.id,t.title,t.target,t.acceptance,t.depends==='—'?'Không':t.depends,t.owner,t.tester
  ]);
  body+=table(['ID','Task','Đầu ra/Phạm vi','Tiêu chí nghiệm thu','Phụ thuộc','Phụ trách','Tester'],rows,[600,1650,2300,2600,1050,940,940]);
}
body+=para('Quy trình kiểm thử và bàn giao',{style:'Heading1',keep:true});
const steps=['Developer hoàn thành code và tự kiểm tra lint/typecheck/unit test.','Developer gửi link PR/commit và hướng dẫn test cho tester được chỉ định.','Tester chạy test theo tiêu chí nghiệm thu, kiểm tra role/permission và trường hợp lỗi.','Nếu Fail: tạo bug note kèm bước tái hiện; developer sửa và tester retest.','Nếu Pass: tester ghi kết quả, ngày kiểm thử và bằng chứng; task chuyển Done.'];
steps.forEach((s,i)=>body+=para(`${i+1}. ${s}`,{after:65}));
body+=para('Definition of Done chung',{style:'Heading1',keep:true});
for(const x of ['Code tuân thủ TypeScript strict, không tạo enum/contract trùng lặp.','API có validation, phân quyền và xử lý lỗi; thay đổi schema có migration/seed.','Luồng trạng thái có test; frontend có loading, empty, error và unauthorized states.','Không phá vỡ plan-lock, audit trail, notification hoặc dữ liệu hiện hữu.','Tài liệu endpoint, cấu trúc dữ liệu và hướng dẫn chạy được cập nhật cùng thay đổi.','Build và typecheck toàn workspace vượt qua trước khi merge.']) body+=para('☐ '+x,{after:55});
body+=para('Nguồn lập kế hoạch: docs/all-tasks.md; docs/specs/spec-rms-implementation/task-implementation-matrix.md; docs/project-overview.md; docs/architecture.md.',{size:17,color:'666666',before:180});

const doc=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="${W.page}" w:h="15840"/><w:pgMar w:top="${W.margin}" w:right="${W.margin}" w:bottom="${W.margin}" w:left="${W.margin}" w:header="708" w:footer="708"/><w:cols w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr></w:body></w:document>`;
const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="20"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:spacing w:after="120" w:line="300" w:lineRule="auto"/></w:pPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="360" w:after="200"/></w:pPr><w:rPr><w:b/><w:color w:val="2E74B5"/><w:sz w:val="32"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="280" w:after="140"/></w:pPr><w:rPr><w:b/><w:color w:val="2E74B5"/><w:sz w:val="26"/></w:rPr></w:style></w:styles>`;
const zip=new JSZip();
zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>');
zip.folder('_rels').file('.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
zip.folder('word').file('document.xml',doc).file('styles.xml',styles).folder('_rels').file('document.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
const bytes=await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'}); fs.writeFileSync(outFile,bytes);
console.log(JSON.stringify({outFile,taskCount:tasks.length,counts,testCounts:Object.fromEntries(people.map(p=>[p,tasks.filter(t=>t.tester===p).length]))},null,2));
