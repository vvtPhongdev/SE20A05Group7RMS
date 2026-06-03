import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { IdentityModule } from './identity.module';

const PORT = parseInt(process.env.IDENTITY_PORT || '3010', 10);

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(IdentityModule, {
    transport: Transport.TCP,
    options: { host: '127.0.0.1', port: PORT },
  });

  await app.listen();
  console.log(`🔐 Identity service listening on TCP :${PORT}`);
}

bootstrap().catch((err) => {
  console.error('❌ Identity service failed to start:', err);
  process.exit(1);
});
