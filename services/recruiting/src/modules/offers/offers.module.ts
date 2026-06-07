import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { QUEUE_NAMES } from '@wr/queue';
import { DatabaseModule } from '../../common/database/database.module';
import { OffersController } from './offers.controller';
import { OfferLetterService } from './offer-letter.service';

@Module({
  imports: [
    DatabaseModule,
    BullModule.registerQueue({
      name: QUEUE_NAMES.EMAIL_SEND,
    }),
  ],
  controllers: [OffersController],
  providers: [OfferLetterService],
  exports: [OfferLetterService],
})
export class OffersModule {}
