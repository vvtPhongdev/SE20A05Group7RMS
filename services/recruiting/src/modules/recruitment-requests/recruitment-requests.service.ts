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
  approvals: ApprovalRecord[];
}

export interface ApprovalRecord {
  actorId: string;
  action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION';
  reason?: string;
  timestamp: string;
}

@Injectable()
export class RecruitmentRequestsService {
  private store = new Map<string, RecruitmentRequest>();

  reject(id: string, approverId: string, reason: string) {
    if (!reason) throw new BadRequestException('Rejection reason is required');
    const req = this.store.get(id);
    if (!req) throw new NotFoundException('Request not found');
    if (!req.approvals) req.approvals = [];
    req.approvals.push({ actorId: approverId, action: 'REJECT', reason, timestamp: new Date().toISOString() });
    req.status = RecruitmentRequestStatus.REJECTED;
    return req;
  }
}
