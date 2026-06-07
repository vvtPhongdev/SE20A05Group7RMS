import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RecruitmentRequestStatus } from '@wr/contracts';

export type UUID = string;

export interface RecruitmentRequest {
  id: UUID;
  positionTitle: string;
  jdText: string;
  headcount: number;
  urgency: string;
  justification: string;
  departmentId: string;
  createdBy: string;
  status: RecruitmentRequestStatus;
  createdAt: string;
}

@Injectable()
export class RecruitmentRequestsService {
  private store = new Map<string, RecruitmentRequest>();

  submit(id: string, actorId: string) {
    const req = this.store.get(id);
    if (!req) throw new NotFoundException('Request not found');
    const required = ['positionTitle', 'jdText', 'headcount', 'urgency', 'justification'];
    for (const k of required) {
      // @ts-ignore
      if (!req[k]) throw new BadRequestException('Missing required fields before submit');
    }
    if (req.status !== RecruitmentRequestStatus.DRAFT) throw new BadRequestException('Only DRAFT requests can be submitted');
    req.status = RecruitmentRequestStatus.PENDING_REVIEW;
    return req;
  }
}
