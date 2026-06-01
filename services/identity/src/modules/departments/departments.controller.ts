import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentInput, UpdateDepartmentInput } from '@wr/contracts';

@Controller()
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @MessagePattern('identity.create_department')
  async create(@Payload() data: CreateDepartmentInput) {
    return this.departmentsService.create(data);
  }

  @MessagePattern('identity.list_departments')
  async list(@Payload() data?: { organizationId?: string }) {
    return this.departmentsService.list(data);
  }

  @MessagePattern('identity.get_department')
  async get(@Payload() data: { id: string }) {
    return this.departmentsService.get(data);
  }

  @MessagePattern('identity.update_department')
  async update(@Payload() data: { id: string } & UpdateDepartmentInput) {
    return this.departmentsService.update(data);
  }

  @MessagePattern('identity.delete_department')
  async delete(@Payload() data: { id: string }) {
    return this.departmentsService.delete(data);
  }
}
