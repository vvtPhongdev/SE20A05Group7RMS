import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '@wr/queue';
import { DatabaseModule } from '../../common/database/database.module';
import { HiringDecisionsController } from './hiring-decisions.controller';
import { HiringDecisionService } from './hiring-decision.service';
import { config } from '../../config';

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
          port: config.NOTIFICATION_PORT,
        },
      },
    ]),
  ],
  controllers: [HiringDecisionsController],
  providers: [HiringDecisionService],
  exports: [HiringDecisionService],
})
export class HiringDecisionsModule {}
