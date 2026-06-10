import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AuditLogService } from '@wr/database';
import { AuditAction, AuditEntityType } from '@wr/contracts';
import { PrismaService } from '../../common/database/prisma.service';
import { QUEUE_NAMES, JOB_NAMES } from '@wr/queue';

@Injectable()
export class CvService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    @InjectQueue(QUEUE_NAMES.CV_PARSE) private readonly cvParseQueue: Queue,
  ) {}

  async uploadCv(payload: {
    candidateId: string;
    fileName: string;
    fileType: 'PDF' | 'DOCX';
    filePath: string;
    rawText?: string;
    requestId?: string;
  }) {
    const { candidateId, fileName, fileType, filePath, rawText = '' } = payload;

    // Check if the candidate profile exists (can check by id or userId)
    const profile = await this.prisma.candidateProfile.findFirst({
      where: {
        OR: [
          { id: candidateId },
          { userId: candidateId },
        ],
      },
    });

    if (!profile) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Candidate profile not found for candidate ID ${candidateId}`,
      });
    }

    // Save CV record to database
    const cvRecord = await this.prisma.candidateCV.create({
      data: {
        candidateId: profile.id,
        fileName,
        fileType,
        filePath,
        rawText,
      },
    });

    this.auditLog.log({
      entityType: AuditEntityType.CV,
      entityId: cvRecord.id,
      action: AuditAction.CV_UPLOADED,
      toStatus: 'UPLOADED',
      performedById: candidateId,
      metadata: { fileName, fileType },
    }).catch((err) => console.error('Failed to write audit log for CV_UPLOADED:', err));

    // Enqueue BullMQ job for parsing
    await this.cvParseQueue.add(
      JOB_NAMES.PARSE_CV,
      {
        cvDocumentId: cvRecord.id,
        filePath: cvRecord.filePath,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );

    return cvRecord;
  }

  async getCv(id: string) {
    const cvRecord = await this.prisma.candidateCV.findUnique({
      where: { id },
    });

    if (!cvRecord) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `CV Document with ID ${id} not found`,
      });
    }

    return cvRecord;
  }

  async getCvByCandidate(candidateId: string) {
    const profile = await this.prisma.candidateProfile.findFirst({
      where: {
        OR: [
          { id: candidateId },
          { userId: candidateId },
        ],
      },
    });

    if (!profile) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Candidate profile not found for ID ${candidateId}`,
      });
    }

    const cvRecord = await this.prisma.candidateCV.findFirst({
      where: { candidateId: profile.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!cvRecord) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `No CV Document found for candidate ID ${candidateId}`,
      });
    }

    return cvRecord;
  }

  async listCvs(query: { candidateId?: string }) {
    let candidateId = query.candidateId;
    if (candidateId) {
      const profile = await this.prisma.candidateProfile.findFirst({
        where: {
          OR: [
            { id: candidateId },
            { userId: candidateId },
          ],
        },
      });
      if (profile) {
        candidateId = profile.id;
      }
    }

    const where = candidateId ? { candidateId } : {};
    return this.prisma.candidateCV.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteCv(id: string) {
    const cvRecord = await this.prisma.candidateCV.findUnique({
      where: { id },
    });

    if (!cvRecord) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `CV Document with ID ${id} not found`,
      });
    }

    await this.prisma.candidateCV.delete({
      where: { id },
    });

    return { success: true, message: `CV Document with ID ${id} successfully deleted` };
  }
}
