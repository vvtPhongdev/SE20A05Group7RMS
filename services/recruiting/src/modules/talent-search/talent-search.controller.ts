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
      query?: string;
      filters?: Record<string, unknown>;
      pagination?: { page: number; pageSize: number };
      actorUserId?: string;
      actorRole?: string;
    },
  ) {
    return this.service.search(payload);
  }

  @MessagePattern('talent.feedback')
  recordFeedback(
    @Payload()
    payload: {
      searchRunId: string;
      candidateId: string;
      action: any;
      rank?: number;
      scores?: Record<string, number>;
      candidateSnapshot?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
      actorUserId?: string;
      actorRole?: string;
    },
  ) {
    return this.service.recordFeedback(payload);
  }

  @MessagePattern('talent.feedback.export_triplets')
  exportTriplets(@Payload() payload: { requestId?: string; limit?: number }) {
    return this.service.exportTrainingTriplets(payload);
  }

  @MessagePattern('talent.expand')
  expandQuery(@Payload() payload: { query: string }) {
    return this.service.expandQuery(payload.query);
  }
}
