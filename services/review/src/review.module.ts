import { Module } from '@nestjs/common';
import { DatabaseModule } from './common/database/database.module';
import { ReviewerFeedbackModule } from './modules/reviewer-feedback/reviewer-feedback.module';
import { PacketsModule } from './modules/packets/packets.module';

@Module({
  imports: [DatabaseModule, ReviewerFeedbackModule, PacketsModule],
})
export class ReviewModule {}
