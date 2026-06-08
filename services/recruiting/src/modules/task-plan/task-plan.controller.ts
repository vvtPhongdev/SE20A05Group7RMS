import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TaskPlanService } from './task-plan.service';

@Controller()
export class TaskPlanController {
  constructor(private readonly service: TaskPlanService) {}

  @MessagePattern('task-plan.list')
  list(@Payload() payload: { overallPlanId: string }) {
    return this.service.list(payload.overallPlanId);
  }

  @MessagePattern('task-plan.listByRequest')
  listByRequest(@Payload() payload: { hiringRequestId: string }) {
    return this.service.listByRequest(payload.hiringRequestId);
  }
}
