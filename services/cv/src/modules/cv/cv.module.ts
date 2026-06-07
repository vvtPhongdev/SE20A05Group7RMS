import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CvController } from './cv.controller';
import { CvService } from './cv.service';
import { QUEUE_NAMES } from '@wr/queue';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_NAMES.CV_PARSE,
    }),
  ],
  controllers: [CvController],
  providers: [CvService],
  exports: [CvService],
})
export class CvFeatureModule {}
