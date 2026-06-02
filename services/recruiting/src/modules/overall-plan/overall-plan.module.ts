import { Module } from '@nestjs/common';
import { OverallPlanController } from './overall-plan.controller';
import { OverallPlanService } from './overall-plan.service';
import { NotificationsModule } from '../../common/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [OverallPlanController],
  providers: [OverallPlanService],
  exports: [OverallPlanService],
})
export class OverallPlanModule {}
