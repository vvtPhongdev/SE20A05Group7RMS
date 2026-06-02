import { Module } from '@nestjs/common';
import { HiringRequestsController } from './hiring-requests.controller';
import { HiringRequestsService } from './hiring-requests.service';
import { NotificationsModule } from '../../common/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [HiringRequestsController],
  providers: [HiringRequestsService],
  exports: [HiringRequestsService],
})
export class HiringRequestsModule {}
