import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RecruitmentRequestsService } from './recruitment-requests.service';

@Controller()
export class RecruitmentRequestsController {
  constructor(private readonly service: RecruitmentRequestsService) {}

  @MessagePattern('recruitment-requests.create')
  create(
    @Payload()
    payload: {
      requestedById: string;
      organizationId: string;
      departmentId: string;
      title: string;
      description?: string;
      justification?: string;
      headcount?: number;
      priority?: string;
      workMode?: string;
      location?: string;
      budgetRange?: { min: number; max: number; currency: string };
      targetStartDate?: string;
    },
  ) {
    return this.service.create(payload);
  }

  @MessagePattern('recruitment-requests.list')
  list(
    @Payload()
    payload: {
      organizationId?: string;
      departmentId?: string;
      requestedById?: string;
      status?: string;
      page?: number;
      pageSize?: number;
    },
  ) {
    return this.service.list(payload);
  }

  @MessagePattern('recruitment-requests.get')
  get(@Payload() payload: { id: string }) {
    return this.service.get(payload.id);
  }

  @MessagePattern('recruitment-requests.update')
  update(
    @Payload()
    payload: {
      id: string;
      title?: string;
      description?: string;
      justification?: string;
      headcount?: number;
      priority?: string;
      workMode?: string;
      location?: string;
      budgetRange?: { min: number; max: number; currency: string };
      targetStartDate?: string;
    },
  ) {
    const { id, ...data } = payload;
    return this.service.update(id, data);
  }

  @MessagePattern('recruitment-requests.submit')
  submit(@Payload() payload: { id: string }) {
    return this.service.submit(payload.id);
  }

  @MessagePattern('recruitment-requests.forward-to-boss')
  forwardToBoss(@Payload() payload: { id: string }) {
    return this.service.forwardToBoss(payload.id);
  }

  @MessagePattern('recruitment-requests.approve')
  approve(@Payload() payload: { id: string; actorId: string; comments?: string }) {
    return this.service.approve(payload.id, payload.actorId, payload.comments);
  }

  @MessagePattern('recruitment-requests.reject')
  reject(
    @Payload()
    payload: {
      id: string;
      actorId: string;
      decision: 'REJECTED' | 'REVISION_REQUESTED';
      comments?: string;
    },
  ) {
    return this.service.reject(payload.id, payload.actorId, payload.decision, payload.comments);
  }

  @MessagePattern('recruitment-requests.logs')
  getLogs(@Payload() payload: { id: string }) {
    return this.service.getLogs(payload.id);
  }

  @MessagePattern('recruitment-requests.tracking')
  getTracking(@Payload() payload: { id: string }) {
    return this.service.getTracking(payload.id);
  }
}
