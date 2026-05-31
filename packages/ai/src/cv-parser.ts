/**
 * Parses a PDF CV file and returns its raw text contents (Stub).
 *
 * @param filePath The local filesystem path of the PDF
 * @returns A promise resolving to the extracted text
 */
export async function parsePdf(filePath: string): Promise<string> {
  console.log(`[CV Parser Stub] Parsing PDF file at path: ${filePath}`);
  return `Alex Rivera CV — Senior TypeScript Developer.
Experience: 8 years of React, Node.js, and PostgreSQL.
Skills: TypeScript, JavaScript, React, Node.js, Next.js, PostgreSQL, Prisma, Redis, Docker, Kubernetes.
Summary: Passionate developer focusing on performance, reliability, and code quality in microservices architectures.`;
}

/**
 * Parses a DOCX CV file and returns its raw text contents (Stub).
 *
 * @param filePath The local filesystem path of the DOCX
 * @returns A promise resolving to the extracted text
 */
export async function parseDocx(filePath: string): Promise<string> {
  console.log(`[CV Parser Stub] Parsing DOCX file at path: ${filePath}`);
  return `Priya Sharma CV — Machine Learning Engineer & Data Scientist.
Experience: 5 years of Python, TensorFlow, and AWS SageMaker.
Skills: Python, Go, TensorFlow, PyTorch, SQL, AWS, Docker, Git.
Summary: Data scientist with a PhD in Computer Science and experience building robust production ML pipelines.`;
}

/**
 * Helper function to extract text based on file format.
 */
export async function extractText(filePath: string, fileType: 'PDF' | 'DOCX'): Promise<string> {
  if (fileType === 'PDF') {
    return parsePdf(filePath);
  } else if (fileType === 'DOCX') {
    return parseDocx(filePath);
  } else {
    throw new Error(`Unsupported document file type: ${fileType}`);
  }
}
