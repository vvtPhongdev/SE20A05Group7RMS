import { RpcException } from '@nestjs/microservices';
import { AuditAction, AuditEntityType } from '@wr/contracts';
import { CvScreeningService } from './cv-screening.service';

describe('CvScreeningService', () => {
  const prisma = {
    candidateCV: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const auditLog = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const service = new CvScreeningService(prisma as any, auditLog as any);

  beforeEach(() => {
    jest.clearAllMocks();
    auditLog.log.mockResolvedValue(undefined);
  });

  describe('updateStatus', () => {
    it('throws if status is invalid', async () => {
      await expect(service.updateStatus('cv-1', 'INVALID')).rejects.toThrow(RpcException);
    });

    it('throws if the CV does not exist', async () => {
      prisma.candidateCV.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus('cv-1', 'SHORTLISTED')).rejects.toThrow(RpcException);
    });

    it('updates status and writes a CV_SCREENING_STATUS_CHANGED audit log', async () => {
      prisma.candidateCV.findUnique.mockResolvedValue({ id: 'cv-1', screeningStatus: 'PENDING' });
      prisma.candidateCV.update.mockResolvedValue({ id: 'cv-1', screeningStatus: 'SHORTLISTED' });

      const result = await service.updateStatus('cv-1', 'SHORTLISTED', 'hr-1');

      expect(prisma.candidateCV.update).toHaveBeenCalledWith({
        where: { id: 'cv-1' },
        data: { screeningStatus: 'SHORTLISTED' },
      });
      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: AuditEntityType.CV,
          entityId: 'cv-1',
          action: AuditAction.CV_SCREENING_STATUS_CHANGED,
          fromStatus: 'PENDING',
          toStatus: 'SHORTLISTED',
          performedById: 'hr-1',
        }),
      );
      expect(result).toEqual({ id: 'cv-1', screeningStatus: 'SHORTLISTED' });
    });

    it('defaults performedById to SYSTEM when not provided', async () => {
      prisma.candidateCV.findUnique.mockResolvedValue({ id: 'cv-1', screeningStatus: 'PENDING' });
      prisma.candidateCV.update.mockResolvedValue({ id: 'cv-1', screeningStatus: 'REJECTED' });

      await service.updateStatus('cv-1', 'REJECTED');

      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({ performedById: 'SYSTEM' }),
      );
    });
  });

  describe('bulkUpdate', () => {
    it('throws if any IDs are missing', async () => {
      prisma.candidateCV.findMany.mockResolvedValue([{ id: 'cv-1', screeningStatus: 'PENDING' }]);

      await expect(service.bulkUpdate(['cv-1', 'cv-2'], 'SHORTLISTED')).rejects.toThrow(
        RpcException,
      );
    });

    it('updates all CVs and writes one audit log entry per CV', async () => {
      prisma.candidateCV.findMany.mockResolvedValue([
        { id: 'cv-1', screeningStatus: 'PENDING' },
        { id: 'cv-2', screeningStatus: 'PENDING' },
      ]);
      prisma.candidateCV.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.bulkUpdate(['cv-1', 'cv-2'], 'SHORTLISTED', 'hr-1');

      expect(prisma.candidateCV.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['cv-1', 'cv-2'] } },
        data: { screeningStatus: 'SHORTLISTED' },
      });
      expect(auditLog.log).toHaveBeenCalledTimes(2);
      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: AuditEntityType.CV,
          entityId: 'cv-1',
          action: AuditAction.CV_SCREENING_STATUS_CHANGED,
          fromStatus: 'PENDING',
          toStatus: 'SHORTLISTED',
          performedById: 'hr-1',
        }),
      );
      expect(result).toEqual({ count: 2 });
    });
  });
});
