import { processCvEmbeddingJob } from './cv-embedding.processor';
import { PrismaClient } from '@prisma/client';
import { logger } from '../logger';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    candidateCV: {
      findUnique: jest.fn(),
    },
    cvEmbedding: {
      findFirst: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    $executeRawUnsafe: jest.fn(),
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

jest.mock('@xenova/transformers', () => {
  const mockExtractor = jest.fn().mockResolvedValue({
    data: new Float32Array([0.1, 0.2, 0.3])
  });
  return {
    pipeline: jest.fn().mockResolvedValue(mockExtractor),
  };
}, { virtual: true });

describe('processCvEmbeddingJob', () => {
  let prismaMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock = new PrismaClient() as any;
  });

  it('skips generating embedding if CvEmbedding already exists', async () => {
    prismaMock.candidateCV.findUnique.mockResolvedValue({ id: 'cv-1' });
    prismaMock.cvEmbedding.findFirst.mockResolvedValue({ id: 'emb-1', cvDocumentId: 'cv-1' });

    const consoleSpy = jest.spyOn(logger, 'log').mockImplementation();

    await processCvEmbeddingJob({ cvDocumentId: 'cv-1', rawText: 'CV content' });

    expect(prismaMock.candidateCV.findUnique).toHaveBeenCalledWith({ where: { id: 'cv-1' } });
    expect(prismaMock.cvEmbedding.findFirst).toHaveBeenCalledWith({ where: { cvDocumentId: 'cv-1' } });
    expect(prismaMock.cvEmbedding.create).not.toHaveBeenCalled();
    expect(prismaMock.$executeRawUnsafe).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Idempotency] CvEmbedding for CV document cv-1 already exists'),
    );
    consoleSpy.mockRestore();
  });

  it('generates embedding if CvEmbedding does not exist', async () => {
    prismaMock.candidateCV.findUnique.mockResolvedValue({ id: 'cv-2' });
    prismaMock.cvEmbedding.findFirst.mockResolvedValue(null);
    prismaMock.cvEmbedding.create.mockResolvedValue({ id: 'emb-2' });

    await processCvEmbeddingJob({ cvDocumentId: 'cv-2', rawText: 'New CV content' });

    expect(prismaMock.candidateCV.findUnique).toHaveBeenCalledWith({ where: { id: 'cv-2' } });
    expect(prismaMock.cvEmbedding.findFirst).toHaveBeenCalledWith({ where: { cvDocumentId: 'cv-2' } });
    expect(prismaMock.cvEmbedding.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        cvDocumentId: 'cv-2',
        chunkText: 'New CV content',
      }),
      select: { id: true }
    });
    expect(prismaMock.$executeRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE cv_embeddings'),
      expect.any(String),
      'emb-2'
    );
  });
});
