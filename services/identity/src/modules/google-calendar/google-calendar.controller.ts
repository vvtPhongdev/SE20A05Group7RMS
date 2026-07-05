import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GoogleCalendarService } from './google-calendar.service';

@Controller()
export class GoogleCalendarController {
  constructor(private readonly service: GoogleCalendarService) {}

  @MessagePattern('google-calendar.auth-url')
  createAuthorizationUrl(@Payload() payload: { userId: string }) {
    return this.service.createAuthorizationUrl(payload.userId);
  }

  @MessagePattern('google-calendar.oauth-callback')
  handleOAuthCallback(@Payload() payload: { code?: string; state?: string }) {
    return this.service.handleOAuthCallback(payload);
  }

  @MessagePattern('google-calendar.create-meet')
  createMeet(
    @Payload()
    payload: {
      userId: string;
      title: string;
      description?: string;
      startIso: string;
      endIso: string;
      refreshToken?: string;
      attendees?: string[];
      reminderMinutesBefore?: number;
    },
  ) {
    return this.service.createGoogleMeetEventForUser(payload.userId, payload);
  }
}
