import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Inject,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
  Res,
  Req,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { config as appConfig } from '../config';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom } from 'rxjs';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@wr/contracts';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsObject,
  IsISO8601,
  IsArray,
  IsIn,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

const buildGoogleCalendarReturnUrl = (
  returnTo: string | undefined,
  status: 'connected' | 'error',
) => {
  const configuredOrigin = appConfig.API_CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .find(Boolean);

  let webappOrigin: URL;
  try {
    webappOrigin = new URL(configuredOrigin || 'http://localhost:3000');
  } catch {
    webappOrigin = new URL('http://localhost:3000');
  }

  const fallbackPath = '/hr/interviews';
  let target: URL;
  try {
    target = new URL(returnTo || fallbackPath, webappOrigin);
    if (target.origin !== webappOrigin.origin) {
      target = new URL(fallbackPath, webappOrigin);
    }
  } catch {
    target = new URL(fallbackPath, webappOrigin);
  }

  target.searchParams.set('googleCalendar', status);
  return target.toString();
};

export class LoginDto {
  @ApiProperty({ example: 'admin@acme.com', description: 'User email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123!', description: 'User password' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class SupabaseLoginDto {
  @ApiProperty({ description: 'Supabase access token from the authenticated browser session' })
  @IsString()
  @IsNotEmpty()
  accessToken!: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class SupabaseRegisterDto extends SupabaseLoginDto {
  @ApiProperty({ example: 'John Doe', description: 'Display name' })
  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @ApiProperty({ required: false, description: 'Invitation code supplied by an administrator' })
  @IsOptional()
  @IsString()
  invitationCode?: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'test@example.com', description: 'User email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'John Doe', description: 'Display name' })
  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @ApiProperty({ example: 'Password123!', description: 'User password' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ required: false, description: 'Invitation code supplied by an administrator' })
  @IsOptional()
  @IsString()
  invitationCode?: string;
}

export class CreateOrganizationInvitationDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsUUID()
  organizationId!: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;
}

export class ValidateOrganizationInvitationDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class VerifyRegisterDto {
  @ApiProperty({ example: 'test@example.com', description: 'User email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456', description: 'Verification OTP code' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token', required: false })
  @IsOptional()
  @IsString()
  refreshToken!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'admin@acme.com', description: 'User email' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '/account-settings',
    required: false,
    enum: ['/reset-password', '/account-settings'],
    description: 'Approved page that receives the reset token',
  })
  @IsOptional()
  @IsString()
  @IsIn(['/reset-password', '/account-settings'])
  redirectPath?: '/reset-password' | '/account-settings';
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'admin@acme.com', description: 'User email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456', description: '6-digit verification code' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'NewPassword123!', description: 'New password' })
  @IsString()
  @IsNotEmpty()
  newPassword!: string;
}

export class LogoutDto {
  @ApiProperty({ description: 'Refresh token to invalidate', required: false })
  @IsOptional()
  @IsString()
  refreshToken!: string;
}

const RMS_REFRESH_COOKIE = 'rms_refresh_token';
const RMS_REMEMBER_COOKIE = 'rms_remember';
const REMEMBER_ME_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const getCookie = (request: Request, name: string) => {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;

  return cookieHeader.split(';').reduce<string | undefined>((value, cookie) => {
    if (value) return value;
    const [key, ...parts] = cookie.trim().split('=');
    return key === name ? decodeURIComponent(parts.join('=')) : undefined;
  }, undefined);
};

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Corporation', description: 'Organization name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'acme-corp', description: 'Organization unique slug' })
  @IsString()
  @IsNotEmpty()
  slug!: string;
}

