import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  constructor() {}

  async onModuleInit() {
    this.client = new Redis(process.env.REDIS_URL??"");

    this.client.on('connect', () => {
      this.logger.log('Redis connected');
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  /**
   * Store refresh token in Redis with TTL
   * @param tokenId Unique token identifier
   * @param userId User ID
   * @param ttl Time to live in seconds (default: 30 days)
   */
  async storeRefreshToken(tokenId: string, userId: string, ttl: number = 30 * 24 * 60 * 60): Promise<void> {
    await this.client.setex(`refresh:${tokenId}`, ttl, userId);
  }

  /**
   * Verify refresh token exists and get associated user
   * @param tokenId Token identifier
   */
  async getRefreshToken(tokenId: string): Promise<string | null> {
    return this.client.get(`refresh:${tokenId}`);
  }

  /**
   * Delete refresh token
   * @param tokenId Token identifier
   */
  async deleteRefreshToken(tokenId: string): Promise<void> {
    await this.client.del(`refresh:${tokenId}`);
  }

  /**
   * Get all refresh tokens for a user
   * @param userId User ID
   */
  async getUserRefreshTokens(userId: string): Promise<string[]> {
    const pattern = 'refresh:*';
    const keys = await this.client.keys(pattern);
    const tokens: string[] = [];

    for (const key of keys) {
      const storedUserId = await this.client.get(key);
      if (storedUserId === userId) {
        tokens.push(key.replace('refresh:', ''));
      }
    }

    return tokens;
  }

  /**
   * Delete all refresh tokens for a user (for logout/password reset)
   * @param userId User ID
   */
  async deleteUserRefreshTokens(userId: string): Promise<void> {
    const tokens = await this.getUserRefreshTokens(userId);
    if (tokens.length > 0) {
      const keys = tokens.map((token) => `refresh:${token}`);
      await this.client.del(...keys);
    }
  }

  getClient(): Redis {
    return this.client;
  }
}
