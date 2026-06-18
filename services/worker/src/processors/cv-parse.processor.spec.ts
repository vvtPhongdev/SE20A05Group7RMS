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
    });

    const consoleSpy = jest.spyOn(logger, 'log').mockImplementation();

    const result = await processCvParseJob({ cvDocumentId: 'cv-1', filePath: 'cv-1.pdf' });

    expect(prismaMock.candidateCV.findUnique).toHaveBeenCalledWith({
      where: { id: 'cv-1' },
    });
    expect(extractText).not.toHaveBeenCalled();
    expect(prismaMock.candidateCV.update).not.toHaveBeenCalled();
    expect(result).toEqual({ cvDocumentId: 'cv-1', rawText: 'Already parsed content' });
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
    });

    const result = await processCvParseJob({ cvDocumentId: 'cv-2', filePath: 'cv-2.pdf' });

    expect(prismaMock.candidateCV.findUnique).toHaveBeenCalledWith({
      where: { id: 'cv-2' },
    });
    expect(extractText).toHaveBeenCalledWith('cv-2.pdf', 'PDF');
    expect(prismaMock.candidateCV.update).toHaveBeenCalledWith({
      where: { id: 'cv-2' },
      data: expect.objectContaining({
        rawText: 'Mocked CV Text Content',
        parsedAt: expect.any(Date),
      }),
    });
    expect(result).toEqual({ cvDocumentId: 'cv-2', rawText: 'Mocked CV Text Content' });
  });
});
