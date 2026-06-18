import { processCvEmbeddingJob } from './cv-embedding.processor';
import { PrismaClient } from '@prisma/client';

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

jest.mock('@wr/ai', () => {
  return {
    getEmbedding: jest.fn().mockResolvedValue(new Float32Array([0.1, 0.2, 0.3])),
    embeddingToPgVector: jest.fn((embedding: Float32Array) => `[${Array.from(embedding).join(',')}]`),
  };
}, { virtual: true });

describe('processCvEmbeddingJob', () => {
  let prismaMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock = new PrismaClient() as any;
  });

  it('replaces existing embeddings before writing a refreshed vector', async () => {
    prismaMock.candidateCV.findUnique.mockResolvedValue({ id: 'cv-1' });
    prismaMock.cvEmbedding.create.mockResolvedValue({ id: 'emb-1' });

    await processCvEmbeddingJob({ cvDocumentId: 'cv-1', rawText: 'CV content' });

    expect(prismaMock.candidateCV.findUnique).toHaveBeenCalledWith({ where: { id: 'cv-1' } });
    expect(prismaMock.cvEmbedding.deleteMany).toHaveBeenCalledWith({
      where: { cvDocumentId: 'cv-1' },
    });
    expect(prismaMock.cvEmbedding.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        cvDocumentId: 'cv-1',
        chunkText: 'CV content',
      }),
      select: { id: true },
    });
    expect(prismaMock.$executeRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE cv_embeddings'),
      expect.any(String),
      'emb-1',
    );
  });

  it('generates embedding if CvEmbedding does not exist', async () => {
    prismaMock.candidateCV.findUnique.mockResolvedValue({ id: 'cv-2' });
    prismaMock.cvEmbedding.findFirst.mockResolvedValue(null);
    prismaMock.cvEmbedding.create.mockResolvedValue({ id: 'emb-2' });

    await processCvEmbeddingJob({ cvDocumentId: 'cv-2', rawText: 'New CV content' });

    expect(prismaMock.candidateCV.findUnique).toHaveBeenCalledWith({ where: { id: 'cv-2' } });
    expect(prismaMock.cvEmbedding.deleteMany).toHaveBeenCalledWith({
      where: { cvDocumentId: 'cv-2' },
    });
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
