import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReviewerFeedbackService } from './reviewer-feedback.service';

@ApiTags('reviewer-feedback')
@Controller('reviewer-feedback')
export class ReviewerFeedbackController {
  constructor(private readonly service: ReviewerFeedbackService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
