import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import {
  HealthCheckService,
  HealthCheck,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { PrismaService } from '../../common/database/prisma.service';
import Redis from 'ioredis';

@Controller()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaService,
  ) {}

  @MessagePattern('health.check')
  @HealthCheck()
  async check() {
    return this.health.check([
      async () => this.checkDatabase(),
      async () => this.checkRedis(),
      async () => this.checkUptime(),
    ]);
  }

  private async checkDatabase(): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { database: { status: 'up' } };
    } catch (e: any) {
      throw new HealthCheckError('Database check failed', {
        database: { status: 'down', message: e.message },
      });
    }
  }

  private async checkRedis(): Promise<HealthIndicatorResult> {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    const client = new Redis(redisUrl, {
      connectTimeout: 2000,
      maxRetriesPerRequest: 0,
    });
    try {
      const pingResult = await client.ping();
      if (pingResult === 'PONG') {
        return { redis: { status: 'up' } };
      }
      throw new Error(`Unexpected ping reply: ${pingResult}`);
    } catch (e: any) {
      throw new HealthCheckError('Redis check failed', {
        redis: { status: 'down', message: e.message },
      });
    } finally {
      await client.quit().catch(() => {});
    }
  }

  private async checkUptime(): Promise<HealthIndicatorResult> {
    return { uptime: { status: 'up', uptimeSeconds: process.uptime() } };
  }
}
