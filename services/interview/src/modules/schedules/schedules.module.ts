import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { AuditLogModule } from '../../common/audit-log/audit-log.module';

@Module({
  imports: [
    AuditLogModule,
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
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
