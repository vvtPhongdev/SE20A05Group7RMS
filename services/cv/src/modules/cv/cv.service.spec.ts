import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { AuditAction, AuditEntityType } from '@wr/contracts';
import { JOB_NAMES } from '@wr/queue';
import { CvService } from './cv.service';

describe('CvService', () => {
  const prisma = {
    candidateProfile: {
      findFirst: jest.fn(),
    },
    candidateCV: {
      create: jest.fn(),
    },
  };

  const auditLog = {
    log: jest.fn(),
  };

  const cvParseQueue = {
    add: jest.fn(),
  };

  const service = new CvService(prisma as any, auditLog as any, cvParseQueue as any);

  const payload = {
    candidateId: 'user-1',
    fileName: 'candidate.pdf',
    fileType: 'PDF' as const,
    filePath: 'uploads/cv/candidate.pdf',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    auditLog.log.mockResolvedValue(undefined);
    cvParseQueue.add.mockResolvedValue(undefined);
  });

  describe('uploadCv', () => {
    it('rejects the upload when the candidate profile does not exist', async () => {
      prisma.candidateProfile.findFirst.mockResolvedValue(null);

      let thrown: unknown;
      try {
        await service.uploadCv(payload);
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(RpcException);
      expect((thrown as RpcException).getError()).toEqual({
        status: HttpStatus.NOT_FOUND,
        message: 'Candidate profile not found for candidate ID user-1',
      });
      expect(prisma.candidateCV.create).not.toHaveBeenCalled();
      expect(cvParseQueue.add).not.toHaveBeenCalled();
    });

    it('stores the CV against the resolved profile and queues parsing', async () => {
      prisma.candidateProfile.findFirst.mockResolvedValue({
        id: 'profile-1',
        userId: 'user-1',
      });
      const cvRecord = {
        id: 'cv-1',
        candidateId: 'profile-1',
        fileName: payload.fileName,
        fileType: payload.fileType,
        filePath: payload.filePath,
        rawText: '',
      };
      prisma.candidateCV.create.mockResolvedValue(cvRecord);

      const result = await service.uploadCv(payload);

      expect(prisma.candidateProfile.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ id: 'user-1' }, { userId: 'user-1' }],
        },
      });
      expect(prisma.candidateCV.create).toHaveBeenCalledWith({
        data: {
          candidateId: 'profile-1',
          fileName: 'candidate.pdf',
          fileType: 'PDF',
          filePath: 'uploads/cv/candidate.pdf',
          rawText: '',
        },
      });
      expect(auditLog.log).toHaveBeenCalledWith({
        entityType: AuditEntityType.CV,
        entityId: 'cv-1',
        action: AuditAction.CV_UPLOADED,
        toStatus: 'UPLOADED',
        performedById: 'user-1',
        metadata: {
          fileName: 'candidate.pdf',
          fileType: 'PDF',
        },
      });
      expect(cvParseQueue.add).toHaveBeenCalledWith(
        JOB_NAMES.PARSE_CV,
        {
          cvDocumentId: 'cv-1',
          filePath: 'uploads/cv/candidate.pdf',
        },
        {
          jobId: 'cv-parse-cv-1',
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );
      expect(result).toEqual(cvRecord);
    });

    it('preserves provided raw text for an already extracted CV', async () => {
      prisma.candidateProfile.findFirst.mockResolvedValue({ id: 'profile-1' });
      prisma.candidateCV.create.mockResolvedValue({ id: 'cv-2', filePath: payload.filePath });

      await service.uploadCv({ ...payload, rawText: 'Extracted CV text' });

      expect(prisma.candidateCV.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          candidateId: 'profile-1',
          rawText: 'Extracted CV text',
        }),
      });
    });
  });
});
