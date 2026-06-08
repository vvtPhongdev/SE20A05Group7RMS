import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InterviewResultService } from './interview-result.service';

@Controller()
export class ResultsController {
  constructor(private readonly resultsService: InterviewResultService) {}

  /** FR-14: Record PASS/FAIL result with panel notes and evaluator. */
  @MessagePattern('interview.record_result')
  async recordResult(
    @Payload()
    payload: {
      interviewId: string;
      result: string;
      notes: string;
      evaluatorId?: string;
    },
  ) {
    return this.resultsService.recordResult(payload);
  }
}
