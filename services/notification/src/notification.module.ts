import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from './common/database/database.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
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
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
  };
}

@Module({
  imports: [
    DatabaseModule,
    BullModule.forRoot({
      connection: getRedisConnection(),
    }),
    NotificationsModule,
    HealthModule,
  ],
})
export class NotificationModule {}
