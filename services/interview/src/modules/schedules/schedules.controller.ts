import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SchedulesService } from './schedules.service';

@Controller()
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  /** FR-12 + FR-07: Create interview schedule (plan-locked, conflict-checked). */
  @MessagePattern('interview.create_schedule')
  async createSchedule(
    @Payload()
    payload: {
      requestId: string;
      candidateId: string;
      scheduledAt: string;
      duration: number;
      location: string;
      interviewers: string[];
    },
  ) {
    return this.schedulesService.create(payload);
  }

  @MessagePattern('interview.get_schedule')
  async getSchedule(@Payload() payload: { id: string }) {
    return this.schedulesService.getSchedule(payload.id);
  }

  @MessagePattern('interview.list_schedules')
  async listSchedules(@Payload() payload: { requestId: string }) {
    return this.schedulesService.listSchedules(payload.requestId);
  }

  @MessagePattern('interview.cancel_schedule')
  async cancelSchedule(@Payload() payload: { id: string; cancelledBy: string }) {
    return this.schedulesService.cancelSchedule(payload);
  }

  /** T-053 (FR-14/FR-15): Record PASS/FAIL with evaluator; advances pipeline + triggers next-step workflow. */
  @MessagePattern('interview.record_result')
  async recordResult(
    @Payload()
    payload: { interviewId: string; evaluatorId: string; result: string; notes: string },
  ) {
    return this.schedulesService.recordResult(payload);
  }
}
