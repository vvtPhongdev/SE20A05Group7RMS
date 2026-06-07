import { Controller, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { JobPostingsService } from './job-postings.service';
import { PlanLockedGuard } from '../../common/guards/plan-locked.guard';
import { PlanLocked } from '../../common/decorators/plan-locked.decorator';
import { TaskType, CreateJobPostingInput, UpdateJobPostingInput } from '@wr/contracts';

@Controller()
export class JobPostingsController {
  constructor(private readonly service: JobPostingsService) {}

  @MessagePattern('recruiting.job_posting.create')
  @UseGuards(PlanLockedGuard)
  @PlanLocked(TaskType.JOB_POSTING)
  async create(@Payload() payload: CreateJobPostingInput) {
    return this.service.create(payload);
  }

  @MessagePattern('recruiting.job_posting.list')
  async list(
    @Payload()
    payload: {
      status?: string;
      visibility?: string;
      search?: string;
      userRole?: string;
      userDeptId?: string;
    },
  ) {
    return this.service.list(payload);
  }

  @MessagePattern('recruiting.job_posting.get')
  async get(@Payload() payload: { id: string; userRole?: string; userDeptId?: string }) {
    return this.service.get(payload);
  }

  @MessagePattern('recruiting.job_posting.update')
  async update(@Payload() payload: { id: string } & UpdateJobPostingInput) {
    const { id, ...data } = payload;
    return this.service.update(id, data);
  }

  @MessagePattern('recruiting.job_posting.publish')
  async publish(@Payload() payload: { id: string }) {
    return this.service.publish(payload.id);
  }

  @MessagePattern('recruiting.job_posting.close')
  async close(@Payload() payload: { id: string }) {
    return this.service.close(payload.id);
  }
}
