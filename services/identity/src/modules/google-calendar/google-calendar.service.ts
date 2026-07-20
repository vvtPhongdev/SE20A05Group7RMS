import { Injectable, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { calendar_v3, google } from 'googleapis';
import * as crypto from 'crypto';
import { config } from '../../config';
import { PrismaService } from '../../common/database/prisma.service';

const GOOGLE_CALENDAR_SCOPES = [
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar.events',
];

interface GoogleCalendarState {
  sub: string;
  purpose: 'google_calendar_oauth';
  returnTo: string;
}

export interface CreateGoogleMeetInput {
  title: string;
  description?: string;
  startIso: string;
  endIso: string;
  refreshToken: string;
  attendees?: string[];
  reminderMinutesBefore?: number;
}

@Injectable()
export class GoogleCalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private assertGoogleOAuthConfigured() {
    if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message:
          'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      });
    }
  }

  private createOAuthClient() {
    this.assertGoogleOAuthConfigured();
    return new google.auth.OAuth2(
      config.GOOGLE_CLIENT_ID,
      config.GOOGLE_CLIENT_SECRET,
      config.GOOGLE_OAUTH_REDIRECT_URI,
    );
  }

  private normalizeAttendees(attendees?: string[]) {
    return Array.from(
      new Set(
        (attendees ?? [])
          .map((email) => email.trim().toLowerCase())
          .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
      ),
    );
  }

  private normalizeReminderMinutes(minutes?: number) {
    if (typeof minutes !== 'number' || !Number.isFinite(minutes)) {
      return 30;
    }

    return Math.min(Math.max(Math.trunc(minutes), 1), 40_320);
  }

  private normalizeReturnTo(returnTo?: string) {
    const fallback = '/hr/interviews';
    if (!returnTo || returnTo.length > 1_024 || !returnTo.startsWith('/')) return fallback;

    try {
      const base = new URL('http://webapp.local');
      const target = new URL(returnTo, base);
      if (target.origin !== base.origin) return fallback;
      return `${target.pathname}${target.search}${target.hash}`;
    } catch {
      return fallback;
    }
  }

  /**
   * Bước 1: Tạo URL OAuth để người dùng cấp quyền Google Calendar.
   * - Scope gồm profile, email và calendar.events để đủ quyền tạo event.
   * - access_type=offline + prompt=consent buộc Google trả refresh_token.
   * - state là JWT ngắn hạn để callback biết refresh_token thuộc user nào.
   */
  createAuthorizationUrl(userId: string, returnTo?: string) {
    const oauth2Client = this.createOAuthClient();
    const state = this.jwtService.sign(
      {
        sub: userId,
        purpose: 'google_calendar_oauth',
        returnTo: this.normalizeReturnTo(returnTo),
      } satisfies GoogleCalendarState,
      { expiresIn: '10m' },
    );

    return {
      authorizationUrl: oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: GOOGLE_CALENDAR_SCOPES,
        state,
      }),
    };
  }

  /**
   * Bước 2: Nhận code từ Google callback và đổi code lấy token.
   * Refresh token được lưu vào bảng users để các lần tạo Meet sau chạy tự động.
   */
  async handleOAuthCallback(payload: { code?: string; state?: string }) {
    if (!payload.code || !payload.state) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Google OAuth callback must include code and state.',
      });
    }

    let state: GoogleCalendarState;
    try {
      state = this.jwtService.verify<GoogleCalendarState>(payload.state);
    } catch {
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Invalid or expired Google OAuth state.',
      });
    }

    if (state.purpose !== 'google_calendar_oauth' || !state.sub) {
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Invalid Google OAuth state purpose.',
      });
    }

    const oauth2Client = this.createOAuthClient();
    const { tokens } = await oauth2Client.getToken(payload.code);
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message:
          'Google did not return a refresh_token. Revoke the app in your Google account and connect again.',
      });
    }

    const user = await this.prisma.user.update({
      where: { id: state.sub },
      data: { googleCalendarRefreshToken: refreshToken },
      select: { id: true, email: true, displayName: true },
    });

    return {
      connected: true,
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      returnTo: this.normalizeReturnTo(state.returnTo),
    };
  }

  /**
   * Bước 3: Tạo Google Calendar event có ConferenceData để Google sinh Meet link.
   * Hàm nhận refresh_token, tự lấy access_token mới thông qua OAuth2 client.
   */
  async createGoogleMeetEvent(input: CreateGoogleMeetInput) {
    const start = new Date(input.startIso);
    const end = new Date(input.endIso);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'startIso and endIso must be valid ISO-8601 date strings.',
      });
    }

    if (end <= start) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'endIso must be later than startIso.',
      });
    }

    const oauth2Client = this.createOAuthClient();
    oauth2Client.setCredentials({ refresh_token: input.refreshToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const attendees = this.normalizeAttendees(input.attendees);
    const reminderMinutesBefore = this.normalizeReminderMinutes(input.reminderMinutesBefore);
    const event: calendar_v3.Schema$Event = {
      summary: input.title,
      description: input.description,
      start: {
        dateTime: start.toISOString(),
        timeZone: 'Asia/Ho_Chi_Minh',
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: 'Asia/Ho_Chi_Minh',
      },
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      attendees: attendees.map((email) => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          {
            method: 'email',
            minutes: reminderMinutesBefore,
          },
        ],
      },
    };

    const insertParams: calendar_v3.Params$Resource$Events$Insert = {
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: event,
    };

    // sendUpdates=all yêu cầu Google Calendar gửi email invite/update tới các attendee.
    if (attendees.length > 0) {
      insertParams.sendUpdates = 'all';
    }

    let response: { data: calendar_v3.Schema$Event };
    try {
      response = await calendar.events.insert(insertParams);
    } catch (error) {
      throw this.toGoogleCalendarRpcException(error);
    }

    const meetLink =
      response.data.hangoutLink ??
      response.data.conferenceData?.entryPoints?.find(
        (entryPoint) => entryPoint.entryPointType === 'video',
      )?.uri;

    if (!meetLink) {
      throw new RpcException({
        status: HttpStatus.BAD_GATEWAY,
        message: 'Google Calendar created the event but did not return a Meet link.',
      });
    }

    return {
      meetLink,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
      attendees,
      reminderMinutesBefore,
    };
  }

  /**
   * Bước 4: Dùng refresh_token đã lưu trong database của user hiện tại.
   * API ngoài không cần gửi refresh_token qua frontend, giảm nguy cơ lộ token.
   */
  async createGoogleMeetEventForUser(
    userId: string,
    input: Omit<CreateGoogleMeetInput, 'refreshToken'> & { refreshToken?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { googleCalendarRefreshToken: true },
    });

    const refreshToken = input.refreshToken ?? user?.googleCalendarRefreshToken;
    if (!refreshToken) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Google Calendar is not connected for this user.',
      });
    }

    return this.createGoogleMeetEvent({
      title: input.title,
      description: input.description,
      startIso: input.startIso,
      endIso: input.endIso,
      refreshToken,
      attendees: input.attendees,
      reminderMinutesBefore: input.reminderMinutesBefore,
    });
  }

  private toGoogleCalendarRpcException(error: unknown) {
    const maybeError = error as {
      code?: number;
      response?: {
        status?: number;
        data?: { error?: string; error_description?: string; message?: string };
      };
      message?: string;
    };
    const status = Number(maybeError.response?.status ?? maybeError.code) || HttpStatus.BAD_GATEWAY;
    const googleMessage =
      maybeError.response?.data?.error_description ??
      maybeError.response?.data?.message ??
      maybeError.response?.data?.error ??
      maybeError.message ??
      'Google Calendar request failed.';

    if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
      return new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message:
          'Google Calendar authorization expired or lacks Calendar permission. Please reconnect Google Calendar.',
      });
    }

    if (status >= 400 && status < 500) {
      return new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Google Calendar rejected the Meet request: ${googleMessage}`,
      });
    }

    return new RpcException({
      status: HttpStatus.BAD_GATEWAY,
      message: `Google Calendar service failed: ${googleMessage}`,
    });
  }
}
