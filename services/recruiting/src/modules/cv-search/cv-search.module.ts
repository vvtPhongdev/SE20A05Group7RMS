import { Module } from '@nestjs/common';
import { CvSearchService } from './cv-search.service';

@Module({
  providers: [CvSearchService],
  exports: [CvSearchService],
})
export class CvSearchModule {}
