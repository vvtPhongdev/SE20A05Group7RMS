import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CvController } from './cv.controller';
import { CvService } from './cv.service';
import { AuditLogModule } from '../../common/audit-log/audit-log.module';
import { QUEUE_NAMES } from '@wr/queue';

@Module({
  imports: [
    AuditLogModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.CV_PARSE,
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.EMBEDDING_GENERATE,
    }),
  ],
  controllers: [CvController],
  providers: [CvService],
  exports: [CvService],
})
export class CvFeatureModule {}
