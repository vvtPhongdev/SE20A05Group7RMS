import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DocumentsService } from './documents.service';

@Controller()
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @MessagePattern('documents.upload')
  upload(@Payload() payload: {
    fileBuffer: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    documentType: string;
    uploadedById: string;
    candidateProfileId?: string | null;
    roleId?: string | null;
  }) {
    return this.service.upload(payload);
  }

  @MessagePattern('documents.list')
  list(@Payload() payload: {
    uploadedById?: string;
    documentType?: string;
    candidateProfileId?: string;
    page?: string | number;
    pageSize?: string | number;
  }) {
    return this.service.list(payload);
  }

  @MessagePattern('documents.get')
  get(@Payload() payload: { id: string }) {
    return this.service.get(payload.id);
  }
}
