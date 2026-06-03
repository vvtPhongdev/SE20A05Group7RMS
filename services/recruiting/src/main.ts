import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { RecruitingModule } from './recruiting.module';

const PORT = parseInt(process.env.RECRUITING_PORT || '3011', 10);

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(RecruitingModule, {
    transport: Transport.TCP,
    options: { host: '127.0.0.1', port: PORT },
  });

  await app.listen();
  console.log(`📋 Recruiting service listening on TCP :${PORT}`);
}

bootstrap().catch((err) => {
  console.error('❌ Recruiting service failed to start:', err);
  process.exit(1);
});
