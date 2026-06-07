import { Injectable, BadRequestException } from '@nestjs/common';
import { RecruitmentRequestStatus } from '@wr/contracts';

type UUID = string;

interface RecruitmentRequest {
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

let COUNTER = 1;
function genId() {
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
    };

    this.store.set(id, req);
    return req;
  }
}

