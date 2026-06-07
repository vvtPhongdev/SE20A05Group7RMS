import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RecruitmentRequestsService } from './recruitment-requests.service';

@Controller()
export class RecruitmentRequestsController {
  constructor(private readonly service: RecruitmentRequestsService) {}

  @MessagePattern('recruiting.request.create')
  create(@Payload() payload: any) {
    return this.service.create(payload);
  }

  @MessagePattern('recruiting.request.update')
  update(@Payload() payload: { id: string; actorId: string; updates: any }) {
    return this.service.update(payload.id, payload.actorId, payload.updates);
  }
}

