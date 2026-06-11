import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ProfilesModule } from './profiles.module';
import { config as appConfig } from './config';
import { PinoLogger, MicroserviceCorrelationInterceptor, patchBullMQ } from '@wr/logger';

// Patch BullMQ globally if queue package is loaded
patchBullMQ();

const PORT = appConfig.PROFILES_PORT;

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(ProfilesModule, {
    transport: Transport.TCP,
    options: { host: '127.0.0.1', port: PORT },
    logger: new PinoLogger('profiles', appConfig.LOG_LEVEL),
  });

  app.useGlobalInterceptors(new MicroserviceCorrelationInterceptor());

  await app.listen();
  console.log(`👤 Profiles service listening on TCP :${PORT}`);
}

bootstrap().catch((err) => {
  console.error('❌ Profiles service failed to start:', err);
  process.exit(1);
});
