import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NotificationModule } from './notification.module';

const PORT = parseInt(process.env.NOTIFICATION_PORT || '3013', 10);

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(NotificationModule, {
    transport: Transport.TCP,
    options: { host: '127.0.0.1', port: PORT },
  });

  await app.listen();
  console.log(`🔔 Notification service listening on TCP :${PORT}`);
}

bootstrap().catch((err) => {
  console.error('❌ Notification service failed to start:', err);
  process.exit(1);
});
