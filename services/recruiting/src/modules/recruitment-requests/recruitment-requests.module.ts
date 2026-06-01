import { Module } from '@nestjs/common';
import { RecruitmentRequestsController } from './recruitment-requests.controller';
import { RecruitmentRequestsService } from './recruitment-requests.service';
import { DatabaseModule } from '../../common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [RecruitmentRequestsController],
  providers: [RecruitmentRequestsService],
})
export class RecruitmentRequestsModule {}
