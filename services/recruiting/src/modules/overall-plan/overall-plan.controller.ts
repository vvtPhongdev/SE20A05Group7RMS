import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OverallPlanService } from './overall-plan.service';

@Controller()
export class OverallPlanController {
  constructor(private readonly service: OverallPlanService) {}

  @MessagePattern('overall-plan.create')
  create(@Payload() payload: { hiringRequestId: string; createdById: string; startDate: string; endDate: string }) {
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
}
