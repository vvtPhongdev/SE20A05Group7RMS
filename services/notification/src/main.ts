import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NotificationModule } from './notification.module';
import { config as appConfig } from './config';
import { PinoLogger, MicroserviceCorrelationInterceptor, patchBullMQ } from '@wr/logger';

// Patch BullMQ globally if queue package is loaded
patchBullMQ();

const PORT = appConfig.NOTIFICATION_PORT;

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(NotificationModule, {
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: PORT },
    logger: new PinoLogger('notification', appConfig.LOG_LEVEL),
  });

  app.useGlobalInterceptors(new MicroserviceCorrelationInterceptor());

  await app.listen();
  console.log(`🔔 Notification service listening on TCP :${PORT}`);
}

bootstrap().catch((err) => {
  console.error('❌ Notification service failed to start:', err);
  process.exit(1);
});
