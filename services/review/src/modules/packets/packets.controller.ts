import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PacketsService } from './packets.service';

@ApiTags('packets')
@Controller('packets')
export class PacketsController {
  constructor(private readonly service: PacketsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
