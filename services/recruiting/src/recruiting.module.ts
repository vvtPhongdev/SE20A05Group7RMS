import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from './common/database/database.module';
import { RolesModule } from './modules/roles/roles.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { InvitesModule } from './modules/invites/invites.module';
import { EvaluationsModule } from './modules/evaluations/evaluations.module';
import { TalentSearchModule } from './modules/talent-search/talent-search.module';
import { JobPostingsModule } from './modules/job-postings/job-postings.module';
import { ReportsModule } from './modules/reports/reports.module';
import { OffersModule } from './modules/offers/offers.module';
import { AuditLogQueryModule } from './modules/audit-log/audit-log-query.module';
import { OverallPlanModule } from './modules/overall-plan/overall-plan.module';
import { TaskPlanModule } from './modules/task-plan/task-plan.module';
import { CvScreeningModule } from './modules/cv-screening/cv-screening.module';
import { RecruitmentRequestsController } from './modules/recruitment-requests/recruitment-requests.controller';
import { RecruitmentRequestsService } from './modules/recruitment-requests/recruitment-requests.service';
import { config } from './config';

function getRedisConnection() {
  const redisUrl = config.REDIS_URL;
  if (redisUrl && redisUrl !== 'localhost') {
    const parsed = new URL(redisUrl);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '6379', 10),
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      tls: parsed.protocol === 'rediss:' ? {} : undefined,
    };
  }

  return {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
  };
}

@Module({
  imports: [
    DatabaseModule,
    BullModule.forRoot({
      connection: getRedisConnection(),
    }),
    RolesModule,
    ApplicationsModule,
    InvitesModule,
    EvaluationsModule,
    TalentSearchModule,
    JobPostingsModule,
    ReportsModule,
    OffersModule,
    AuditLogQueryModule,
    OverallPlanModule,
    TaskPlanModule,
    CvScreeningModule,
  ],
  controllers: [RecruitmentRequestsController],
  providers: [RecruitmentRequestsService],
})
export class RecruitingModule { }

