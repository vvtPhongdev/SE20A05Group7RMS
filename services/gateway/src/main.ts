import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GatewayModule } from './gateway.module';
import { SERVICE_PORTS } from './constants';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: process.env.API_CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
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
