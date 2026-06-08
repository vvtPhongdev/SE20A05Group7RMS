import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { HiringDecisionsController } from './hiring-decisions.controller';
import { HiringDecisionService } from './hiring-decision.service';

@Module({
  imports: [DatabaseModule],
  controllers: [HiringDecisionsController],
  providers: [HiringDecisionService],
  exports: [HiringDecisionService],
})
export class HiringDecisionsModule {}
