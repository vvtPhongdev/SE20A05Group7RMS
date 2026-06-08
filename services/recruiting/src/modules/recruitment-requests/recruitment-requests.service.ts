import { Injectable } from '@nestjs/common';
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
  logs: RequestLog[];
}

export interface RequestLog {
  timestamp: string;
  actorId: string;
  previousStatus: RecruitmentRequestStatus | null;
  newStatus: RecruitmentRequestStatus;
  notes?: string;
}

@Injectable()
export class RecruitmentRequestsService {
  private store = new Map<string, RecruitmentRequest>();

  private logTransition(req: RecruitmentRequest, actorId: string, previous: RecruitmentRequestStatus | null, next: RecruitmentRequestStatus, notes?: string) {
    const entry: RequestLog = {
      timestamp: new Date().toISOString(),
      actorId,
      previousStatus: previous,
      newStatus: next,
      notes,
    };
    if (!req.logs) req.logs = [];
    req.logs.push(entry);
  }
}
