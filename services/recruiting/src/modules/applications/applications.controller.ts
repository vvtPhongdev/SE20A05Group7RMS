import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApplicationsService } from './applications.service';

@Controller()
export class ApplicationsController {
  constructor(private readonly service: ApplicationsService) {}

  @MessagePattern('applications.create')
  async createApplication(
    @Payload() payload: { requestId: string; candidateId?: string; userId?: string },
  ) {
    return this.service.create(payload);
  }

  @MessagePattern('applications.list')
  async listApplications(
    @Payload() payload: { candidateId?: string; requestId?: string; status?: string },
  ) {
    return this.service.list(payload);
  }

  @MessagePattern('applications.get')
  async getApplication(@Payload() payload: { id: string }) {
    return this.service.get(payload.id);
  }

  @MessagePattern('applications.updateStatus')
  async updateApplicationStatus(@Payload() payload: { id: string; status: string }) {
    return this.service.updateStatus(payload.id, payload.status);
  }
}
