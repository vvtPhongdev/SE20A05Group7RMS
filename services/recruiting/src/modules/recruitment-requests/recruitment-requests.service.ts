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
  feedback?: string;
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

  requestRevision(id: string, approverId: string, feedback: string) {
    if (!feedback) throw new BadRequestException('Feedback is required for revision request');
    const req = this.store.get(id);
    if (!req) throw new NotFoundException('Request not found');
    if (!req.approvals) req.approvals = [];
    req.approvals.push({ actorId: approverId, action: 'REQUEST_REVISION', reason: feedback, timestamp: new Date().toISOString() });
    req.status = RecruitmentRequestStatus.REVISION_NEEDED;
    req.feedback = feedback;
    return req;
  }
}
