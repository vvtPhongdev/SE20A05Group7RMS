import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GatewayModule } from './gateway.module';
import { SERVICE_PORTS } from './constants';
import { JwtAuthGuard } from './auth/decorators/guard/jwt-auth.guard';
import { RolesGuard } from './auth/decorators/guard/roles.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: process.env.API_CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter());

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
    new RolesGuard(reflector)    // Chạy sau để phân quyền dựa trên danh tính đã xác thực
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
