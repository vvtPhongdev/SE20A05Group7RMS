import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OverallPlanController } from './overall-plan.controller';
import { OverallPlanService } from './overall-plan.service';
import { DatabaseModule } from '../../common/database/database.module';
import { AuditLogModule } from '../../common/audit-log/audit-log.module';
import { config } from '../../config';

@Module({
  imports: [
    DatabaseModule,
    AuditLogModule,
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
  controllers: [OverallPlanController],
  providers: [OverallPlanService],
})
export class OverallPlanModule {}
