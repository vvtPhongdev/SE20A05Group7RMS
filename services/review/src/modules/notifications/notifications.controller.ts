import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @MessagePattern('notification.list_notifications')
  async listNotifications(@Payload() payload: { userId: string }) {
    return this.notificationsService.listNotifications(payload);
  }

  @MessagePattern('notification.mark_read')
  async markRead(@Payload() payload: { id: string; userId: string }) {
    return this.notificationsService.markRead(payload);
  }

  @MessagePattern('notification.mark_all_read')
  async markAllRead(@Payload() payload: { userId: string }) {
    return this.notificationsService.markAllRead(payload);
  }
}
