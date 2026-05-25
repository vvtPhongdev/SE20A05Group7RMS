import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';

@ApiTags('applications')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly service: ApplicationsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
