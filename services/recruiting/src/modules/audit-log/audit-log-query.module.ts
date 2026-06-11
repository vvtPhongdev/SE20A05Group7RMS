import { Module } from '@nestjs/common';
import { AuditLogModule } from '../../common/audit-log/audit-log.module';
import { AuditLogQueryController } from './audit-log.controller';

@Module({
  imports: [AuditLogModule],
  controllers: [AuditLogQueryController],
})
export class AuditLogQueryModule {}
