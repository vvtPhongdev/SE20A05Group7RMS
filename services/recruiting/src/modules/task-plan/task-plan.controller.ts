import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TaskPlanService } from './task-plan.service';

@Controller()
export class TaskPlanController {
  constructor(private readonly service: TaskPlanService) {}

  @MessagePattern('task-plan.createByRequest')
  createByRequest(@Payload() payload: any) {
    return this.service.createByRequest(payload);
  }

  @MessagePattern('task-plan.listByRequest')
  listByRequest(@Payload() payload: { hiringRequestId: string }) {
    return this.service.listByRequest(payload.hiringRequestId);
  }

  @MessagePattern('task-plan.get')
  get(@Payload() payload: { id: string }) {
    return this.service.get(payload.id);
  }

  @MessagePattern('task-plan.update')
  update(@Payload() payload: { id: string; [key: string]: any }) {
    const { id, ...rest } = payload;
    return this.service.update(id, rest);
  }

  @MessagePattern('task-plan.updateStatus')
  updateStatus(@Payload() payload: { id: string; status: string }) {
    return this.service.updateStatus(payload.id, payload.status);
  }
}
