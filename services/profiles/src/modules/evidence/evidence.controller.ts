import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EvidenceService } from './evidence.service';

@ApiTags('evidence')
@Controller('evidence')
export class EvidenceController {
  constructor(private readonly service: EvidenceService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
