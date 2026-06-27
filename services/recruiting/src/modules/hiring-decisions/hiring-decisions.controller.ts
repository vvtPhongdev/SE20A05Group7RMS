import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { HiringDecision } from '@wr/contracts';
import { HiringDecisionService } from './hiring-decision.service';

@Controller()
export class HiringDecisionsController {
  constructor(private readonly service: HiringDecisionService) {}

  @MessagePattern('recruiting.hiring_decision.decide')
  decide(
    @Payload()
    payload: {
      requestId: string;
      decision: HiringDecision;
      notes: string;
      adminId: string;
      candidateId?: string;
      compensation?: string;
      startDate?: string;
    },
  ) {
    return this.service.decide(
      payload.requestId,
      payload.decision,
      payload.notes,
      payload.adminId,
      payload.candidateId && payload.compensation && payload.startDate
        ? {
            candidateId: payload.candidateId,
            compensation: payload.compensation,
            startDate: payload.startDate,
          }
        : undefined,
    );
  }

  @MessagePattern('recruiting.hiring_decision.request_info')
  requestInfo(
    @Payload()
    payload: {
      requestId: string;
      candidateId: string;
      notes: string;
      adminId: string;
    },
  ) {
    return this.service.requestInfo(payload);
  }
}
