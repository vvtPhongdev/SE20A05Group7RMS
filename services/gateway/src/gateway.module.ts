import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { TerminusModule } from '@nestjs/terminus';
import { SERVICE_TOKENS, SERVICE_PORTS } from './constants';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { HealthController } from './controllers/health.controller';
import { IdentityController } from './controllers/identity.controller';
import { RecruitingController } from './controllers/recruiting.controller';
import { ProfilesController } from './controllers/profiles.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { InterviewController } from './controllers/interview.controller';
import { SseNotificationService } from './services/sse-notification.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TerminusModule,
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
        name: SERVICE_TOKENS.NOTIFICATION,
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: SERVICE_PORTS.NOTIFICATION },
      },
      {
        name: SERVICE_TOKENS.CV,
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: SERVICE_PORTS.CV },
      },
      {
        name: SERVICE_TOKENS.INTERVIEW,
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: SERVICE_PORTS.INTERVIEW },
      },
    ]),
  ],
  providers: [JwtStrategy, SseNotificationService],
  controllers: [
    HealthController,
    IdentityController,
    RecruitingController,
    ProfilesController,
    NotificationsController,
    InterviewController,
  ],
})
export class GatewayModule {}
