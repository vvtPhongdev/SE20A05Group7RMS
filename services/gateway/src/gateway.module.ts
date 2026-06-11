import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { TerminusModule } from '@nestjs/terminus';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { SERVICE_TOKENS, SERVICE_PORTS } from './constants';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { HealthController } from './controllers/health.controller';
import { IdentityController } from './controllers/identity.controller';
import { RecruitingController } from './controllers/recruiting.controller';
import { ProfilesController } from './controllers/profiles.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { InterviewController } from './controllers/interview.controller';
import { CvController } from './controllers/cv.controller';
import { SseNotificationService } from './services/sse-notification.service';
import { CorrelationClientTCP, CorrelationIdMiddleware } from '@wr/logger';
import { config as appConfig } from './config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TerminusModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: appConfig.RATE_LIMIT_TTL,
        limit: appConfig.RATE_LIMIT_LIMIT,
      },
    ]),
    ClientsModule.register([
      {
        name: SERVICE_TOKENS.IDENTITY,
        customClass: CorrelationClientTCP as any,
        options: { host: '127.0.0.1', port: SERVICE_PORTS.IDENTITY },
      },
      {
        name: SERVICE_TOKENS.RECRUITING,
        customClass: CorrelationClientTCP as any,
        options: { host: '127.0.0.1', port: SERVICE_PORTS.RECRUITING },
      },
      {
        name: SERVICE_TOKENS.PROFILES,
        customClass: CorrelationClientTCP as any,
        options: { host: '127.0.0.1', port: SERVICE_PORTS.PROFILES },
      },
      {
        name: SERVICE_TOKENS.NOTIFICATION,
        customClass: CorrelationClientTCP as any,
        options: { host: '127.0.0.1', port: SERVICE_PORTS.NOTIFICATION },
      },
      {
        name: SERVICE_TOKENS.CV,
        customClass: CorrelationClientTCP as any,
        options: { host: '127.0.0.1', port: SERVICE_PORTS.CV },
      },
      {
        name: SERVICE_TOKENS.INTERVIEW,
        customClass: CorrelationClientTCP as any,
        options: { host: '127.0.0.1', port: SERVICE_PORTS.INTERVIEW },
      },
    ]),
  ],
  providers: [
    JwtStrategy,
    SseNotificationService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  controllers: [
    HealthController,
    IdentityController,
    RecruitingController,
    ProfilesController,
    NotificationsController,
    InterviewController,
    CvController,
  ],
})
export class GatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
