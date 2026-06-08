import { Injectable, OnModuleInit, OnModuleDestroy, Logger, MessageEvent } from '@nestjs/common';
import Redis from 'ioredis';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@Injectable()
export class SseNotificationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SseNotificationService.name);
  private subClient!: Redis;
  private readonly notificationSubject = new Subject<any>();

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.logger.log(`Subscribing to Redis at ${redisUrl}`);
    this.subClient = new Redis(redisUrl);

    this.subClient.subscribe('notifications:created', (err) => {
      if (err) {
        this.logger.error(`Failed to subscribe: ${err.message}`);
      } else {
        this.logger.log(`Successfully subscribed to channel 'notifications:created'`);
      }
    });

    this.subClient.on('message', (channel, message) => {
      if (channel === 'notifications:created') {
        try {
          const notification = JSON.parse(message);
          this.notificationSubject.next(notification);
        } catch (e: any) {
          this.logger.error(`Failed to parse notification message: ${e.message}`);
        }
      }
    });
  }

  async onModuleDestroy() {
    if (this.subClient) {
      await this.subClient.quit();
    }
  }

  getNotificationsForUser(userId: string): Observable<MessageEvent> {
    return this.notificationSubject.asObservable().pipe(
      filter((notification) => notification.userId === userId),
      map((notification) => ({
        data: notification,
      } as MessageEvent))
    );
  }
}
