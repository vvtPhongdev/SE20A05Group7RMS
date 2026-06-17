import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from './common/database/database.module';
import { CandidateProfilesModule } from './modules/candidate-profiles/candidate-profiles.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { EvidenceModule } from './modules/evidence/evidence.module';
import { HealthModule } from './modules/health/health.module';
import { config } from './config';

function getRedisConnection() {
  const redisUrl = config.REDIS_URL;
  if (redisUrl && redisUrl !== 'localhost') {
    const parsed = new URL(redisUrl);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '6379', 10),
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      tls: parsed.protocol === 'rediss:' ? {} : undefined,
    };
  }

  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  };
}

@Module({
  imports: [
    DatabaseModule,
    BullModule.forRoot({
      connection: getRedisConnection(),
    }),
    CandidateProfilesModule,
    DocumentsModule,
    EvidenceModule,
    HealthModule,
  ],
})
export class ProfilesModule {}
