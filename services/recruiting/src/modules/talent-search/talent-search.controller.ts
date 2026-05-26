import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TalentSearchService } from './talent-search.service';

@Controller()
export class TalentSearchController {
  constructor(private readonly service: TalentSearchService) {}

  @MessagePattern('talent.search')
  search(@Payload() payload: { query: string; filters?: Record<string, unknown>; pagination?: { page: number; pageSize: number } }) {
    return this.service.search(payload);
  }

  @MessagePattern('talent.expand')
  expandQuery(@Payload() payload: { query: string }) {
    return this.service.expandQuery(payload.query);
  }
}
