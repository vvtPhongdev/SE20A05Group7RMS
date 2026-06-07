import { Controller, Get, Patch, Post, Param, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom } from 'rxjs';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    @Inject(SERVICE_TOKENS.NOTIFICATION) private readonly notificationClient: ClientProxy,
  ) {}

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
    return firstValueFrom(
      this.notificationClient.send('notification.mark_read', { id, userId }),
    );
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all user notifications as read' })
  markAllRead(@CurrentUser('sub') userId: string) {
    return firstValueFrom(
      this.notificationClient.send('notification.mark_all_read', { userId }),
    );
  }
}
