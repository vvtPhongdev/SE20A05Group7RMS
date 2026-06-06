import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { InterviewModule } from './interview.module';

const PORT = parseInt(process.env.INTERVIEW_PORT || '3015', 10);

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(InterviewModule, {
    transport: Transport.TCP,
    options: { host: '127.0.0.1', port: PORT },
  });

  await app.listen();
  console.log(`🗓️  Interview service listening on TCP :${PORT}`);
}

bootstrap().catch((err) => {
  console.error('❌ Interview service failed to start:', err);
  process.exit(1);
});
