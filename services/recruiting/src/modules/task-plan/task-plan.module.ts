import { Module } from '@nestjs/common';
import { TaskPlanController } from './task-plan.controller';
import { TaskPlanService } from './task-plan.service';
import { NotificationsModule } from '../../common/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [TaskPlanController],
  providers: [TaskPlanService],
  exports: [TaskPlanService],
})
export class TaskPlanModule {}
