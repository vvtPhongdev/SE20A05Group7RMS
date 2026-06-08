import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OverallPlanService } from './overall-plan.service';

@Controller()
export class OverallPlanController {
  constructor(private readonly service: OverallPlanService) {}

  @MessagePattern('overall-plan.approve')
  approve(@Payload() payload: { hiringRequestId: string; approverId: string }) {
    return this.service.approve(payload.hiringRequestId, payload.approverId);
  }

  @MessagePattern('overall-plan.reject')
  reject(@Payload() payload: { hiringRequestId: string; approverId: string; reason: string }) {
    return this.service.reject(payload.hiringRequestId, payload.approverId, payload.reason);
  }
}
