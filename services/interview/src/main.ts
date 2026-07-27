import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
dotenvConfig({ path: resolve(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { InterviewModule } from './interview.module';
import { config as appConfig } from './config';
import { PinoLogger, MicroserviceCorrelationInterceptor, patchBullMQ } from '@wr/logger';

// Patch BullMQ globally if queue package is loaded
patchBullMQ();

const PORT = appConfig.INTERVIEW_PORT;

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(InterviewModule, {
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: PORT },
    logger: new PinoLogger('interview', appConfig.LOG_LEVEL),
  });

  app.useGlobalInterceptors(new MicroserviceCorrelationInterceptor());

  await app.listen();
  console.log(`🗓️  Interview service listening on TCP :${PORT}`);
}

bootstrap().catch((err) => {
  console.error('❌ Interview service failed to start:', err);
  process.exit(1);
});
