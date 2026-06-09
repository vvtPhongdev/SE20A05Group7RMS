import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '@wr/queue';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EmailTemplateService } from './email-template.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_NAMES.EMAIL_SEND,
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailTemplateService],
  exports: [NotificationsService, EmailTemplateService],
})
export class NotificationsModule { }
