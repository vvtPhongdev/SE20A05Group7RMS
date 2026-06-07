import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
  updatedAt?: string;
}

@Injectable()
export class RecruitmentRequestsService {
  private store = new Map<string, RecruitmentRequest>();

  update(id: string, actorId: string, updates: Partial<Pick<RecruitmentRequest, 'positionTitle' | 'jdText' | 'headcount' | 'urgency' | 'justification'>>) {
    const req = this.store.get(id);
    if (!req) throw new NotFoundException('Request not found');
    if (req.status !== RecruitmentRequestStatus.DRAFT) {
      throw new ForbiddenException('Only DRAFT requests can be edited');
    }
    Object.assign(req, updates);
    req.updatedAt = new Date().toISOString();
    return req;
  }
}
