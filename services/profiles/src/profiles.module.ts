import { Module } from '@nestjs/common';
import { DatabaseModule } from './common/database/database.module';
import { CandidateProfilesModule } from './modules/candidate-profiles/candidate-profiles.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { EvidenceModule } from './modules/evidence/evidence.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [DatabaseModule, CandidateProfilesModule, DocumentsModule, EvidenceModule, HealthModule],
})
export class ProfilesModule {}
