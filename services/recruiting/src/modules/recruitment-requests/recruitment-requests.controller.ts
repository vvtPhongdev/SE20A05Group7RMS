import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RecruitmentRequestsService } from './recruitment-requests.service';

@Controller()
export class RecruitmentRequestsController {
  constructor(private readonly service: RecruitmentRequestsService) {}

  @MessagePattern('recruitment-requests.admin.list')
  listForAdmin(@Payload() payload: any) {
    return this.service.listForAdmin(payload);
  }

  @MessagePattern('recruitment-requests.depthead.create')
  createForDepartmentHead(
    @Payload()
    payload: {
      positionTitle: string;
      headcount: number;
      jobDescription: string;
      justification: string;
      urgency: string;
      skillRequirements?: Record<string, unknown>;
      createdById: string;
      submit?: boolean;
    },
  ) {
    return this.service.createForDepartmentHead(payload);
  }

  @MessagePattern('recruitment-requests.get')
  getById(
    @Payload()
    payload: {
      id: string;
      userId: string;
      role: any;
    },
  ) {
    return this.service.getByIdForActor(payload);
  }

  @MessagePattern('recruitment-requests.depthead.update')
  updateForDepartmentHead(
    @Payload()
    payload: {
      id: string;
      userId: string;
      positionTitle?: string;
      headcount?: number;
      jobDescription?: string;
      justification?: string;
      urgency?: string;
      skillRequirements?: Record<string, unknown>;
    },
  ) {
    return this.service.updateForDepartmentHead(payload);
  }

  @MessagePattern('recruitment-requests.depthead.submit')
  submitDraft(@Payload() payload: { id: string; userId: string }) {
    return this.service.submitDraft(payload);
  }

  @MessagePattern('recruitment-requests.admin.assign')
  assignToHr(
    @Payload()
    payload: {
      id: string;
      hrManagerId: string;
      assignedById: string;
    },
  ) {
    return this.service.assignToHr(payload);
  }

  @MessagePattern('recruitment-requests.admin.decide')
  decide(
    @Payload()
    payload: {
      id: string;
      decision: 'APPROVED' | 'REJECTED';
      comments?: string;
      adminId: string;
    },
  ) {
    return this.service.decide(payload);
  }

  @MessagePattern('recruitment-requests.hr.forward_to_admin')
  forwardToAdmin(
    @Payload()
    payload: {
      id: string;
      hrManagerId: string;
    },
  ) {
    return this.service.forwardToAdmin(payload);
  }

  @MessagePattern('recruitment-requests.hr.return_for_revision')
  returnForRevision(
    @Payload()
    payload: {
      id: string;
      hrManagerId: string;
      feedback: string;
    },
  ) {
    return this.service.returnForRevision(payload);
  }
}
