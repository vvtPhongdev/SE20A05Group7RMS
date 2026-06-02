import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { PlanGuardModule } from '../../common/plan-guard/plan-guard.module';

@Module({
  imports: [PlanGuardModule],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
