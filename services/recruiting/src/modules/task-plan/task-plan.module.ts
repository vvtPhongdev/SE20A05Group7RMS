import { Module } from '@nestjs/common';
import { TaskPlanController } from './task-plan.controller';
import { TaskPlanService } from './task-plan.service';
import { DatabaseModule } from '../../common/database/database.module';
import { AuditLogModule } from '../../common/audit-log/audit-log.module';

@Module({
  imports: [DatabaseModule, AuditLogModule],
  controllers: [TaskPlanController],
  providers: [TaskPlanService],
})
export class TaskPlanModule {}
