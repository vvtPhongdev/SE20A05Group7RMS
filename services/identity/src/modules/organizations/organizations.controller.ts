import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrganizationsService } from './organizations.service';

@Controller()
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @MessagePattern('organizations.create')
  create(@Payload() payload: any) {
    return this.orgsService.create(payload);
  }

  @MessagePattern('organizations.list')
  list(@Payload() payload: any) {
    return this.orgsService.list(payload);
  }

  @MessagePattern('organizations.get')
  get(@Payload() payload: { id: string }) {
    return this.orgsService.get(payload.id);
  }
}
