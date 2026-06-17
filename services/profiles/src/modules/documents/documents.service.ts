import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return { message: 'Documents endpoint — not yet implemented' };
  }

  async createFromUpload(payload: {
    candidateProfileId?: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes?: number;
    filePath?: string; // public URL
    bucket?: string;
    path?: string;
  }) {
    if (!payload.candidateProfileId) {
      throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: 'candidateProfileId required' });
    }

    try {
      const created = await this.prisma.candidateCV.create({
        data: {
          candidateId: payload.candidateProfileId,
          fileName: payload.fileName,
          fileType: payload.mimeType.includes('pdf') ? 'PDF' : payload.mimeType.includes('officedocument') ? 'DOCX' : payload.mimeType,
          filePath: payload.filePath || payload.path || '',
          rawText: '',
        },
      });

      return created;
    } catch (error) {
      throw new RpcException({ status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to save document' });
    }
  }
}
