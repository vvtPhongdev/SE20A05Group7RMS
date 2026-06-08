import { Module } from '@nestjs/common';
import { TaskPlanController } from './task-plan.controller';
import { TaskPlanService } from './task-plan.service';
import { DatabaseModule } from '../../common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TaskPlanController],
  providers: [TaskPlanService],
})
export class TaskPlanModule {}
