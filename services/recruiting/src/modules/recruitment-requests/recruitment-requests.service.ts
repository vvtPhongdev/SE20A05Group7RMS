import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
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
  updatedAt?: string;
  logs: RequestLog[];
  approvals: ApprovalRecord[];
  feedback?: string;
}

export interface RequestLog {
  timestamp: string;
  actorId: string;
  previousStatus: RecruitmentRequestStatus | null;
  newStatus: RecruitmentRequestStatus;
  notes?: string;
}

export interface ApprovalRecord {
  actorId: string;
  action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION';
  reason?: string;
  timestamp: string;
}

let COUNTER = 1;
export function genId() {
  return `rr_${Date.now()}_${COUNTER++}`;
}

@Injectable()
export class RecruitmentRequestsService {
  private store = new Map<string, RecruitmentRequest>();

  create(payload: { positionTitle: string; jdText: string; headcount: number; urgency: string; justification: string; departmentId: string; createdBy: string }) {
    const { positionTitle, jdText, headcount, urgency, justification, departmentId, createdBy } = payload;
    if (!positionTitle || !jdText || !headcount || !urgency || !justification) {
      throw new BadRequestException('Missing required fields for recruitment request');
    }

    const id = genId();
    const now = new Date().toISOString();
    const req: RecruitmentRequest = {
      id,
      positionTitle,
      jdText,
      headcount,
      urgency,
      justification,
      departmentId,
      createdBy,
      status: RecruitmentRequestStatus.DRAFT,
      createdAt: now,
      logs: [],
      approvals: [],
    };

    this.store.set(id, req);
    this.logTransition(req, createdBy, null, RecruitmentRequestStatus.DRAFT, 'Created request (DRAFT)');
    return req;
  }

  update(id: string, actorId: string, updates: Partial<Pick<RecruitmentRequest, 'positionTitle' | 'jdText' | 'headcount' | 'urgency' | 'justification'>>) {
    const req = this.store.get(id);
    if (!req) throw new NotFoundException('Request not found');
    if (req.status !== RecruitmentRequestStatus.DRAFT) {
      throw new ForbiddenException('Only DRAFT requests can be edited');
    }
    Object.assign(req, updates);
    req.updatedAt = new Date().toISOString();
    this.logTransition(req, actorId, req.status, req.status, 'Updated fields');
    return req;
  }

  submit(id: string, actorId: string) {
    const req = this.store.get(id);
    if (!req) throw new NotFoundException('Request not found');
    // validate required fields
    const required = ['positionTitle', 'jdText', 'headcount', 'urgency', 'justification'];
    for (const k of required) {
      // @ts-ignore
      if (!req[k]) throw new BadRequestException('Missing required fields before submit');
    }
    if (req.status !== RecruitmentRequestStatus.DRAFT) throw new BadRequestException('Only DRAFT requests can be submitted');
    const previous = req.status;
    req.status = RecruitmentRequestStatus.PENDING_REVIEW;
    this.logTransition(req, actorId, previous, req.status, 'Submitted for review');
    // simulate notification to approver (omitted)
    return req;
  }

  approve(id: string, approverId: string, approverRole: UserRole) {
    const req = this.store.get(id);
    if (!req) throw new NotFoundException('Request not found');
    if (req.status !== RecruitmentRequestStatus.PENDING_REVIEW) throw new BadRequestException('Request must be in PENDING_REVIEW to approve');
    // Block self-approval by Department Head
    if (approverRole === UserRole.DEPARTMENT_HEAD && approverId === req.createdBy) {
      throw new ForbiddenException('Department Head cannot self-approve their own request');
    }
    req.approvals.push({ actorId: approverId, action: 'APPROVE', timestamp: new Date().toISOString() });
    const previous = req.status;
    req.status = RecruitmentRequestStatus.APPROVED;
    this.logTransition(req, approverId, previous, req.status, 'Approved');
    // simulate notify HR Manager
    return req;
  }

  reject(id: string, approverId: string, reason: string) {
    if (!reason) throw new BadRequestException('Rejection reason is required');
    const req = this.store.get(id);
    if (!req) throw new NotFoundException('Request not found');
    const previous = req.status;
    req.approvals.push({ actorId: approverId, action: 'REJECT', reason, timestamp: new Date().toISOString() });
    req.status = RecruitmentRequestStatus.REJECTED;
    this.logTransition(req, approverId, previous, req.status, `Rejected: ${reason}`);
    // store reason visible to DH (kept in approvals)
    return req;
  }

  requestRevision(id: string, approverId: string, feedback: string) {
    if (!feedback) throw new BadRequestException('Feedback is required for revision request');
    const req = this.store.get(id);
    if (!req) throw new NotFoundException('Request not found');
    req.approvals.push({ actorId: approverId, action: 'REQUEST_REVISION', reason: feedback, timestamp: new Date().toISOString() });
    const previous = req.status;
    req.status = RecruitmentRequestStatus.REVISION_NEEDED;
    req.feedback = feedback;
    this.logTransition(req, approverId, previous, req.status, `Revision requested: ${feedback}`);
    return req;
  }

  list(_actorId: string, actorRole: UserRole, filters?: { status?: RecruitmentRequestStatus; departmentId?: string; from?: string; to?: string }) {
    const items = Array.from(this.store.values());
    let result = items;
    // role-based filtering
    if (actorRole === UserRole.DEPARTMENT_HEAD) {
      result = result.filter(r => r.departmentId === (filters?.departmentId ?? r.departmentId));
    } else if (actorRole === UserRole.HR_MANAGER) {
      // HR Manager sees all active campaigns (exclude CLOSED/CANCELLED)
      result = result.filter(r => r.status !== RecruitmentRequestStatus.CLOSED && r.status !== RecruitmentRequestStatus.CANCELLED);
    } else if (actorRole === UserRole.ADMIN) {
      // admin sees everything
    } else {
      // other roles see nothing
      result = [];
    }

    if (filters?.status) result = result.filter(r => r.status === filters.status);
    if (filters?.departmentId) result = result.filter(r => r.departmentId === filters.departmentId);

    const from = filters?.from;
    const to = filters?.to;
    if (from) result = result.filter(r => r.createdAt >= from);
    if (to) result = result.filter(r => r.createdAt <= to);

    return result;
  }

  private logTransition(req: RecruitmentRequest, actorId: string, previous: RecruitmentRequestStatus | null, next: RecruitmentRequestStatus, notes?: string) {
    const entry: RequestLog = {
      timestamp: new Date().toISOString(),
      actorId,
      previousStatus: previous,
      newStatus: next,
      notes,
    };
    req.logs.push(entry);
  }
}
