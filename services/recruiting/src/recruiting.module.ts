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
import { RecruitmentRequestsController } from './modules/recruitment-requests/recruitment-requests.controller';
import { RecruitmentRequestsService } from './modules/recruitment-requests/recruitment-requests.service';

function getRedisConnection() {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
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
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
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
  ],
  controllers: [RecruitmentRequestsController],
  providers: [RecruitmentRequestsService],
})
export class RecruitingModule { }

