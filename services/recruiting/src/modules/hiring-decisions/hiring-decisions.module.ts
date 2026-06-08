import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DatabaseModule } from '../../common/database/database.module';
import { HiringDecisionsController } from './hiring-decisions.controller';
import { HiringDecisionService } from './hiring-decision.service';

@Module({
  imports: [
    DatabaseModule,
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
  controllers: [HiringDecisionsController],
  providers: [HiringDecisionService],
  exports: [HiringDecisionService],
})
export class HiringDecisionsModule {}
