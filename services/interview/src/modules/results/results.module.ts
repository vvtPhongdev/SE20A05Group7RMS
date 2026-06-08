import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DatabaseModule } from '../../common/database/database.module';
import { ResultsController } from './results.controller';
import { InterviewResultService } from './interview-result.service';

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
  controllers: [ResultsController],
  providers: [InterviewResultService],
  exports: [InterviewResultService],
})
export class ResultsModule {}
