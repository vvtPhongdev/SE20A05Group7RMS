import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RecruitmentRequestsService } from './recruitment-requests.service';
import { UserRole } from '@wr/contracts';

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

  @MessagePattern('recruiting.request.submit')
  submit(@Payload() payload: { id: string; actorId: string }) {
    return this.service.submit(payload.id, payload.actorId);
  }

  @MessagePattern('recruiting.request.approve')
  approve(@Payload() payload: { id: string; approverId: string; approverRole: UserRole }) {
    return this.service.approve(payload.id, payload.approverId, payload.approverRole);
  }
}

