import { Controller, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TalentSearchService } from './talent-search.service';
import { PlanLockedGuard } from '../../common/guards/plan-locked.guard';
import { PlanLocked } from '../../common/decorators/plan-locked.decorator';
import { TaskType } from '@wr/contracts';

@Controller()
export class TalentSearchController {
  constructor(private readonly service: TalentSearchService) {}

  @MessagePattern('talent.search')
  @UseGuards(PlanLockedGuard)
  @PlanLocked(TaskType.CV_SCREENING)
  search(
    @Payload()
    payload: {
      query: string;
      filters?: Record<string, unknown>;
      pagination?: { page: number; pageSize: number };
    },
  ) {
    return this.service.search(payload);
  }

  @MessagePattern('talent.expand')
  expandQuery(@Payload() payload: { query: string }) {
    return this.service.expandQuery(payload.query);
  }
}
