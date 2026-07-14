import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InterviewResultService } from './interview-result.service';

@Controller()
export class ResultsController {
  constructor(private readonly resultsService: InterviewResultService) {}

  @MessagePattern('interview.list_completed')
  async listCompleted(@Payload() payload: { userId?: string; role?: string }) {
    return this.resultsService.listCompleted(payload);
  }

  @MessagePattern('interview.get_details')
  async getDetails(@Payload() payload: { id: string; userId?: string; role?: string }) {
    return this.resultsService.getDetails(payload.id, {
      userId: payload.userId,
      role: payload.role,
    });
  }

  @MessagePattern('interview.record_my_feedback')
  async recordMyFeedback(
    @Payload()
    payload: {
      interviewId: string;
      evaluatorId: string;
      actorRole: string;
      decision: 'PASS' | 'FAIL';
      technical: number;
      communication: number;
      culture: number;
      notes?: string;
    },
  ) {
    return this.resultsService.recordMyFeedback(payload);
  }

  @MessagePattern('interview.save_evaluation_draft')
  async saveEvaluationDraft(
    @Payload()
    payload: {
      interviewId: string;
      evaluatorId: string;
      actorRole: string;
      finalRecommendation: string;
      summaryNotes?: string;
    },
  ) {
    return this.resultsService.saveEvaluationDraft(payload);
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
      actorRole?: string;
    },
  ) {
    return this.resultsService.recordResult(payload);
  }
}
