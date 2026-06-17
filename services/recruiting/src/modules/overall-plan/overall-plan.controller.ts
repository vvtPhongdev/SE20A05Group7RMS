import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OverallPlanService } from './overall-plan.service';

@Controller()
export class OverallPlanController {
  constructor(private readonly service: OverallPlanService) {}

  @MessagePattern('overall-plan.create')
  create(
    @Payload()
    payload: {
      hiringRequestId: string;
      createdById: string;
      startDate: string;
      endDate: string;
    },
  ) {
    return this.service.create(payload);
  }

  @MessagePattern('overall-plan.get')
  get(@Payload() payload: { id: string }) {
    return this.service.get(payload.id);
  }

  @MessagePattern('overall-plan.getByRequest')
  getByRequest(@Payload() payload: { hiringRequestId: string }) {
    return this.service.getByRequest(payload.hiringRequestId);
  }

  @MessagePattern('overall-plan.approve')
  approve(@Payload() payload: { id: string; approvedById: string }) {
    return this.service.approve(payload);
  }

  @MessagePattern('overall-plan.submit')
  submit(@Payload() payload: { id: string; performedById: string }) {
    return this.service.submit(payload);
  }

  @MessagePattern('overall-plan.reject')
  reject(@Payload() payload: { id: string; approvedById: string; revisionNotes: string }) {
    return this.service.reject(payload);
  }

  @MessagePattern('overall-plan.resubmit')
  resubmit(
    @Payload()
    payload: { id: string; performedById: string; startDate?: string; endDate?: string },
  ) {
    return this.service.resubmit(payload);
  }

  @MessagePattern('overall-plan.start_campaign')
  startCampaign(@Payload() payload: { id: string; performedById: string }) {
    return this.service.startCampaign(payload);
  }
}
