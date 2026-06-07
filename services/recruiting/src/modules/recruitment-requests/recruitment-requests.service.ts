import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
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
  updatedAt?: string;
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

  submit(id: string, actorId: string) {
    const req = this.store.get(id);
    if (!req) throw new NotFoundException('Request not found');
    const required = ['positionTitle', 'jdText', 'headcount', 'urgency', 'justification'];
    for (const k of required) {
      // @ts-ignore
      if (!req[k]) throw new BadRequestException('Missing required fields before submit');
    }
    if (req.status !== RecruitmentRequestStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT requests can be submitted');
    }
    req.status = RecruitmentRequestStatus.PENDING_REVIEW;
    return req;
  }
}

