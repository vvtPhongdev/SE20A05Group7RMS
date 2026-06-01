import { Module } from '@nestjs/common';
import { DatabaseModule } from './common/database/database.module';
import { RolesModule } from './modules/roles/roles.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { InvitesModule } from './modules/invites/invites.module';
import { EvaluationsModule } from './modules/evaluations/evaluations.module';
import { TalentSearchModule } from './modules/talent-search/talent-search.module';
import { RecruitmentRequestsModule } from './modules/recruitment-requests/recruitment-requests.module';

@Module({
  imports: [DatabaseModule, RolesModule, ApplicationsModule, InvitesModule, EvaluationsModule, TalentSearchModule, RecruitmentRequestsModule],
})
export class RecruitingModule {}
