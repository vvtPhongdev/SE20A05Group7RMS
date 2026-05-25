import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EvaluationsService } from './evaluations.service';

@ApiTags('evaluations')
@Controller('evaluations')
export class EvaluationsController {
  constructor(private readonly service: EvaluationsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
