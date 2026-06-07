import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SchedulesService } from './schedules.service';

@Controller()
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @MessagePattern('interview.schedule_interview')
  async scheduleInterview(
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
    return this.schedulesService.scheduleInterview(payload);
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
