import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ProfilesModule } from './profiles.module';

const PORT = parseInt(process.env.PROFILES_PORT || '3012', 10);

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(ProfilesModule, {
    transport: Transport.TCP,
    options: { host: '127.0.0.1', port: PORT },
  });

  await app.listen();
  console.log(`👤 Profiles service listening on TCP :${PORT}`);
}

bootstrap().catch((err) => {
  console.error('❌ Profiles service failed to start:', err);
  process.exit(1);
});
