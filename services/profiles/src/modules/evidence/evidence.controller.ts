import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EvidenceService } from './evidence.service';

@Controller()
export class EvidenceController {
  constructor(private readonly service: EvidenceService) {}

  @MessagePattern('evidence.list')
  list(@Payload() payload: {
    evaluationRunId?: string;
    evidenceType?: string;
    page?: string | number;
    pageSize?: string | number;
  }) {
    return this.service.list(payload);
  }

  @MessagePattern('evidence.get')
  get(@Payload() payload: { id: string }) {
    return this.service.get(payload.id);
  }
}
