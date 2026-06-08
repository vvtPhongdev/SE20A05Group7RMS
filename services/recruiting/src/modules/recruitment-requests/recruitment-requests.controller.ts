import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RecruitmentRequestsService } from './recruitment-requests.service';

@Controller()
export class RecruitmentRequestsController {
  constructor(private readonly service: RecruitmentRequestsService) {}

  @MessagePattern('recruiting.request.reject')
  reject(@Payload() payload: { id: string; approverId: string; reason: string }) {
    return this.service.reject(payload.id, payload.approverId, payload.reason);
  }
}
