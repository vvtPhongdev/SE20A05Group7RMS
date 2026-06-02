import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { HiringRequestsService } from './hiring-requests.service';

@Controller()
export class HiringRequestsController {
  constructor(private readonly service: HiringRequestsService) {}

  @MessagePattern('hiring-requests.create')
  create(@Payload() payload: any) {
    return this.service.create(payload);
  }

  @MessagePattern('hiring-requests.update')
  update(@Payload() payload: { id: string; actorId: string; [key: string]: any }) {
    const { id, actorId, ...rest } = payload;
    return this.service.update(id, rest, actorId);
  }

  @MessagePattern('hiring-requests.submit')
  submit(@Payload() payload: { id: string; actorId: string }) {
    return this.service.submit(payload.id, payload.actorId);
  }

  @MessagePattern('hiring-requests.approve')
  approve(@Payload() payload: { id: string; actorId: string; comments?: string }) {
    return this.service.approve(payload.id, payload.actorId, payload.comments);
  }

  @MessagePattern('hiring-requests.reject')
  reject(@Payload() payload: { id: string; actorId: string; reason: string }) {
    return this.service.reject(payload.id, payload.actorId, payload.reason);
  }

  @MessagePattern('hiring-requests.requestRevision')
  requestRevision(@Payload() payload: { id: string; actorId: string; feedback: string }) {
    return this.service.requestRevision(payload.id, payload.actorId, payload.feedback);
  }

  @MessagePattern('hiring-requests.list')
  list(@Payload() payload: any) {
    return this.service.list(payload);
  }

  @MessagePattern('hiring-requests.get')
  get(@Payload() payload: { id: string }) {
    return this.service.get(payload.id);
  }
}
