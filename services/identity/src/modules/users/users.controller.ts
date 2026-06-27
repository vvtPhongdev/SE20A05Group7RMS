import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern('users.list')
  async list(
    @Payload()
    data: {
      page?: number;
      limit?: number;
      role?: string;
      roles?: string[];
      departmentId?: string;
    },
  ) {
    return this.usersService.list(data);
  }

  @MessagePattern('users.get')
  async get(@Payload() data: { id: string }) {
    return this.usersService.get(data);
  }

  @MessagePattern('users.create')
  async create(@Payload() data: any) {
    return this.usersService.create(data);
  }

  @MessagePattern('users.update')
  async update(@Payload() data: any) {
    return this.usersService.update(data);
  }

  @MessagePattern('users.delete')
  async delete(@Payload() data: { id: string }) {
    return this.usersService.delete(data);
  }

  @MessagePattern('users.update_role')
  async updateRole(@Payload() data: { id: string; role: string }) {
    return this.usersService.updateRole(data);
  }

  @MessagePattern('users.update_status')
  async updateStatus(@Payload() data: { id: string; isActive: boolean }) {
    return this.usersService.updateStatus(data);
  }
}
