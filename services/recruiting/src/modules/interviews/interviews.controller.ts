import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InterviewsService } from './interviews.service';

@Controller()
export class InterviewsController {
  constructor(private readonly service: InterviewsService) {}

  @MessagePattern('interviews.schedule')
  schedule(@Payload() payload: {
    requestId: string;
    candidateId: string;
    scheduledAt: string;
    duration: number;
    location: string;
    interviewers: string[];
  }) {
    return this.service.schedule(payload);
  }

  @MessagePattern('interviews.reschedule')
  reschedule(@Payload() payload: {
    id: string;
    scheduledAt?: string;
    duration?: number;
    location?: string;
    interviewers?: string[];
  }) {
    return this.service.reschedule(payload);
  }

  @MessagePattern('interviews.cancel')
  cancel(@Payload() payload: { id: string }) {
    return this.service.cancel(payload);
  }

  @MessagePattern('interviews.recordResult')
  recordResult(@Payload() payload: {
    interviewId: string;
    result: string;
    notes?: string | null;
  }) {
    return this.service.recordResult(payload);
  }

  @MessagePattern('interviews.get')
  get(@Payload() payload: { id: string }) {
    return this.service.get(payload.id);
  }

  @MessagePattern('interviews.list')
  list(@Payload() payload: {
    requestId?: string;
    candidateId?: string;
    status?: string;
    page?: string | number;
    pageSize?: string | number;
  }) {
    return this.service.list(payload);
  }
}
