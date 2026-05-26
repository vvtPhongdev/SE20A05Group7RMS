import { Module } from '@nestjs/common';
import { ReviewerFeedbackController } from './reviewer-feedback.controller';
import { ReviewerFeedbackService } from './reviewer-feedback.service';

@Module({
  controllers: [ReviewerFeedbackController],
  providers: [ReviewerFeedbackService],
  exports: [ReviewerFeedbackService],
})
export class ReviewerFeedbackModule {}
