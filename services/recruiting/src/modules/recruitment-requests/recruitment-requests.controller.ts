import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RecruitmentRequestsService } from './recruitment-requests.service';
import { UserRole } from '@wr/contracts';

@Controller()
export class RecruitmentRequestsController {
  constructor(private readonly service: RecruitmentRequestsService) {}

  @MessagePattern('recruiting.request.list')
  list(@Payload() payload: { actorId: string; actorRole: UserRole; filters?: any }) {
    return this.service.list(payload.actorId, payload.actorRole, payload.filters);
  }
}
