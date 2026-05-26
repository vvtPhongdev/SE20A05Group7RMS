import { Module } from '@nestjs/common';
import { TalentSearchController } from './talent-search.controller';
import { TalentSearchService } from './talent-search.service';
import { DatabaseModule } from '../../common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TalentSearchController],
  providers: [TalentSearchService],
})
export class TalentSearchModule {}
