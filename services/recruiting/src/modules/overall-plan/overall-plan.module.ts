import { Module } from '@nestjs/common';
import { OverallPlanController } from './overall-plan.controller';
import { OverallPlanService } from './overall-plan.service';
import { DatabaseModule } from '../../common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [OverallPlanController],
  providers: [OverallPlanService],
})
export class OverallPlanModule {}
