import { Module } from '@nestjs/common';
import { DatabaseModule } from './common/database/database.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { ResultsModule } from './modules/results/results.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [DatabaseModule, SchedulesModule, InvitationsModule, ResultsModule, HealthModule],
})
export class InterviewModule {}
