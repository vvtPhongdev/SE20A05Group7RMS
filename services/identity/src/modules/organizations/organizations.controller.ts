import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationInput, UpdateOrganizationInput } from '@wr/contracts';

@Controller()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @MessagePattern('identity.create_organization')
  async create(@Payload() data: CreateOrganizationInput) {
    return this.organizationsService.create(data);
  }

  @MessagePattern('identity.list_organizations')
  async list() {
    return this.organizationsService.list();
  }

  @MessagePattern('identity.get_organization')
  async get(@Payload() data: { id: string }) {
    return this.organizationsService.get(data);
  }

  @MessagePattern('identity.update_organization')
  async update(@Payload() data: { id: string } & UpdateOrganizationInput) {
    return this.organizationsService.update(data);
  }
}
