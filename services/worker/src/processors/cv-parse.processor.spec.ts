import { PrismaClient } from '@prisma/client';
import { buildCvSearchText, extractCvWithAi, extractText, isCvAiConfigured } from '@wr/ai';
import { logger } from '../logger';
import { processCvParseJob } from './cv-parse.processor';

jest.mock('@prisma/client', () => {
  const mockPrisma: any = {
    candidateCV: { findUnique: jest.fn(), update: jest.fn() },
    candidateProfile: { update: jest.fn() },
  };
  mockPrisma.$transaction = jest.fn(async (callback: any) => callback(mockPrisma));
  return {
    Prisma: { JsonNull: null },
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

jest.mock('@wr/database', () => ({
  AuditLogService: jest.fn().mockImplementation(() => ({
    log: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@wr/ai', () => ({
  extractText: jest.fn(),
  extractCvWithAi: jest.fn(),
  isCvAiConfigured: jest.fn(),
  buildCvSearchText: jest.fn((rawText: string) => rawText),
}));

describe('processCvParseJob', () => {
  let prismaMock: any;
  const candidate = { id: 'candidate-1', structuredData: {}, summary: null, phone: null };

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock = new PrismaClient() as any;
    prismaMock.candidateCV.update.mockResolvedValue({});
    prismaMock.candidateProfile.update.mockResolvedValue({});
    (isCvAiConfigured as jest.Mock).mockReturnValue(false);
    (buildCvSearchText as jest.Mock).mockImplementation((rawText: string) => rawText);
  });

  it('skips parsing if CandidateCV extraction is already completed', async () => {
    prismaMock.candidateCV.findUnique.mockResolvedValue({
      id: 'cv-1',
      candidateId: candidate.id,
      candidate,
      rawText: 'Already parsed content',
      parsedAt: new Date(),
      processingStatus: 'COMPLETED',
      structuredData: null,
    });
    const consoleSpy = jest.spyOn(logger, 'log').mockImplementation();

    const result = await processCvParseJob({ cvDocumentId: 'cv-1', filePath: 'cv-1.pdf' });

    expect(prismaMock.candidateCV.findUnique).toHaveBeenCalledWith({
      where: { id: 'cv-1' },
      include: { candidate: true },
    });
    expect(extractText).not.toHaveBeenCalled();
    expect(prismaMock.candidateCV.update).not.toHaveBeenCalled();
    expect(result).toEqual({ cvDocumentId: 'cv-1', rawText: 'Already parsed content' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[Idempotency]'));
    consoleSpy.mockRestore();
  });

  it('uses local extraction for a text-based CV when AI is not configured', async () => {
    const localText = `Experienced engineer ${'TypeScript Node PostgreSQL '.repeat(20)}`.trim();
    prismaMock.candidateCV.findUnique.mockResolvedValue({
      id: 'cv-2',
      candidateId: candidate.id,
      candidate,
      fileName: 'cv-2.pdf',
      fileType: 'PDF',
      rawText: '',
      parsedAt: null,
      processingStatus: 'PENDING',
    });
    (extractText as jest.Mock).mockResolvedValue(localText);

    const result = await processCvParseJob({ cvDocumentId: 'cv-2', filePath: 'cv-2.pdf' });

    expect(extractText).toHaveBeenCalledWith('cv-2.pdf', 'PDF');
    expect(prismaMock.candidateCV.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ processingStatus: 'PROCESSING' }),
      }),
    );
    expect(prismaMock.candidateCV.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          rawText: localText,
          processingStatus: 'COMPLETED',
          processingMethod: 'LOCAL_TEXT',
        }),
      }),
    );
    expect(result).toEqual({ cvDocumentId: 'cv-2', rawText: localText });
  });

  it('uses AI vision OCR and persists structured resume data for an image PDF', async () => {
    prismaMock.candidateCV.findUnique.mockResolvedValue({
      id: 'cv-3',
      candidateId: candidate.id,
      candidate,
      fileName: 'canva-cv.pdf',
      fileType: 'PDF',
      rawText: '',
      parsedAt: null,
      processingStatus: 'PENDING',
    });
    (extractText as jest.Mock).mockRejectedValue(new Error('PDF has no readable text layer'));
    (isCvAiConfigured as jest.Mock).mockReturnValue(true);
    (extractCvWithAi as jest.Mock).mockResolvedValue({
      documentText: 'Jane Doe\nSenior Engineer\nTypeScript React Node.js',
      resume: {
        currentRole: 'Senior Engineer',
        yearsOfExperience: 2.5,
        skills: { technical: ['TypeScript', 'React', 'Node.js'] },
      },
      confidence: 0.94,
      warnings: [],
      method: 'AI_VISION',
      model: 'vision-model',
    });
    (buildCvSearchText as jest.Mock).mockReturnValue('enriched semantic CV');

    const result = await processCvParseJob({
      cvDocumentId: 'cv-3',
      filePath: 'https://storage.example/canva-cv.pdf',
    });

    expect(extractCvWithAi).toHaveBeenCalledWith(
      expect.objectContaining({ fileType: 'PDF', rawText: '' }),
    );
    expect(prismaMock.candidateProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          structuredData: expect.objectContaining({ yearsOfExperience: 2.5 }),
        }),
      }),
    );
    expect(prismaMock.candidateCV.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          processingStatus: 'COMPLETED',
          processingMethod: 'AI_VISION',
          structuredData: expect.any(Object),
        }),
      }),
    );
    expect(result).toEqual({ cvDocumentId: 'cv-3', rawText: 'enriched semantic CV' });
  });

  it('marks an image CV failed when OCR is not configured', async () => {
    prismaMock.candidateCV.findUnique.mockResolvedValue({
      id: 'cv-4',
      candidateId: candidate.id,
      candidate,
      fileName: 'scan.pdf',
      fileType: 'PDF',
      rawText: '',
      parsedAt: null,
      processingStatus: 'PENDING',
    });
    (extractText as jest.Mock).mockResolvedValue('');

    await expect(processCvParseJob({ cvDocumentId: 'cv-4', filePath: 'scan.pdf' })).rejects.toThrow(
      'GEMINI_API_KEY or GEMINI_API_KEYS',
    );
    expect(prismaMock.candidateCV.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ processingStatus: 'FAILED' }),
      }),
    );
  });
});
