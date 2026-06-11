import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from './common/database/database.module';
import { CvFeatureModule } from './modules/cv/cv.module';
import { HealthModule } from './modules/health/health.module';

function getRedisOptions() {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const parsed = new URL(redisUrl);
      return {
        host: parsed.hostname,
        port: parseInt(parsed.port || '6379', 10),
        username: parsed.username || undefined,
        password: parsed.password || undefined,
        tls: parsed.protocol === 'rediss:' ? {} : undefined,        
      };
    } catch (e) {
      console.warn('Failed to parse REDIS_URL, falling back to REDIS_HOST/PORT', e);
    }
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
      connection: getRedisOptions(),
    }),
    CvFeatureModule,
    HealthModule,
  ],
})
export class CvModule {}
