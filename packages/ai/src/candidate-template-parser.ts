import { CvExtractionSchema, type CvExtractionData, type ResumeDraftData } from '@wr/contracts';
import { getEmbedding } from './embedding';

const TEMPLATE_MARKER = 'RMS-CV-TEMPLATE: V1';
const TEMPLATE_MODEL = 'rms-template-parser-v1';
const MIN_VECTOR_SIMILARITY = 0.78;
const REQUIRED_HEADINGS = [
  'Professional Summary',
  'Technical Skills',
  'Soft Skills',
  'Languages',
  'Work Experience',
  'Education',
] as const;

const TEMPLATE_SIGNATURE = [
  'RMS Candidate CV Template version 1',
  'Professional Summary',
  'Technical Skills',
  'Soft Skills',
  'Languages',
  'Work Experience',
  'Education',
  'Email Phone Address LinkedIn GitHub Portfolio',
].join('\n');

type EmbedText = (text: string) => Promise<Float32Array>;

export type CandidateTemplateParseResult =
  | { matched: true; extraction: CvExtractionData; similarity: number }
  | { matched: false; reason: string; similarity?: number };

function normalizeText(value: string) {
  return value.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function clean(value: string | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, ' ').trim();
  if (!normalized || /^\[[^\]]+\]$/.test(normalized) || /^(?:n\/a|none)$/i.test(normalized)) {
    return undefined;
  }
  return normalized;
}

function section(text: string, heading: string, nextHeadings: readonly string[]) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const next = nextHeadings.map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const match = text.match(new RegExp(`${escapedHeading}\\s*([\\s\\S]*?)(?=\\n(?:${next})\\b|$)`, 'i'));
  return match?.[1]?.trim() ?? '';
}

function extractLabeledValue(text: string, label: string, labels: string[]) {
  const allLabels = labels.map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(new RegExp(`${escapedLabel}:\\s*([\\s\\S]*?)(?=\\s+(?:${allLabels}):|\\n|$)`, 'i'));
  return clean(match?.[1]);
}

function splitItems(value: string) {
  return value
    .split(/[,;|•]/)
    .map(clean)
    .filter((item): item is string => Boolean(item));
}

function cosineSimilarity(left: Float32Array, right: Float32Array) {
  if (left.length !== right.length || left.length === 0) return 0;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;
    dot += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }
  return leftMagnitude && rightMagnitude ? dot / Math.sqrt(leftMagnitude * rightMagnitude) : 0;
}

function parseResume(text: string): ResumeDraftData {
  const lines = text
    .split('\n')
    .map(clean)
    .filter((line): line is string => Boolean(line));
  const headings = new Set(REQUIRED_HEADINGS.map((heading) => heading.toLowerCase()));
  const frontMatter = lines.filter(
    (line) =>
      !headings.has(line.toLowerCase()) &&
      !/^(?:email|phone|address|linkedin|github|portfolio):/i.test(line) &&
      !line.includes(TEMPLATE_MARKER),
  );
  const labels = ['Email', 'Phone', 'Address', 'LinkedIn', 'GitHub', 'Portfolio'];
  const personalInfo = {
    fullName: frontMatter[0],
    email: extractLabeledValue(text, 'Email', labels),
    phoneNumber: extractLabeledValue(text, 'Phone', labels),
    address: extractLabeledValue(text, 'Address', labels),
    links: [
      ['LINKEDIN', extractLabeledValue(text, 'LinkedIn', labels)],
      ['GITHUB', extractLabeledValue(text, 'GitHub', labels)],
      ['PORTFOLIO', extractLabeledValue(text, 'Portfolio', labels)],
    ]
      .filter(([, url]) => Boolean(url))
      .map(([type, url]) => ({ type: type as 'LINKEDIN' | 'GITHUB' | 'PORTFOLIO', url: url! })),
  };
  const technicalSection = section(text, 'Technical Skills', ['Soft Skills', 'Languages', 'Work Experience', 'Education']);
  const technical = splitItems(
    technicalSection
      .replace(/(?:Programming languages|Frameworks and libraries|Databases and tools):/gi, ',')
      .replace(/\n/g, ','),
  );
  const softSkills = splitItems(section(text, 'Soft Skills', ['Languages', 'Work Experience', 'Education']));
  const languages = section(text, 'Languages', ['Work Experience', 'Education'])
    .split('\n')
    .map(clean)
    .filter((language): language is string => Boolean(language))
    .flatMap((language) => splitItems(language))
    .map((language) => {
      const [name, proficiency] = language.split(/\s+-\s+/, 2);
      const normalizedName = clean(name);
      return normalizedName
        ? { name: normalizedName, ...(clean(proficiency) ? { proficiency: clean(proficiency) } : {}) }
        : undefined;
    })
    .filter((language): language is { name: string; proficiency?: string } => Boolean(language));

  return {
    personalInfo,
    currentRole: frontMatter[1],
    summary: clean(section(text, 'Professional Summary', ['Technical Skills', 'Soft Skills', 'Languages', 'Work Experience', 'Education'])),
    skills: { technical, softSkills, languages },
    // Experience and education may contain many user-specific layouts. Gemini remains the fallback
    // whenever the template parser cannot establish enough confidence from core fields.
    workExperience: [],
    education: [],
  };
}

/**
 * Identifies CVs created from the project template using its marker, headings and local vector model,
 * then extracts its fixed fields without sending the document to Gemini.
 */
export async function parseCandidateTemplateCv(input: {
  fileType: 'PDF' | 'DOCX' | 'DOC';
  rawText: string;
  embed?: EmbedText;
}): Promise<CandidateTemplateParseResult> {
  if (input.fileType !== 'DOC' && input.fileType !== 'DOCX') {
    return { matched: false, reason: 'Only Word files can use the RMS template parser.' };
  }

  const text = normalizeText(input.rawText);
  if (!text.includes(TEMPLATE_MARKER)) {
    return { matched: false, reason: 'RMS template marker is missing.' };
  }
  const missingHeadings = REQUIRED_HEADINGS.filter(
    (heading) => !new RegExp(`(?:^|\\n)${heading}\\b`, 'i').test(text),
  );
  if (missingHeadings.length > 0) {
    return { matched: false, reason: `Required template headings are missing: ${missingHeadings.join(', ')}.` };
  }

  const embed = input.embed ?? getEmbedding;
  const similarity = cosineSimilarity(await embed(TEMPLATE_SIGNATURE), await embed(text.slice(0, 80_000)));
  if (similarity < MIN_VECTOR_SIMILARITY) {
    return { matched: false, similarity, reason: 'Template vector similarity is below the required threshold.' };
  }

  const resume = parseResume(text);
  if (!resume.personalInfo?.fullName || !resume.personalInfo.email) {
    return { matched: false, similarity, reason: 'Template CV is missing a filled full name or email.' };
  }

  return {
    matched: true,
    similarity,
    extraction: CvExtractionSchema.parse({
      documentText: text,
      resume,
      confidence: Math.min(0.99, 0.85 + Math.max(0, similarity - MIN_VECTOR_SIMILARITY) * 0.5),
      warnings: ['Parsed with the RMS template parser; please review imported information before saving.'],
      method: 'LOCAL_TEXT',
      model: TEMPLATE_MODEL,
    }),
  };
}
