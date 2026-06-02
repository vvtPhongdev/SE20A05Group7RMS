import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DepartmentsService } from './departments.service';

@Controller()
export class DepartmentsController {
  constructor(private readonly deptService: DepartmentsService) {}

  @MessagePattern('departments.create')
  create(@Payload() payload: any) {
    return this.deptService.create(payload);
  }

  @MessagePattern('departments.list')
  list(@Payload() payload: any) {
    return this.deptService.list(payload);
  }

  @MessagePattern('departments.get')
  get(@Payload() payload: { id: string }) {
    return this.deptService.get(payload.id);
  }

  @MessagePattern('departments.update')
  update(@Payload() payload: { id: string; [key: string]: any }) {
    const { id, ...rest } = payload;
    return this.deptService.update(id, rest);
  }

  @MessagePattern('departments.delete')
  remove(@Payload() payload: { id: string }) {
    return this.deptService.remove(payload.id);
  }
}
