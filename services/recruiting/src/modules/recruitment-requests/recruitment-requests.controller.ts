import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RecruitmentRequestsService } from './recruitment-requests.service';
import { UserRole } from '@wr/contracts';

@Controller()
export class RecruitmentRequestsController {
  constructor(private readonly service: RecruitmentRequestsService) {}

  @MessagePattern('recruiting.request.approve')
  approve(@Payload() payload: { id: string; approverId: string; approverRole: UserRole }) {
    return this.service.approve(payload.id, payload.approverId, payload.approverRole);
  }
}
