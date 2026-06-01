import { Module } from '@nestjs/common';
import { DatabaseModule } from './common/database/database.module';
import { RolesModule } from './modules/roles/roles.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { InvitesModule } from './modules/invites/invites.module';
import { EvaluationsModule } from './modules/evaluations/evaluations.module';
import { TalentSearchModule } from './modules/talent-search/talent-search.module';
<<<<<<< Updated upstream

@Module({
  imports: [DatabaseModule, RolesModule, ApplicationsModule, InvitesModule, EvaluationsModule, TalentSearchModule],
=======
import { RecruitmentRequestsModule } from './modules/recruitment-requests/recruitment-requests.module';
import { OverallPlanModule } from './modules/overall-plan/overall-plan.module';
import { TaskPlanModule } from './modules/task-plan/task-plan.module';

@Module({
  imports: [
    DatabaseModule,
    RolesModule,
    ApplicationsModule,
    InvitesModule,
    EvaluationsModule,
    TalentSearchModule,
    RecruitmentRequestsModule,
    OverallPlanModule,
    TaskPlanModule,
  ],
>>>>>>> Stashed changes
})
export class RecruitingModule {}
