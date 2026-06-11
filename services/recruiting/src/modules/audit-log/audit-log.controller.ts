import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuditLogService } from '@wr/database';

@Controller()
export class AuditLogQueryController {
  constructor(private readonly auditLog: AuditLogService) {}

  @MessagePattern('audit-log.findByEntity')
  findByEntity(@Payload() payload: { entityType: string; entityId: string }) {
    return this.auditLog.findByEntity(payload.entityType, payload.entityId);
  }
}
