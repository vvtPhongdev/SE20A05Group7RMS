import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RecruitmentRequestsService } from './recruitment-requests.service';

@Controller()
export class RecruitmentRequestsController {
  constructor(private readonly service: RecruitmentRequestsService) {}

  @MessagePattern('recruitment-requests.admin.list')
  listForAdmin(@Payload() payload: any) {
    return this.service.listForAdmin(payload);
  }

  @MessagePattern('recruitment-requests.admin.assign')
  assignToHr(
    @Payload()
    payload: {
      id: string;
      hrManagerId: string;
      assignedById: string;
    },
  ) {
    return this.service.assignToHr(payload);
  }
}
