import { readFile } from 'fs/promises';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

const isRemoteFile = (filePath: string) => /^https?:\/\//i.test(filePath);

async function readFileBuffer(filePath: string): Promise<Buffer> {
  if (!isRemoteFile(filePath)) {
    return readFile(filePath);
  }

  const response = await fetch(filePath);
  if (!response.ok) {
    throw new Error(`Unable to download CV file (${response.status} ${response.statusText})`);
  }

  return Buffer.from(await response.arrayBuffer());
}

const normalizeExtractedText = (text: string) =>
  text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"');

const isWordHtmlDocument = (buffer: Buffer) =>
  /^\s*<html[\s>]/i.test(buffer.subarray(0, 512).toString('utf8'));

const parseWordHtmlText = (html: string) =>
  normalizeExtractedText(
    html
      .replace(/<head[\s\S]*?<\/head>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<\/(?:p|h1|h2|h3|li|tr|div|ul|table)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[^;\s]+;|&#\d+;|&#x[0-9a-f]+;/gi, (entity) => decodeHtmlEntities(entity)),
  );

/**
 * Parses a PDF CV file and returns its raw text contents.
 *
 * @param filePath The local filesystem path or public URL of the PDF
 * @returns A promise resolving to the extracted text
 */
export async function parsePdf(filePath: string): Promise<string> {
  const buffer = await readFileBuffer(filePath);
  return parsePdfBuffer(buffer);
}

export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText({ pageJoiner: '\n' });
    return normalizeExtractedText(result.text);
  } finally {
    await parser.destroy();
  }
}

/**
 * Parses a DOCX CV file and returns its raw text contents.
 *
 * @param filePath The local filesystem path or public URL of the DOCX
 * @returns A promise resolving to the extracted text
 */
export async function parseDocx(filePath: string): Promise<string> {
  const buffer = await readFileBuffer(filePath);
  return parseDocxBuffer(buffer);
}

export async function parseDocxBuffer(buffer: Buffer): Promise<string> {
  if (isWordHtmlDocument(buffer)) {
    return parseWordHtmlText(buffer.toString('utf8'));
  }

  const result = await mammoth.extractRawText({ buffer });
  return normalizeExtractedText(result.value);
}

/**
 * Parses the Word-compatible HTML .doc template used by the webapp.
 * Legacy binary .doc parsing is intentionally not supported.
 */
export async function parseDoc(filePath: string): Promise<string> {
  const buffer = await readFileBuffer(filePath);
  return parseDocBuffer(buffer);
}

export async function parseDocBuffer(buffer: Buffer): Promise<string> {
  const html = buffer.toString('utf8');

  if (!/<html[\s>]/i.test(html)) {
    throw new Error('Legacy binary DOC files are not supported. Please upload PDF, DOCX, or the RMS template DOC.');
  }

  return parseWordHtmlText(html);
}

/**
 * Helper function to extract text based on file format.
 */
export async function extractText(
  filePath: string,
  fileType: 'PDF' | 'DOCX' | 'DOC',
): Promise<string> {
  if (fileType === 'PDF') {
    return parsePdf(filePath);
  } else if (fileType === 'DOCX') {
    return parseDocx(filePath);
  } else if (fileType === 'DOC') {
    return parseDoc(filePath);
  } else {
    throw new Error(`Unsupported document file type: ${fileType}`);
  }
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  fileType: 'PDF' | 'DOCX' | 'DOC',
): Promise<string> {
  if (fileType === 'PDF') {
    return parsePdfBuffer(buffer);
  } else if (fileType === 'DOCX') {
    return parseDocxBuffer(buffer);
  } else if (fileType === 'DOC') {
    return parseDocBuffer(buffer);
  } else {
    throw new Error(`Unsupported document file type: ${fileType}`);
  }
}
