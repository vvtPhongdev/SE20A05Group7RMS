import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InvitesService } from './invites.service';

@Controller()
export class InvitesController {
  constructor(private readonly service: InvitesService) {}

  @MessagePattern('invites.create')
  create(@Payload() payload: any) {
    return this.service.create(payload);
  }

  @MessagePattern('invites.list')
  list(@Payload() payload: any) {
    return this.service.list(payload);
  }

  @MessagePattern('invites.get')
  get(@Payload() payload: { id: string }) {
    return this.service.get(payload.id);
  }
}
