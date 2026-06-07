import { Injectable } from '@nestjs/common';
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
}

@Injectable()
export class RecruitmentRequestsService {
  private store = new Map<string, RecruitmentRequest>();

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
}
