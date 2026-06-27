import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AuditLogService } from '@wr/database';
import { AuditAction, AuditEntityType } from '@wr/contracts';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { QUEUE_NAMES, JOB_NAMES } from '@wr/queue';
import { parseSupabasePublicUrl, removeFile } from '@wr/storage';
import { unlink } from 'fs/promises';

@Injectable()
export class CvService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    @InjectQueue(QUEUE_NAMES.CV_PARSE) private readonly cvParseQueue: Queue,
  ) {}

  private async removeStoredFile(filePath: string) {
    const storageLocation = parseSupabasePublicUrl(filePath);
    if (storageLocation) {
      await removeFile(storageLocation.bucket, storageLocation.path);
      return;
    }

    await unlink(filePath);
  }

  private async enqueueParse(cvRecord: { id: string; filePath: string }) {
    await this.cvParseQueue.add(
      JOB_NAMES.PARSE_CV,
      {
        cvDocumentId: cvRecord.id,
        filePath: cvRecord.filePath,
      },
      {
        jobId: `cv-parse-${cvRecord.id}-${Date.now()}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnFail: true,
      },
    );
  }

  async uploadCv(payload: {
    candidateId: string;
    fileName: string;
    fileType: 'PDF' | 'DOCX' | 'DOC';
    filePath: string;
    rawText?: string;
    requestId?: string;
  }) {
    const { candidateId, fileName, fileType, filePath } = payload;
    const rawText = payload.rawText?.trim() ?? '';

    // Check if the candidate profile exists (can check by id or userId)
    const profile = await this.prisma.candidateProfile.findFirst({
      where: {
        OR: [{ id: candidateId }, { userId: candidateId }],
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
        parsedAt: null,
        processingStatus: 'PENDING',
        processingMethod: null,
        processingError: null,
      },
    });

    this.auditLog
      .log({
        entityType: AuditEntityType.CV,
        entityId: cvRecord.id,
        action: AuditAction.CV_UPLOADED,
        toStatus: 'UPLOADED',
        performedById: candidateId,
        metadata: { fileName, fileType },
      })
      .catch((err) => console.error('Failed to write audit log for CV_UPLOADED:', err));

    await this.enqueueParse(cvRecord);

    return cvRecord;
  }

  async replaceCvForCandidate(payload: {
    id: string;
    userId: string;
    fileName: string;
    fileType: 'PDF' | 'DOCX' | 'DOC';
    filePath: string;
    rawText?: string;
  }) {
    const existing = await this.prisma.candidateCV.findFirst({
      where: {
        id: payload.id,
        candidate: { userId: payload.userId },
      },
    });

    if (!existing) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `CV Document with ID ${payload.id} not found or access denied`,
      });
    }

    const updated = await this.prisma.candidateCV.update({
      where: { id: existing.id },
      data: {
        fileName: payload.fileName,
        fileType: payload.fileType,
        filePath: payload.filePath,
        rawText: payload.rawText?.trim() ?? '',
        parsedAt: null,
        processingStatus: 'PENDING',
        processingMethod: null,
        processingError: null,
        structuredData: Prisma.JsonNull,
        extractedAt: null,
      },
    });

    this.auditLog
      .log({
        entityType: AuditEntityType.CV,
        entityId: updated.id,
        action: AuditAction.CV_UPLOADED,
        fromStatus: existing.processingStatus,
        toStatus: 'REPLACED',
        performedById: payload.userId,
        metadata: {
          previousFileName: existing.fileName,
          fileName: payload.fileName,
          fileType: payload.fileType,
        },
      })
      .catch((err) => console.error('Failed to write audit log for CV replacement:', err));

    await this.enqueueParse(updated);

    if (existing.filePath !== payload.filePath) {
      await this.removeStoredFile(existing.filePath).catch(() => undefined);
    }

    return updated;
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
        OR: [{ id: candidateId }, { userId: candidateId }],
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
      // The department head should see the newest CV the candidate uploaded,
      // regardless of whether parsing later succeeds or fails.
      orderBy: [{ createdAt: 'desc' }, { updatedAt: 'desc' }],
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
          OR: [{ id: candidateId }, { userId: candidateId }],
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
    await this.removeStoredFile(cvRecord.filePath).catch(() => undefined);

    return { success: true, message: `CV Document with ID ${id} successfully deleted` };
  }

  async deleteCvForCandidate(id: string, userId: string) {
    const cvRecord = await this.prisma.candidateCV.findFirst({
      where: {
        id,
        candidate: { userId },
      },
    });

    if (!cvRecord) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `CV Document with ID ${id} not found or access denied`,
      });
    }

    await this.prisma.candidateCV.delete({ where: { id } });
    await this.removeStoredFile(cvRecord.filePath).catch(() => undefined);
    return { success: true, message: `CV Document with ID ${id} successfully deleted` };
  }
}
