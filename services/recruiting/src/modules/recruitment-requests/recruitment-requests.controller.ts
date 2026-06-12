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
}
