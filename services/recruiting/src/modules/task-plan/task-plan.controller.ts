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

  @MessagePattern('task-plan.create')
  create(
    @Payload()
    payload: {
      overallPlanId: string;
      taskType: string;
      assignedToId: string;
      startDate: string;
      endDate: string;
      performedById?: string;
    },
  ) {
    return this.service.create(payload);
  }

  @MessagePattern('task-plan.updateStatus')
  updateStatus(@Payload() payload: { id: string; status: string; performedById: string }) {
    return this.service.updateStatus(payload);
  }
}
