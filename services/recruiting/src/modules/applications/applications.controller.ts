import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApplicationsService } from './applications.service';

@Controller()
export class ApplicationsController {
  constructor(private readonly service: ApplicationsService) {}

  @MessagePattern('applications.create')
  create(@Payload() payload: any) {
    return this.service.create(payload);
  }

  @MessagePattern('applications.list')
  list(@Payload() payload: any) {
    return this.service.list(payload);
  }

  @MessagePattern('applications.get')
  get(@Payload() payload: { id: string }) {
    return this.service.get(payload.id);
  }

  @MessagePattern('applications.updateStatus')
  updateStatus(@Payload() payload: { id: string; status: string }) {
    return this.service.updateStatus(payload.id, payload.status);
  }
}