export class UpdateOrganizationDto {
  @ApiProperty({ example: 'Acme Corporation', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({ example: 'acme-corp', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  slug?: string;

  @ApiProperty({ required: false, description: 'Organization-specific UI and workflow settings' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}

export class CreateDepartmentDto {
  @ApiProperty({ example: 'uuid-of-organization', description: 'Organization ID' })
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ example: 'Engineering', description: 'Department name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'ENG', description: 'Department unique uppercase code' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ required: false, type: [String], description: 'Department skill options' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  skills?: string[];

  @ApiProperty({ required: false, type: [String], description: 'Accepted bachelor requirements' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  bachelorRequirements?: string[];

  @ApiProperty({
    example: 'uuid-of-head-user',
    required: false,
    description: 'Department head user ID',
  })
  @IsOptional()
  @IsUUID()
  headUserId?: string;

  @ApiProperty({
    example: 'uuid-of-parent-department',
    required: false,
    description: 'Parent department ID',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class UpdateDepartmentDto {
  @ApiProperty({ example: 'Engineering Team', required: false, description: 'Department name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({ example: 'ENG_TEAM', required: false, description: 'Department code' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @ApiProperty({ required: false, type: [String], description: 'Department skill options' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  skills?: string[];

  @ApiProperty({ required: false, type: [String], description: 'Accepted bachelor requirements' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  bachelorRequirements?: string[];

  @ApiProperty({
    example: 'uuid-of-head-user',
    required: false,
    description: 'Department head user ID',
  })
  @IsOptional()
  @IsUUID()
  headUserId?: string;

  @ApiProperty({
    example: 'uuid-of-parent-department',
    required: false,
    description: 'Parent department ID',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class ListDepartmentsQueryDto {
  @ApiProperty({
    example: 'uuid-of-organization',
    required: false,
    description: 'Filter by organization ID',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}

export class CreateUserDto {
  @ApiProperty({ example: 'admin@acme.com', description: 'User email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'John Doe', description: 'Display name' })
  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @ApiProperty({
    example: 'HR_LEADER',
    enum: UserRole,
    description: 'User role',
  })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiProperty({ example: 'uuid-of-organization', description: 'Organization ID' })
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ example: 'uuid-of-department', required: false, description: 'Department ID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiProperty({ example: '0912345678', required: false, description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Password123!', required: false, description: 'Password' })
  @IsOptional()
  @IsString()
  password?: string;
}

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe Updated', required: false, description: 'Display name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  displayName?: string;

  @ApiProperty({ example: '0987654321', required: false, description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: true, required: false, description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: 'uuid-of-department', required: false, description: 'Department ID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}

export class UpdateMyProfileDto {
  @ApiProperty({ example: 'John Doe Updated', required: false, description: 'Display name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  displayName?: string;

  @ApiProperty({ example: 'john.doe@acme.com', required: false, description: 'Login email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '0987654321', required: false, description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string | null;

  @ApiProperty({
    required: false,
    description: 'Supabase browser access token used only to synchronize a matching social login',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  supabaseAccessToken?: string;
}

export class DeptHeadAddMemberDto {
  @ApiProperty({ example: 'Jane Recruiter', description: 'Member display name' })
  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @ApiProperty({ example: 'jane.recruiter@acme.com', description: 'Member email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '0987654321', required: false, description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Password123!', required: false, description: 'Temporary password' })
  @IsOptional()
  @IsString()
  password?: string;
}

export class UpdateUserRoleDto {
  @ApiProperty({
    example: 'HR_LEADER',
    enum: UserRole,
    description: 'User role',
  })
  @IsEnum(UserRole)
  role!: UserRole;
}

export class UpdateUserStatusDto {
  @ApiProperty({ example: true, description: 'Active status' })
  @IsBoolean()
  isActive!: boolean;
}

export class ListUsersQueryDto {
  @ApiProperty({ required: false, default: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({ required: false, default: 10, description: 'Users per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @ApiProperty({ required: false, enum: UserRole, description: 'Filter by role' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ required: false, description: 'Filter by department ID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}

export class CheckUserEmailQueryDto {
  @ApiProperty({ example: 'new.member@acme.com', description: 'Email to check in RMS users' })
  @IsEmail()
  email!: string;
}

export class CreateGoogleMeetDto {
  @ApiProperty({ example: 'Technical Interview - Backend Engineer' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ required: false, example: 'Round 1 interview with HR and technical panel' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2026-07-10T03:00:00.000Z' })
  @IsISO8601()
  startIso!: string;

  @ApiProperty({ example: '2026-07-10T04:00:00.000Z' })
  @IsISO8601()
  endIso!: string;

  @ApiProperty({
    required: false,
    example: ['candidate@example.com', 'interviewer@example.com'],
    description: 'Calendar attendees who should receive the Google Calendar invitation email',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsEmail({}, { each: true })
  attendees?: string[];

  @ApiProperty({
    required: false,
    example: 30,
    description: 'Email reminder offset in minutes before the event',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(40320)
  reminderMinutesBefore?: number;
}

/**
 * Thin proxy controller for Identity service (auth + users).
 * All business logic lives in services/identity.
 */
@ApiTags('Auth & Users')
@Controller()
export class IdentityController {
  constructor(@Inject(SERVICE_TOKENS.IDENTITY) private readonly identityClient: ClientProxy) {}

  private setRefreshSession(response: Response, refreshToken: string, rememberMe: boolean) {
    const options = {
      httpOnly: true,
      secure: appConfig.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/api/v1/auth',
      ...(rememberMe ? { maxAge: REMEMBER_ME_MAX_AGE_MS } : {}),
    };

    response.cookie(RMS_REFRESH_COOKIE, refreshToken, options);
    if (rememberMe) {
      response.cookie(RMS_REMEMBER_COOKIE, '1', options);
    } else {
      response.clearCookie(RMS_REMEMBER_COOKIE, {
        httpOnly: true,
        secure: appConfig.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/api/v1/auth',
      });
    }
  }

  private clearRefreshSession(response: Response) {
    const options = {
      httpOnly: true,
      secure: appConfig.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/api/v1/auth',
    };
    response.clearCookie(RMS_REFRESH_COOKIE, options);
    response.clearCookie(RMS_REMEMBER_COOKIE, options);
  }

  private sendAuthResponse(response: Response, result: any, rememberMe: boolean) {
    this.setRefreshSession(response, result.refreshToken, rememberMe);
    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      user: result.user,
    };
  }

  // â”€â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @Post('auth/register')
  @Public()
  @Throttle({ default: { limit: appConfig.RATE_LIMIT_AUTH_LIMIT, ttl: appConfig.RATE_LIMIT_TTL } })
  @ApiOperation({ summary: 'Register a new user' })
  @HttpCode(HttpStatus.CREATED)
  register(@Body() body: RegisterDto) {
    return firstValueFrom(this.identityClient.send('auth.register', body));
  }

  @Post('auth/verify-register')
  @Public()
  @Throttle({ default: { limit: appConfig.RATE_LIMIT_AUTH_LIMIT, ttl: appConfig.RATE_LIMIT_TTL } })
  @ApiOperation({ summary: 'Verify registration OTP code' })
  verifyRegister(@Body() body: VerifyRegisterDto) {
    return firstValueFrom(this.identityClient.send('identity.auth.verify-register', body));
  }

  @Post('auth/resend-register-otp')
  @Public()
  @Throttle({ default: { limit: appConfig.RATE_LIMIT_AUTH_LIMIT, ttl: appConfig.RATE_LIMIT_TTL } })
  @ApiOperation({ summary: 'Resend registration OTP code' })
  resendRegisterOtp(@Body() body: ForgotPasswordDto) {
    return firstValueFrom(this.identityClient.send('identity.auth.resend-register-otp', body));
  }

  @Post('auth/login')
  @Public()
  @Throttle({ default: { limit: appConfig.RATE_LIMIT_AUTH_LIMIT, ttl: appConfig.RATE_LIMIT_TTL } })
  @ApiOperation({ summary: 'Login' })
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await firstValueFrom(this.identityClient.send('auth.login', body));
    return this.sendAuthResponse(response, result, body.rememberMe === true);
  }

  @Post('auth/supabase-login')
  @Public()
  @Throttle({ default: { limit: appConfig.RATE_LIMIT_AUTH_LIMIT, ttl: appConfig.RATE_LIMIT_TTL } })
  @ApiOperation({ summary: 'Exchange a Supabase session for an RMS token pair' })
  @HttpCode(HttpStatus.OK)
  async loginWithSupabase(@Body() body: SupabaseLoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await firstValueFrom(this.identityClient.send('auth.supabase-login', body));
    return this.sendAuthResponse(response, result, body.rememberMe === true);
  }

  @Post('auth/supabase-register')
  @Public()
  @Throttle({ default: { limit: appConfig.RATE_LIMIT_AUTH_LIMIT, ttl: appConfig.RATE_LIMIT_TTL } })
  @ApiOperation({ summary: 'Create RMS account details for a verified Supabase session' })
  @HttpCode(HttpStatus.CREATED)
  registerWithSupabase(@Body() body: SupabaseRegisterDto) {
    return firstValueFrom(this.identityClient.send('auth.supabase-register', body));
  }

  @Post('organization-invitations/validate')
  @Public()
  @Throttle({ default: { limit: appConfig.RATE_LIMIT_AUTH_LIMIT, ttl: appConfig.RATE_LIMIT_TTL } })
  @HttpCode(HttpStatus.OK)
  validateOrganizationInvitation(@Body() body: ValidateOrganizationInvitationDto) {
    return firstValueFrom(this.identityClient.send('auth.organization-invitations.validate', body));
  }

  @Post('auth/refresh')
  @Public()
  @Throttle({ default: { limit: appConfig.RATE_LIMIT_AUTH_LIMIT, ttl: appConfig.RATE_LIMIT_TTL } })
  @ApiOperation({ summary: 'Refresh JWT token' })
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() body: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = body?.refreshToken ?? getCookie(request, RMS_REFRESH_COOKIE);
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is invalid or has expired');
    }

    const result = await firstValueFrom(
      this.identityClient.send('identity.auth.refresh', { refreshToken }),
    );
    return this.sendAuthResponse(response, result, getCookie(request, RMS_REMEMBER_COOKIE) === '1');
  }

  @Post('auth/logout')
  @Public()
  @Throttle({ default: { limit: appConfig.RATE_LIMIT_AUTH_LIMIT, ttl: appConfig.RATE_LIMIT_TTL } })
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Body() body: LogoutDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = body?.refreshToken ?? getCookie(request, RMS_REFRESH_COOKIE);
    this.clearRefreshSession(response);
    if (!refreshToken) return;
    await firstValueFrom(this.identityClient.send('identity.auth.logout', { refreshToken }));
    return;
  }

  @Post('auth/forgot-password')
  @Public()
  @Throttle({ default: { limit: appConfig.RATE_LIMIT_AUTH_LIMIT, ttl: appConfig.RATE_LIMIT_TTL } })
  @ApiOperation({ summary: 'Request password reset' })
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return firstValueFrom(this.identityClient.send('identity.auth.forgot-password', body));
  }

  @Post('auth/reset-password')
  @Public()
  @Throttle({ default: { limit: appConfig.RATE_LIMIT_AUTH_LIMIT, ttl: appConfig.RATE_LIMIT_TTL } })
  @ApiOperation({ summary: 'Reset password with token' })
  resetPassword(@Body() body: ResetPasswordDto) {
    return firstValueFrom(this.identityClient.send('identity.auth.reset-password', body));
  }

  @Get('google-calendar/auth-url')
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER, UserRole.DEPARTMENT_HEAD)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate Google OAuth URL for Calendar/Meet access' })
  createGoogleCalendarAuthUrl(
    @CurrentUser('sub') userId: string,
    @Query('returnTo') returnTo?: string,
  ) {
    return firstValueFrom(
      this.identityClient.send('google-calendar.auth-url', { userId, returnTo }),
    );
  }

  @Get('oauth2callback')
  @Public()
  @ApiOperation({ summary: 'Google OAuth callback for Calendar/Meet integration' })
  async handleGoogleOAuthCallback(
    @Res() response: Response,
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') oauthError?: string,
  ) {
    if (oauthError) {
      return response.redirect(
        HttpStatus.FOUND,
        buildGoogleCalendarReturnUrl('/hr/interviews', 'error'),
      );
    }

    try {
      const result = await firstValueFrom<{ connected: boolean; returnTo?: string }>(
        this.identityClient.send('google-calendar.oauth-callback', { code, state }),
      );
      return response.redirect(
        HttpStatus.FOUND,
        buildGoogleCalendarReturnUrl(result.returnTo, 'connected'),
      );
    } catch {
      return response.redirect(
        HttpStatus.FOUND,
        buildGoogleCalendarReturnUrl('/hr/interviews', 'error'),
      );
    }
  }

  @Post('google-calendar/meet')
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER, UserRole.DEPARTMENT_HEAD)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a Google Calendar event with an auto-generated Google Meet link',
  })
  createGoogleMeet(@CurrentUser('sub') userId: string, @Body() body: CreateGoogleMeetDto) {
    return firstValueFrom(
      this.identityClient.send('google-calendar.create-meet', {
        userId,
        ...body,
      }),
    );
  }

  // â”€â”€â”€ Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @Get('users')
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER, UserRole.DEPARTMENT_HEAD)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List users with pagination and role filter' })
  async listUsers(@Query() query: ListUsersQueryDto, @CurrentUser() user: JwtPayload) {
    const scopedQuery = { ...query };

    if (user.role === UserRole.DEPARTMENT_HEAD) {
      const currentUser = await firstValueFrom(
        this.identityClient.send('users.get', { id: user.sub }),
      );
      if (!currentUser.departmentId) {
        return {
          data: [],
          meta: { total: 0, page: scopedQuery.page, limit: scopedQuery.limit, totalPages: 0 },
        };
      }
      scopedQuery.departmentId = currentUser.departmentId;
    }

    return firstValueFrom(this.identityClient.send('users.list', scopedQuery));
  }

  @Get('users/interviewers')
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER, UserRole.DEPARTMENT_HEAD)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List internal users who can join interview panels' })
  listInterviewers() {
    return firstValueFrom(
      this.identityClient.send('users.list', {
        page: 1,
        limit: 100,
        roles: [UserRole.HR_LEADER, UserRole.DEPARTMENT_HEAD],
      }),
    );
  }

  @Get('users/email-exists')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if a user email already exists' })
  checkUserEmail(@Query() query: CheckUserEmailQueryDto) {
    return firstValueFrom(this.identityClient.send('users.check_email', query));
  }

  @Get('users/:id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  getUser(@Param('id') id: string) {
    return firstValueFrom(this.identityClient.send('users.get', { id }));
  }

  @Post('users')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new user' })
  createUser(@Body() body: CreateUserDto) {
    return firstValueFrom(this.identityClient.send('users.create', body));
  }

  @Post('organization-invitations')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite a member to an organization' })
  createOrganizationInvitation(
    @CurrentUser('sub') invitedById: string,
    @Body() body: CreateOrganizationInvitationDto,
  ) {
    return firstValueFrom(this.identityClient.send('users.get', { id: invitedById })).then((currentUser) => {
      if (!currentUser.organizationId || currentUser.organizationId !== body.organizationId) {
        throw new ForbiddenException('You can only invite members to your own organization');
      }
      return firstValueFrom(
        this.identityClient.send('auth.organization-invitations.create', { ...body, invitedById }),
      );
    });
  }

  @Get('organization-invitations')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List organization invitations and audit history' })
  async listOrganizationInvitations(@CurrentUser('sub') actorId: string) {
    const currentUser = await firstValueFrom(this.identityClient.send('users.get', { id: actorId }));
    if (!currentUser.organizationId) throw new BadRequestException('Organization is required');
    return firstValueFrom(
      this.identityClient.send('auth.organization-invitations.list', { organizationId: currentUser.organizationId }),
    );
  }

  @Post('organization-invitations/:id/resend')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend an active organization invitation' })
  async resendOrganizationInvitation(@CurrentUser('sub') actorId: string, @Param('id') invitationId: string) {
    const currentUser = await firstValueFrom(this.identityClient.send('users.get', { id: actorId }));
    if (!currentUser.organizationId) throw new BadRequestException('Organization is required');
    return firstValueFrom(this.identityClient.send('auth.organization-invitations.resend', { invitationId, organizationId: currentUser.organizationId, actorId }));
  }

  @Post('organization-invitations/:id/revoke')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke an organization invitation' })
  async revokeOrganizationInvitation(@CurrentUser('sub') actorId: string, @Param('id') invitationId: string) {
    const currentUser = await firstValueFrom(this.identityClient.send('users.get', { id: actorId }));
    if (!currentUser.organizationId) throw new BadRequestException('Organization is required');
    return firstValueFrom(this.identityClient.send('auth.organization-invitations.revoke', { invitationId, organizationId: currentUser.organizationId, actorId }));
  }

  @Post('dept-head/settings/team-members')
  @Roles(UserRole.DEPARTMENT_HEAD)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a department team member for the current department head' })
  async addDeptHeadTeamMember(
    @CurrentUser('sub') userId: string,
    @Body() body: DeptHeadAddMemberDto,
  ) {
    const currentUser = await firstValueFrom(this.identityClient.send('users.get', { id: userId }));
    const departmentId =
      currentUser.departmentId ??
      currentUser.department?.id ??
      currentUser.departmentsHeaded?.[0]?.id ??
      null;

    if (!currentUser.organizationId || !departmentId) {
      throw new BadRequestException('Department head organization and department are required');
    }

    return firstValueFrom(
      this.identityClient.send('users.create', {
        email: body.email,
        displayName: body.displayName,
        phone: body.phone || null,
        password: body.password,
        role: UserRole.HR_LEADER,
        organizationId: currentUser.organizationId,
        departmentId,
      }),
    );
  }

  @Patch('users/:id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user details' })
  updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return firstValueFrom(this.identityClient.send('users.update', { id, ...body }));
  }

  @Delete('users/:id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user' })
  deleteUser(@Param('id') id: string) {
    return firstValueFrom(this.identityClient.send('users.delete', { id }));
  }

  @Patch('users/:id/role')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user role' })
  updateUserRole(@Param('id') id: string, @Body() body: UpdateUserRoleDto) {
    return firstValueFrom(this.identityClient.send('users.update_role', { id, ...body }));
  }

  @Patch('users/:id/status')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user active status' })
  updateUserStatus(@Param('id') id: string, @Body() body: UpdateUserStatusDto) {
    return firstValueFrom(this.identityClient.send('users.update_status', { id, ...body }));
  }

  // â”€â”€â”€ Organizations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @Post('organizations')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new organization' })
  createOrganization(@Body() body: CreateOrganizationDto) {
    return firstValueFrom(this.identityClient.send('identity.create_organization', body));
  }

  @Get('organizations')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List organizations' })
  listOrganizations() {
    return firstValueFrom(this.identityClient.send('identity.list_organizations', {}));
  }

  @Get('organizations/:id')
  @Roles(UserRole.ADMIN, UserRole.DEPARTMENT_HEAD)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get organization by ID' })
  getOrganization(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    if (user.role === UserRole.DEPARTMENT_HEAD && user.organizationId !== id) {
      throw new ForbiddenException('You can only access your own organization');
    }
    return firstValueFrom(this.identityClient.send('identity.get_organization', { id }));
  }

  @Patch('organizations/:id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update organization profile and settings' })
  updateOrganization(@Param('id') id: string, @Body() body: UpdateOrganizationDto) {
    return firstValueFrom(
      this.identityClient.send('identity.update_organization', { id, ...body }),
    );
  }

  @Patch('organizations/:id/settings')
  @Roles(UserRole.ADMIN, UserRole.DEPARTMENT_HEAD)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update organization settings only' })
  async updateOrganizationSettings(
    @Param('id') id: string,
    @Body() body: Pick<UpdateOrganizationDto, 'settings'>,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.role === UserRole.DEPARTMENT_HEAD && user.organizationId !== id) {
      throw new ForbiddenException('You can only update your own organization settings');
    }

    const organization = await firstValueFrom(
      this.identityClient.send('identity.get_organization', { id }),
    );

    return firstValueFrom(
      this.identityClient.send('identity.update_organization', {
        id,
        name: organization.name,
        slug: organization.slug,
        settings: body.settings,
      }),
    );
  }

  // â”€â”€â”€ Departments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @Post('departments')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new department' })
  createDepartment(@Body() body: CreateDepartmentDto) {
    return firstValueFrom(this.identityClient.send('identity.create_department', body));
  }

  @Get('departments')
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER, UserRole.DEPARTMENT_HEAD)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List departments with organization filtering' })
  listDepartments(@Query() query: ListDepartmentsQueryDto, @CurrentUser() user: any) {
    return firstValueFrom(
      this.identityClient.send('identity.list_departments', {
        ...query,
        actorId: user.sub,
        actorRole: user.role,
        actorOrganizationId: user.organizationId,
      }),
    );
  }

  @Get('departments/:id')
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER, UserRole.DEPARTMENT_HEAD)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get department by ID' })
  getDepartment(@Param('id') id: string) {
    return firstValueFrom(this.identityClient.send('identity.get_department', { id }));
  }

  @Patch('departments/:id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update department details' })
  updateDepartment(@Param('id') id: string, @Body() body: UpdateDepartmentDto) {
    return firstValueFrom(this.identityClient.send('identity.update_department', { id, ...body }));
  }

  @Delete('departments/:id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete department' })
  deleteDepartment(@Param('id') id: string) {
    return firstValueFrom(this.identityClient.send('identity.delete_department', { id }));
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getCurrentUser(@CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.identityClient.send('users.get', { id: user.sub }));
  }

  @Get('me/profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user details from identity profile' })
  getCurrentUserProfile(@CurrentUser('sub') userId: string) {
    return firstValueFrom(this.identityClient.send('users.get', { id: userId }));
  }

  @Patch('me/profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user identity profile' })
  updateCurrentUserProfile(@CurrentUser('sub') userId: string, @Body() body: UpdateMyProfileDto) {
    return firstValueFrom(
      this.identityClient.send('identity.auth.update-account', { userId, ...body }),
    );
  }

  @Get('me/id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user ID' })
  getCurrentUserId(@CurrentUser('sub') userId: string) {
    // Example of extracting specific field (sub = user ID)
    return { userId };
  }
}
