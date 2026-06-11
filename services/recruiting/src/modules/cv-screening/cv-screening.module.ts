import { Module } from '@nestjs/common';
import { CvScreeningService } from './cv-screening.service';
import { AuditLogModule } from '../../common/audit-log/audit-log.module';

/**
 * Module for CV screening status management (FR-12).
 */
@Module({
  imports: [AuditLogModule],
  providers: [CvScreeningService],
  exports: [CvScreeningService],
})
export class CvScreeningModule {}
