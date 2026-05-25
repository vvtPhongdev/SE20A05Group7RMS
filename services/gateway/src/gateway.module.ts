import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SERVICE_TOKENS, SERVICE_PORTS } from './constants';
import { HealthController } from './controllers/health.controller';
import { IdentityController } from './controllers/identity.controller';
import { RecruitingController } from './controllers/recruiting.controller';
import { ProfilesController } from './controllers/profiles.controller';
import { ReviewController } from './controllers/review.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: SERVICE_TOKENS.IDENTITY,
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: SERVICE_PORTS.IDENTITY },
      },
      {
        name: SERVICE_TOKENS.RECRUITING,
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: SERVICE_PORTS.RECRUITING },
      },
      {
        name: SERVICE_TOKENS.PROFILES,
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: SERVICE_PORTS.PROFILES },
      },
      {
        name: SERVICE_TOKENS.REVIEW,
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: SERVICE_PORTS.REVIEW },
      },
    ]),
  ],
  controllers: [
    HealthController,
    IdentityController,
    RecruitingController,
    ProfilesController,
    ReviewController,
  ],
})
export class GatewayModule {}
