import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InvitesService } from './invites.service';

@ApiTags('invites')
@Controller('invites')
export class InvitesController {
  constructor(private readonly service: InvitesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
