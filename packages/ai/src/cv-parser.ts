import { readFile } from 'fs/promises';
import mammoth from 'mammoth';

type PdfJsModule = typeof import('pdfjs-dist/legacy/build/pdf.mjs');

// Keep the native ESM import at runtime because this package is compiled to CommonJS.
const importPdfJs = new Function(
  'return import("pdfjs-dist/legacy/build/pdf.mjs")',
) as () => Promise<PdfJsModule>;

export interface ParsedCvExperience {
  id: string;
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface ParsedCvEducation {
  id: string;
  degree: string;
  school: string;
  year: string;
}

export interface StructuredCvData {
  fullName?: string;
  email?: string;
  phone?: string;
  currentRole?: string;
  location?: string;
  linkedinUrl?: string;
  summary?: string;
  skills: string[];
  experience: ParsedCvExperience[];
  education: ParsedCvEducation[];
}

const SECTION_ALIASES: Record<string, string[]> = {
  summary: ['summary', 'professional summary', 'profile', 'career objective', 'objective'],
  skills: ['skills', 'technical skills', 'core competencies', 'competencies', 'technologies'],
  experience: [
    'experience',
    'work experience',
    'professional experience',
    'employment history',
    'work history',
  ],
  education: ['education', 'academic background', 'qualifications'],
};

const normalizeText = (text: string) =>
  text
    .replace(/\r/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const normalizedHeading = (line: string) =>
  line.toLowerCase().replace(/[:|]/g, '').replace(/\s+/g, ' ').trim();

const sectionName = (line: string) => {
  const heading = normalizedHeading(line);
  for (const [name, aliases] of Object.entries(SECTION_ALIASES)) {
    if (aliases.includes(heading)) return name;
  }
  return null;
};

const splitSections = (text: string) => {
  const sections: Record<string, string[]> = { header: [] };
  let currentSection = 'header';

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const detectedSection = sectionName(line);
    if (detectedSection) {
      currentSection = detectedSection;
      sections[currentSection] ??= [];
      continue;
    }
    sections[currentSection] ??= [];
    sections[currentSection]!.push(line);
  }

  return sections;
};

const unique = (items: string[]) => [...new Set(items.map((item) => item.trim()).filter(Boolean))];

const parseSkills = (lines: string[]) =>
  unique(
    lines
      .join(', ')
      .split(/[,;|•·●▪■\n]/)
      .map((skill) => skill.replace(/^[-–—]\s*/, '').trim())
      .filter((skill) => skill.length >= 2 && skill.length <= 60),
  ).slice(0, 50);

const parseExperience = (lines: string[]): ParsedCvExperience[] => {
  if (lines.length === 0) return [];
  const blocks = lines.join('\n').split(/\n(?=(?:19|20)\d{2}|[A-Z][^\n]{2,60}\s+[|@–—-])/);

  return blocks
    .map((block, index) => {
      const parts = block
        .split('\n')
        .map((part) => part.trim())
        .filter(Boolean);
      const first = parts[0] || '';
      const separator = first.match(/\s+(?:at|@|\||–|—|-)\s+/i);
      const firstParts = separator ? first.split(separator[0]) : [first];
      const durationMatch = block.match(
        /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)?\.?\s*(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)?\.?\s*(?:19|20)\d{2}|Present|Current)/i,
      );

      return {
        id: `parsed-exp-${index}`,
        title: firstParts[0]?.trim() || '',
        company: firstParts.slice(1).join(' ').trim(),
        duration: durationMatch?.[0] || '',
        description: parts
          .slice(1)
          .join('\n')
          .replace(durationMatch?.[0] || '', '')
          .trim(),
      };
    })
    .filter((item) => item.title || item.company || item.description);
};

const parseEducation = (lines: string[]): ParsedCvEducation[] =>
  lines
    .map((line, index) => {
      const year = line.match(/\b(?:19|20)\d{2}(?:\s*[-–—]\s*(?:19|20)\d{2})?\b/)?.[0] || '';
      const parts = line.split(/\s+(?:at|@|\||–|—|-)\s+/i);
      return {
        id: `parsed-edu-${index}`,
        degree: (parts[0] || line).replace(year, '').trim(),
        school: parts.slice(1).join(' ').replace(year, '').trim(),
        year,
      };
    })
    .filter((item) => item.degree || item.school);

export async function parsePdf(filePath: string): Promise<string> {
  const file = await readFile(filePath);
  const { getDocument } = await importPdfJs();
  const loadingTask = getDocument({ data: Uint8Array.from(file) });
  const document = await loadingTask.promise;

  try {
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ('str' in item ? `${item.str}${item.hasEOL ? '\n' : ' '}` : ''))
        .join('');
      pages.push(pageText);
    }
    return normalizeText(pages.join('\n\n'));
  } finally {
    await document.destroy();
  }
}

export async function parseDocx(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  return normalizeText(result.value);
}

export async function extractText(filePath: string, fileType: 'PDF' | 'DOCX'): Promise<string> {
  const text = fileType === 'PDF' ? await parsePdf(filePath) : await parseDocx(filePath);
  if (!text) {
    throw new Error(
      'No readable text was found in the CV. Scanned PDFs require OCR before they can be parsed.',
    );
  }
  return text;
}

export function extractStructuredCvData(rawText: string): StructuredCvData {
  const text = normalizeText(rawText);
  const sections = splitSections(text);
  const header = sections.header || [];
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const linkedinUrl = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s)]+/i)?.[0];
  const phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim();
  const fullName = header.find(
    (line) =>
      line.length >= 3 &&
      line.length <= 80 &&
      !line.includes('@') &&
      !/\d{3,}/.test(line) &&
      !/curriculum vitae|resume|cv\b/i.test(line),
  );
  const currentRole = header.find(
    (line) =>
      line !== fullName &&
      line.length >= 3 &&
      line.length <= 100 &&
      !line.includes('@') &&
      !/^https?:/i.test(line) &&
      !/\d{3,}/.test(line),
  );
  const location = header.find(
    (line) =>
      line !== fullName &&
      line !== currentRole &&
      !line.includes('@') &&
      !/^https?:/i.test(line) &&
      !line.includes(phone || '__no_phone__'),
  );

  return {
    ...(fullName ? { fullName } : {}),
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    ...(currentRole ? { currentRole } : {}),
    ...(location ? { location } : {}),
    ...(linkedinUrl ? { linkedinUrl } : {}),
    ...(sections.summary?.length ? { summary: sections.summary.join('\n') } : {}),
    skills: parseSkills(sections.skills || []),
    experience: parseExperience(sections.experience || []),
    education: parseEducation(sections.education || []),
  };
}
