import { Module } from '@nestjs/common';
import { PlanGuardService } from './plan-guard.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [PlanGuardService],
  exports: [PlanGuardService],
})
export class PlanGuardModule {}
