import { Module } from '@nestjs/common';
import { DatabaseModule } from './common/database/database.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
})
export class ReviewModule {}
