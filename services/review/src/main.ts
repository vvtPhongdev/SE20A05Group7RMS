import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ReviewModule } from './review.module';

const PORT = parseInt(process.env.REVIEW_PORT || '3013', 10);

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(ReviewModule, {
    transport: Transport.TCP,
    options: { host: '127.0.0.1', port: PORT },
  });

  await app.listen();
  console.log(`📝 Review service listening on TCP :${PORT}`);
}

bootstrap().catch((err) => {
  console.error('❌ Review service failed to start:', err);
  process.exit(1);
});
