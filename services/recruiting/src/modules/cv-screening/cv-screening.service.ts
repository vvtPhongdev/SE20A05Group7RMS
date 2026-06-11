import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { AuditLogService } from '@wr/database';
import { AuditAction, AuditEntityType } from '@wr/contracts';
import { PrismaService } from '../../common/database/prisma.service';

/**
 * Service for managing CV screening status (FR-12).
 * Supports single update and bulk update of the `screeningStatus` field
 * on `CandidateCV` records.
 */
@Injectable()
export class CvScreeningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Update the screening status of a single CV.
   * @param cvId   ID of the CandidateCV record
   * @param status New status (PENDING | SHORTLISTED | REJECTED)
   * @param performedById ID of the actor performing the change (defaults to SYSTEM)
   */
  async updateStatus(cvId: string, status: string, performedById?: string) {
    // Validate allowed statuses
    const allowed = ['PENDING', 'SHORTLISTED', 'REJECTED'];
    if (!allowed.includes(status)) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Invalid screening status. Allowed values: ${allowed.join(', ')}`,
      });
    }

    const cv = await this.prisma.candidateCV.findUnique({
      where: { id: cvId },
    });
    if (!cv) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `CandidateCV with ID ${cvId} not found`,
      });
    }

    const updated = await this.prisma.candidateCV.update({
      where: { id: cvId },
      data: { screeningStatus: status },
    });

    this.auditLog.log({
      entityType: AuditEntityType.CV,
      entityId: cvId,
      action: AuditAction.CV_SCREENING_STATUS_CHANGED,
      fromStatus: cv.screeningStatus,
      toStatus: status,
      performedById: performedById || 'SYSTEM',
    }).catch((err) => console.error('Failed to write audit log for CV_SCREENING_STATUS_CHANGED:', err));

    return updated;
  }

  /**
   * Bulk update screening status for multiple CVs.
   * @param ids    Array of CandidateCV IDs
   * @param status New status (PENDING | SHORTLISTED | REJECTED)
   * @param performedById ID of the actor performing the change (defaults to SYSTEM)
   */
  async bulkUpdate(ids: string[], status: string, performedById?: string) {
    const allowed = ['PENDING', 'SHORTLISTED', 'REJECTED'];
    if (!allowed.includes(status)) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Invalid screening status. Allowed values: ${allowed.join(', ')}`,
      });
    }
    // Ensure all IDs exist
    const existing = await this.prisma.candidateCV.findMany({
      where: { id: { in: ids } },
    });
    const missing = ids.filter((id) => !existing.find((e) => e.id === id));
    if (missing.length) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `CandidateCV(s) not found: ${missing.join(', ')}`,
      });
    }

    const result = await this.prisma.candidateCV.updateMany({
      where: { id: { in: ids } },
      data: { screeningStatus: status },
    });

    for (const cv of existing) {
      this.auditLog.log({
        entityType: AuditEntityType.CV,
        entityId: cv.id,
        action: AuditAction.CV_SCREENING_STATUS_CHANGED,
        fromStatus: cv.screeningStatus,
        toStatus: status,
        performedById: performedById || 'SYSTEM',
      }).catch((err) => console.error('Failed to write audit log for CV_SCREENING_STATUS_CHANGED:', err));
    }

    return result;
  }
}
