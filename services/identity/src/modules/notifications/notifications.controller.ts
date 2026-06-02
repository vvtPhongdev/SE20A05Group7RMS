import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @MessagePattern('notifications.list')
  list(@Payload() payload: { recipientId: string; unreadOnly?: boolean; page?: number; pageSize?: number }) {
    return this.service.list(
      payload.recipientId,
      payload.unreadOnly ?? false,
      payload.page ?? 1,
      payload.pageSize ?? 20,
    );
  }

  @MessagePattern('notifications.markRead')
  markRead(@Payload() payload: { id: string; recipientId: string }) {
    return this.service.markRead(payload.id, payload.recipientId);
  }

  @MessagePattern('notifications.markAllRead')
  markAllRead(@Payload() payload: { recipientId: string }) {
    return this.service.markAllRead(payload.recipientId);
  }
}
