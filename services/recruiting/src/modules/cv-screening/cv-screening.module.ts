import { Module } from '@nestjs/common';
import { CvScreeningService } from './cv-screening.service';

/**
 * Module for CV screening status management (FR-12).
 */
@Module({
  providers: [CvScreeningService],
  exports: [CvScreeningService],
})
export class CvScreeningModule {}
