import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../../.env') });

import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GatewayModule } from './gateway.module';
import { SERVICE_PORTS } from './constants';
import { JwtAuthGuard } from './auth/decorators/guard/jwt-auth.guard';
import { RolesGuard } from './auth/decorators/guard/roles.guard';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { config as appConfig } from './config';
import { PinoLogger } from '@wr/logger';
import helmet from 'helmet';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule, {
    logger: new PinoLogger('gateway', appConfig.LOG_LEVEL),
    bodyParser: false,
  });

  // Meeting-evidence images are sent as base64 and can be larger than Nest's 100 KB default.
  // The UI restricts the original file to 2 MB; 4 MB accommodates base64 overhead safely.
  app.use(json({ limit: '4mb' }));
  app.use(urlencoded({ extended: true, limit: '4mb' }));

  // Apply security headers via Helmet
  app.use(helmet());

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS - Whitelist webapp origins
  const allowedOrigins = appConfig.API_CORS_ORIGIN
    ? appConfig.API_CORS_ORIGIN.split(',').map((o) => o.trim())
    : [];

  app.enableCors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
  });

  // Global filters
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const reflector = app.get(Reflector);
  app.useGlobalGuards(
    new JwtAuthGuard(reflector), // Chạy trước để xác thực danh tính
    new RolesGuard(reflector), // Chạy sau để phân quyền dựa trên danh tính đã xác thực
  );

  // Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Works Reruiter API')
    .setDescription('Reasoning-First Recruitment Management System — API Gateway')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = SERVICE_PORTS.GATEWAY;
  await app.listen(port);
  console.log(`🚀 Gateway running on http://localhost:${port}`);
  console.log(`📖 Swagger UI: http://localhost:${port}/api/docs`);
}

bootstrap();
