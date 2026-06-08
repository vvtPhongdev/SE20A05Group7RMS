import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';

/**
 * Service for managing CV screening status (FR-12).
 * Supports single update and bulk update of the `screeningStatus` field
 * on `CandidateCV` records.
 */
@Injectable()
export class CvScreeningService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Update the screening status of a single CV.
   * @param cvId   ID of the CandidateCV record
   * @param status New status (PENDING | SHORTLISTED | REJECTED)
   */
  async updateStatus(cvId: string, status: string) {
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

    return this.prisma.candidateCV.update({
      where: { id: cvId },
      data: { screeningStatus: status },
    });
  }

  /**
   * Bulk update screening status for multiple CVs.
   * @param ids    Array of CandidateCV IDs
   * @param status New status (PENDING | SHORTLISTED | REJECTED)
   */
  async bulkUpdate(ids: string[], status: string) {
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
      select: { id: true },
    });
    const missing = ids.filter((id) => !existing.find((e) => e.id === id));
    if (missing.length) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `CandidateCV(s) not found: ${missing.join(', ')}`,
      });
    }
    return this.prisma.candidateCV.updateMany({
      where: { id: { in: ids } },
      data: { screeningStatus: status },
    });
  }
}
