import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
dotenvConfig({ path: resolve(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CvModule } from './cv.module';
import { config as appConfig } from './config';
import { PinoLogger, MicroserviceCorrelationInterceptor, patchBullMQ } from '@wr/logger';

// Patch BullMQ globally if queue package is loaded
patchBullMQ();

const PORT = appConfig.CV_PORT;

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(CvModule, {
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: PORT },
    logger: new PinoLogger('cv', appConfig.LOG_LEVEL),
  });

  app.useGlobalInterceptors(new MicroserviceCorrelationInterceptor());

  await app.listen();
  console.log(`📄 CV service listening on TCP :${PORT}`);
}

bootstrap().catch((err) => {
  console.error('❌ CV service failed to start:', err);
  process.exit(1);
});
