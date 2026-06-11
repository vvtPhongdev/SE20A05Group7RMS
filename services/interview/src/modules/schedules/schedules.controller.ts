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

  /** T-052: Cancel with reason; notifies all parties + logs to request timeline. */
  @MessagePattern('interview.cancel_schedule')
  async cancelSchedule(@Payload() payload: { id: string; cancelledBy: string; reason: string }) {
    return this.schedulesService.cancel(payload);
  }

  /** T-051: Reschedule with reason; notifies candidate + interviewers. */
  @MessagePattern('interview.reschedule_schedule')
  async rescheduleSchedule(
    @Payload()
    payload: {
      id: string;
      scheduledAt: string;
      duration: number;
      location: string;
      interviewers: string[];
      reason: string;
    },
  ) {
    return this.schedulesService.reschedule(payload);
  }
}
