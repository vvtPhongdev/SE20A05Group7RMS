import { Controller, Delete, Get, Patch, Post, Param, Inject, Sse, MessageEvent } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom, Observable } from 'rxjs';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SseNotificationService } from '../services/sse-notification.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    @Inject(SERVICE_TOKENS.NOTIFICATION) private readonly notificationClient: ClientProxy,
    private readonly sseNotificationService: SseNotificationService,
  ) {}

  @Sse('sse')
  @ApiOperation({ summary: 'Real-time notifications stream (SSE)' })
  streamNotifications(@CurrentUser('sub') userId: string): Observable<MessageEvent> {
    return this.sseNotificationService.getNotificationsForUser(userId);
  }

  @Get()
  @ApiOperation({ summary: 'List user notifications' })
  listNotifications(@CurrentUser('sub') userId: string) {
    return firstValueFrom(
      this.notificationClient.send('notification.list_notifications', { userId }),
    );
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return firstValueFrom(this.notificationClient.send('notification.mark_read', { id, userId }));
  }

  @Patch(':id/unread')
  @ApiOperation({ summary: 'Mark a notification as unread' })
  markUnread(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return firstValueFrom(this.notificationClient.send('notification.mark_unread', { id, userId }));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archive/delete a notification' })
  deleteNotification(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return firstValueFrom(
      this.notificationClient.send('notification.delete_notification', { id, userId }),
    );
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all user notifications as read' })
  markAllRead(@CurrentUser('sub') userId: string) {
    return firstValueFrom(this.notificationClient.send('notification.mark_all_read', { userId }));
  }
}
