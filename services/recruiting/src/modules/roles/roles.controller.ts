import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RolesService } from './roles.service';

@Controller()
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @MessagePattern('roles.create')
  create(@Payload() payload: any) {
    return this.service.create(payload);
  }

  @MessagePattern('roles.list')
  list(@Payload() payload: any) {
    return this.service.list(payload);
  }

  @MessagePattern('roles.get')
  get(@Payload() payload: { id: string }) {
    return this.service.get(payload.id);
  }
}
