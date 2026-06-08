import { PrismaClient } from '@prisma/client';
import { extractText } from '@wr/ai'; // re‑exports cv‑parser utilities
import { CvParseJobPayload } from '@wr/contracts';

// Singleton Prisma client (same pattern as in other services)
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
});

/**
 * Process a CV parse job.
 *   1️⃣ Load the CandidateCV record.
 *   2️⃣ Extract raw text from the stored file (PDF or DOCX).
 *   3️⃣ Update the record with `rawText` and `parsedAt` timestamp.
 */
export async function processCvParseJob(payload: CvParseJobPayload): Promise<void> {
  const { cvDocumentId, filePath } = payload;

  // 1️⃣ Retrieve the CV record
  const cvRecord = await prisma.candidateCV.findUnique({
    where: { id: cvDocumentId },
  });

  if (!cvRecord) {
    throw new Error(`CandidateCV with id ${cvDocumentId} not found`);
  }

  // 2️⃣ Determine file type from extension (fallback to PDF)
  const ext = filePath.split('.').pop()?.toUpperCase();
  const fileType = ext === 'DOCX' ? 'DOCX' : 'PDF';

  // 3️⃣ Extract raw text using the helper utilities
  const rawText = await extractText(filePath, fileType as 'PDF' | 'DOCX');

  // 4️⃣ Persist the extracted text and mark as parsed
  await prisma.candidateCV.update({
    where: { id: cvDocumentId },
    data: {
      rawText,
      parsedAt: new Date(),
    },
  });

  console.log(`✅ CV ${cvDocumentId} parsed and stored (type=${fileType})`);
}
