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

  @MessagePattern('notification.send_to_role')
  async sendToRole(
    @Payload()
    payload: {
      role: string;
      departmentId?: string;
      title: string;
      body: string;
      type: string;
      relatedEntityId?: string;
      relatedEntityType?: string;
    },
  ) {
    return this.notificationsService.sendToRole(payload);
  }

  @MessagePattern('notification.send_email')
  async sendEmail(@Payload() payload: CreateEmailLogInput) {
    return this.notificationsService.sendEmail(payload);
  }

  @MessagePattern('notification.render_template')
  async renderTemplate(
    @Payload() payload: { templateType: string; templateData: Record<string, any> },
  ) {
    return this.notificationsService.renderTemplate(payload);
  }

  @MessagePattern('notification.send_templated_email')
  async sendTemplatedEmail(
    @Payload()
    payload: {
      userId?: string;
      toEmail: string;
      templateType: string;
      templateData: Record<string, any>;
    },
  ) {
    return this.notificationsService.sendTemplatedEmail(payload);
  }
}
