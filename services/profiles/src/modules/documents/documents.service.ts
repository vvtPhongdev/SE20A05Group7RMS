import { Injectable } from '@nestjs/common';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(payload: {
    fileBuffer: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    documentType: string;
    uploadedById: string;
    candidateProfileId?: string | null;
    roleId?: string | null;
  }) {
    const uploadsDir = join(process.cwd(), 'uploads');
    mkdirSync(uploadsDir, { recursive: true });

    const uniqueFileName = `${randomUUID()}-${payload.fileName}`;
    const storagePath = join(uploadsDir, uniqueFileName);
    writeFileSync(storagePath, Buffer.from(payload.fileBuffer, 'base64'));

    return this.prisma.document.create({
      data: {
        uploadedById: payload.uploadedById,
        documentType: payload.documentType,
        fileName: payload.fileName,
        mimeType: payload.mimeType,
        fileSizeBytes: payload.fileSizeBytes,
        storagePath,
        state: 'PENDING',
        candidateProfileId: payload.candidateProfileId ?? null,
        roleId: payload.roleId ?? null,
      },
    });
  }

  async list(query: {
    uploadedById?: string;
    documentType?: string;
    candidateProfileId?: string;
    page?: string | number;
    pageSize?: string | number;
  }) {
    const page = Number(query.page ?? 1);
    const pageSize = Math.min(Number(query.pageSize ?? 20), 100);

    const where: Record<string, unknown> = {};
    if (query.uploadedById) where['uploadedById'] = query.uploadedById;
    if (query.documentType) where['documentType'] = query.documentType;
    if (query.candidateProfileId) where['candidateProfileId'] = query.candidateProfileId;

    const [data, total] = await Promise.all([
      this.prisma.document.findMany({
        where: where as any,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          documentType: true,
          fileName: true,
          mimeType: true,
          fileSizeBytes: true,
          state: true,
          candidateProfileId: true,
          roleId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.document.count({ where: where as any }),
    ]);

    return { data, total, page, pageSize };
  }

  async get(id: string) {
    return this.prisma.document.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        documentType: true,
        fileName: true,
        mimeType: true,
        fileSizeBytes: true,
        storagePath: true,
        state: true,
        parsedContent: true,
        parseError: true,
        version: true,
        candidateProfileId: true,
        roleId: true,
        uploadedById: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
