import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @MessagePattern('documents.upload')
  uploadDocument(@Payload() payload: any) {
    return this.service.createFromUpload(payload);
  }
}
