import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';
import { CreateNotificationInput, CreateEmailLogInput } from '@wr/contracts';

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

  @MessagePattern('notification.create_notification')
  async createNotification(@Payload() payload: CreateNotificationInput) {
    return this.notificationsService.createNotification(payload);
  }

  @MessagePattern('notification.send_email')
  async sendEmail(@Payload() payload: CreateEmailLogInput) {
    return this.notificationsService.sendEmail(payload);
  }
}
