import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { RecruitmentRequestStatus, UserRole } from '@wr/contracts';

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

  approve(id: string, approverId: string, approverRole: UserRole) {
    const req = this.store.get(id);
    if (!req) throw new NotFoundException('Request not found');
    if (req.status !== RecruitmentRequestStatus.PENDING_REVIEW) {
      throw new BadRequestException('Request must be in PENDING_REVIEW to approve');
    }
    if (approverRole === UserRole.DEPARTMENT_HEAD && approverId === req.createdBy) {
      throw new ForbiddenException('Department Head cannot self-approve their own request');
    }
    if (!req.approvals) req.approvals = [];
    req.approvals.push({ actorId: approverId, action: 'APPROVE', timestamp: new Date().toISOString() });
    req.status = RecruitmentRequestStatus.APPROVED;
    return req;
  }
}
