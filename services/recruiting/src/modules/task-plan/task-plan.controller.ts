import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TaskPlanService } from './task-plan.service';

@Controller()
export class TaskPlanController {
  constructor(private readonly service: TaskPlanService) {}

  @MessagePattern('task-plan.create')
  create(
    @Payload()
    payload: {
      overallPlanId: string;
      taskType: string;
      assignedToId: string;
      startDate: string;
      endDate: string;
      notes?: string;
    },
  ) {
    return this.service.create(payload);
  }

  @MessagePattern('task-plan.list')
  list(@Payload() payload: { overallPlanId: string }) {
    return this.service.list(payload.overallPlanId);
  }

  @MessagePattern('task-plan.get')
  get(@Payload() payload: { id: string }) {
    return this.service.get(payload.id);
  }

  @MessagePattern('task-plan.update')
  update(
    @Payload()
    payload: {
      id: string;
      taskType?: string;
      assignedToId?: string;
      startDate?: string;
      endDate?: string;
      notes?: string;
    },
  ) {
    const { id, ...data } = payload;
    return this.service.update(id, data);
  }

  @MessagePattern('task-plan.createByRequest')
  createByRequest(
    @Payload()
    payload: {
      hiringRequestId: string;
      taskType: string;
      assignedToId: string;
      startDate: string;
      endDate: string;
      notes?: string;
    },
  ) {
    return this.service.createByRequest(payload);
  }

  @MessagePattern('task-plan.listByRequest')
  listByRequest(@Payload() payload: { hiringRequestId: string }) {
    return this.service.listByRequest(payload.hiringRequestId);
  }

  @MessagePattern('task-plan.updateStatus')
  updateStatus(@Payload() payload: { id: string; status: string }) {
    return this.service.updateStatus(payload.id, payload.status);
  }
}
