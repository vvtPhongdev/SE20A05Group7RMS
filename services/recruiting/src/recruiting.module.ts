import { Module } from '@nestjs/common';
import { DatabaseModule } from './common/database/database.module';
import { RolesModule } from './modules/roles/roles.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { InvitesModule } from './modules/invites/invites.module';
import { EvaluationsModule } from './modules/evaluations/evaluations.module';
import { TalentSearchModule } from './modules/talent-search/talent-search.module';
import { HiringRequestsModule } from './modules/hiring-requests/hiring-requests.module';
import { OverallPlanModule } from './modules/overall-plan/overall-plan.module';
import { TaskPlanModule } from './modules/task-plan/task-plan.module';
import { PlanGuardModule } from './common/plan-guard/plan-guard.module';

@Module({
  imports: [
    DatabaseModule,
    PlanGuardModule,
    RolesModule,
    ApplicationsModule,
    InvitesModule,
    EvaluationsModule,
    TalentSearchModule,
    HiringRequestsModule,
    OverallPlanModule,
    TaskPlanModule,
  ],
})
export class RecruitingModule {}
