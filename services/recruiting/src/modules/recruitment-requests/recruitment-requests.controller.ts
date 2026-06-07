import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RecruitmentRequestsService } from './recruitment-requests.service';

@Controller()
export class RecruitmentRequestsController {
  constructor(private readonly service: RecruitmentRequestsService) {}

  @MessagePattern('recruiting.request.request_revision')
  requestRevision(@Payload() payload: { id: string; approverId: string; feedback: string }) {
    return this.service.requestRevision(payload.id, payload.approverId, payload.feedback);
  }
}
