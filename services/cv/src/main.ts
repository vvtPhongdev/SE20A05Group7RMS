import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CvModule } from './cv.module';

const PORT = parseInt(process.env.CV_PORT || '3014', 10);

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(CvModule, {
    transport: Transport.TCP,
    options: { host: '127.0.0.1', port: PORT },
  });

  await app.listen();
  console.log(`📄 CV service listening on TCP :${PORT}`);
}

bootstrap().catch((err) => {
  console.error('❌ CV service failed to start:', err);
  process.exit(1);
});
