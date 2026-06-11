import { Controller, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CvService } from './cv.service';
import { PlanLockedGuard } from '../../common/guards/plan-locked.guard';
import { PlanLocked } from '../../common/decorators/plan-locked.decorator';
import { TaskType } from '@wr/contracts';

@Controller()
export class CvController {
  constructor(private readonly service: CvService) {}

  @MessagePattern('cv.upload')
  @UseGuards(PlanLockedGuard)
  @PlanLocked(TaskType.CV_COLLECTION)
  async uploadCv(
    @Payload()
    payload: {
      candidateId: string;
      fileName: string;
      fileType: 'PDF' | 'DOCX';
      filePath: string;
      rawText?: string;
      requestId: string;
    },
  ) {
    return this.service.uploadCv(payload);
  }

  @MessagePattern('cv.get')
  async getCv(@Payload() payload: { id: string }) {
    return this.service.getCv(payload.id);
  }

  @MessagePattern('cv.get_by_candidate')
  async getCvByCandidate(@Payload() payload: { candidateId: string }) {
    return this.service.getCvByCandidate(payload.candidateId);
  }

  @MessagePattern('cv.list')
  async listCvs(@Payload() payload: { candidateId?: string }) {
    return this.service.listCvs(payload);
  }

  @MessagePattern('cv.delete')
  async deleteCv(@Payload() payload: { id: string }) {
    return this.service.deleteCv(payload.id);
  }
}
