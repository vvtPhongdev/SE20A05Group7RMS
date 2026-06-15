import { processCvParseJob } from './cv-parse.processor';
import { PrismaClient } from '@prisma/client';
import { extractText } from '@wr/ai';
import { logger } from '../logger';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    candidateCV: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    candidateProfile: {
      update: jest.fn(),
    },
    $transaction: jest.fn((operations: unknown[]) => Promise.all(operations)),
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

jest.mock('@wr/database', () => {
  return {
    AuditLogService: jest.fn().mockImplementation(() => {
      return {
        log: jest.fn().mockResolvedValue(undefined),
      };
    }),
  };
});

jest.mock('@wr/ai', () => {
  return {
    extractText: jest.fn().mockResolvedValue('Mocked CV Text Content'),
    extractStructuredCvData: jest.fn().mockReturnValue({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+84 900 000 000',
      currentRole: 'Software Engineer',
      summary: 'Experienced engineer',
      skills: ['TypeScript'],
      experience: [],
      education: [],
    }),
  };
});

describe('processCvParseJob', () => {
  let prismaMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock = new PrismaClient() as any;
  });

  it('skips parsing if CandidateCV is already parsed', async () => {
    prismaMock.candidateCV.findUnique.mockResolvedValue({
      id: 'cv-1',
      rawText: 'Already parsed content',
      parsedAt: new Date(),
      candidateId: 'candidate-1',
      candidate: {
        phone: null,
        summary: null,
        structuredData: {},
      },
    });

    const consoleSpy = jest.spyOn(logger, 'log').mockImplementation();

    await processCvParseJob({ cvDocumentId: 'cv-1', filePath: 'cv-1.pdf' });

    expect(prismaMock.candidateCV.findUnique).toHaveBeenCalledWith({
      where: { id: 'cv-1' },
      include: { candidate: true },
    });
    expect(extractText).not.toHaveBeenCalled();
    expect(prismaMock.candidateCV.update).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Idempotency] CandidateCV cv-1 has already been parsed'),
    );
    consoleSpy.mockRestore();
  });

  it('runs parsing if CandidateCV is not yet parsed', async () => {
    prismaMock.candidateCV.findUnique.mockResolvedValue({
      id: 'cv-2',
      rawText: '',
      parsedAt: null,
      candidateId: 'candidate-2',
      candidate: {
        phone: null,
        summary: null,
        structuredData: {},
      },
    });

    await processCvParseJob({ cvDocumentId: 'cv-2', filePath: 'cv-2.pdf' });

    expect(prismaMock.candidateCV.findUnique).toHaveBeenCalledWith({
      where: { id: 'cv-2' },
      include: { candidate: true },
    });
    expect(extractText).toHaveBeenCalledWith('cv-2.pdf', 'PDF');
    expect(prismaMock.candidateCV.update).toHaveBeenCalledWith({
      where: { id: 'cv-2' },
      data: expect.objectContaining({
        rawText: 'Mocked CV Text Content',
        parsedAt: expect.any(Date),
      }),
    });
    expect(prismaMock.candidateProfile.update).toHaveBeenCalledWith({
      where: { id: 'candidate-2' },
      data: expect.objectContaining({
        structuredData: expect.objectContaining({
          resume: expect.objectContaining({
            personalInfo: expect.objectContaining({
              fullName: 'Jane Doe',
              email: 'jane@example.com',
              phoneNumber: '+84 900 000 000',
            }),
            currentRole: 'Software Engineer',
            skills: expect.objectContaining({
              technical: ['TypeScript'],
            }),
          }),
        }),
      }),
    });
  });
});
