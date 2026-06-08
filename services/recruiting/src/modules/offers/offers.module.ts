import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
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
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: parseInt(process.env.NOTIFICATION_PORT || '3013', 10),
        },
      },
    ]),
  ],
  controllers: [OffersController],
  providers: [OfferLetterService],
  exports: [OfferLetterService],
})
export class OffersModule {}
