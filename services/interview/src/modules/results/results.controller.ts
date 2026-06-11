import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InterviewResultService } from './interview-result.service';

@Controller()
export class ResultsController {
  constructor(private readonly resultsService: InterviewResultService) {}

  @MessagePattern('interview.list_completed')
  async listCompleted() {
    return this.resultsService.listCompleted();
  }

  @MessagePattern('interview.get_details')
  async getDetails(@Payload() payload: { id: string }) {
    return this.resultsService.getDetails(payload.id);
  }

  /** FR-14: Record PASS/FAIL result with panel notes and evaluator. */
  @MessagePattern('interview.record_result')
  async recordResult(
    @Payload()
    payload: {
      interviewId: string;
      feedbacks: Array<{
        evaluatorId: string;
        decision: 'PASS' | 'FAIL';
        technical: number;
        communication: number;
        culture: number;
        notes: string;
      }>;
      finalRecommendation: string;
      summaryNotes?: string;
      evaluatorId?: string;
    },
  ) {
    return this.resultsService.recordResult(payload);
  }
}
