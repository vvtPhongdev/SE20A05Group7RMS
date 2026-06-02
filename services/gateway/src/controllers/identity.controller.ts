import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty, ApiForbiddenResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom } from 'rxjs';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@wr/contracts';

export class LoginDto {
  @ApiProperty({ example: 'admin@acme.com', description: 'User email' })
  email!: string;

  @ApiProperty({ example: 'Password123!', description: 'User password' })
  password!: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'test@example.com', description: 'User email' })
  email!: string;

  @ApiProperty({ example: 'John Doe', description: 'Display name' })
  displayName!: string;

  @ApiProperty({ example: 'Password123!', description: 'User password' })
  password!: string;

  @ApiProperty({
    example: 'CANDIDATE',
    enum: ['CANDIDATE', 'RECRUITER', 'HIRING_MANAGER', 'DEPARTMENT_HEAD', 'ADMIN'],
    description: 'User role',
  })
  role!: 'CANDIDATE' | 'RECRUITER' | 'HIRING_MANAGER' | 'DEPARTMENT_HEAD' | 'ADMIN';
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token' })
  refreshToken!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'admin@acme.com', description: 'User email' })
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'admin@acme.com', description: 'User email' })
  email!: string;

  @ApiProperty({ example: '123456', description: '6-digit verification code' })
  code!: string;

  @ApiProperty({ example: 'NewPassword123!', description: 'New password' })
  newPassword!: string;
}

export class LogoutDto {
  @ApiProperty({ description: 'Refresh token to invalidate' })
  refreshToken!: string;
}

// ─── Organization DTOs ────────────────────────────────────────────

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Corp', description: 'Organization display name' })
  name!: string;

  @ApiProperty({ example: 'acme-corp', description: 'URL-safe unique slug (lowercase, hyphens only)' })
  slug!: string;
}

// ─── Department DTOs ──────────────────────────────────────────────

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Engineering', description: 'Department display name' })
  name!: string;

  @ApiProperty({ example: 'ENG', description: 'Short uppercase code, unique per organization' })
  code!: string;

  @ApiProperty({ required: false, example: 'uuid-of-dept-head-user', description: 'Must be a user with DEPARTMENT_HEAD role' })
  headUserId?: string;

  @ApiProperty({ required: false, description: 'Parent department UUID for hierarchical structure' })
  parentId?: string;
}

export class UpdateDepartmentDto {
  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  code?: string;

  @ApiProperty({ required: false })
  headUserId?: string;

  @ApiProperty({ required: false })
  parentId?: string;
}

/**
 * Thin proxy controller for Identity service (auth + users).
 * All business logic lives in services/identity.
 */
@ApiTags('Auth & Users')
@Controller()
export class IdentityController {
  constructor(
    @Inject(SERVICE_TOKENS.IDENTITY) private readonly identityClient: ClientProxy,
  ) {}

  // ─── Auth ────────────────────────────────────────────────────────

  @Post('auth/register')
  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() body: RegisterDto) {
    return firstValueFrom(this.identityClient.send('auth.register', body));
  }

  @Post('auth/login')
  @Public()
  @ApiOperation({ summary: 'Login' })
  login(@Body() body: LoginDto) {
    return firstValueFrom(this.identityClient.send('auth.login', body));
  }

  @Post('auth/refresh')
  @Public()
  @ApiOperation({ summary: 'Refresh JWT token' })
  refresh(@Body() body: RefreshTokenDto) {
    return firstValueFrom(this.identityClient.send('identity.auth.refresh', body));
  }

  @Post('auth/logout')
  @Public()
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  logout(@Body() body: LogoutDto) {
    return firstValueFrom(this.identityClient.send('identity.auth.logout', body));
  }

  @Post('auth/forgot-password')
  @Public()
  @ApiOperation({ summary: 'Request password reset' })
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return firstValueFrom(this.identityClient.send('identity.auth.forgot-password', body));
  }

  @Post('auth/reset-password')
  @Public()
  @ApiOperation({ summary: 'Reset password with token' })
  resetPassword(@Body() body: ResetPasswordDto) {
    return firstValueFrom(this.identityClient.send('identity.auth.reset-password', body));
  }

  // ─── Users ───────────────────────────────────────────────────────

  @Get('users')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List users' })
  listUsers() {
    return firstValueFrom(this.identityClient.send('users.list', {}));
  }

  @Get('users/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  getUser(@Param('id') id: string) {
    return firstValueFrom(this.identityClient.send('users.get', { id }));
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getCurrentUser(@CurrentUser() user: JwtPayload) {
    // Example of extracting full user payload from JWT
    return user;
  }

  @Get('me/id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user ID' })
  getCurrentUserId(@CurrentUser('sub') userId: string) {
    // Example of extracting specific field (sub = user ID)
    return { userId };
  }

  // ─── Organizations (T-014) ────────────────────────────────────────

  @Post('organizations')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Create a new organization' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiBody({ type: CreateOrganizationDto })
  createOrganization(@Body() body: CreateOrganizationDto) {
    return firstValueFrom(this.identityClient.send('organizations.create', body));
  }

  @Get('organizations')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] List all organizations' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  listOrganizations(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return firstValueFrom(this.identityClient.send('organizations.list', {
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
    }));
  }

  @Get('organizations/:id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Get organization by ID with departments' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  getOrganization(@Param('id') id: string) {
    return firstValueFrom(this.identityClient.send('organizations.get', { id }));
  }

  // ─── Departments (T-014) ──────────────────────────────────────────

  @Post('organizations/:orgId/departments')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Create a department. headUserId must have DEPARTMENT_HEAD role.' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiParam({ name: 'orgId', description: 'Organization UUID' })
  @ApiBody({ type: CreateDepartmentDto })
  createDepartment(@Param('orgId') organizationId: string, @Body() body: CreateDepartmentDto) {
    return firstValueFrom(this.identityClient.send('departments.create', { organizationId, ...body }));
  }

  @Get('organizations/:orgId/departments')
  @Roles(UserRole.ADMIN, UserRole.DEPARTMENT_HEAD, UserRole.HIRING_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List departments in an organization' })
  @ApiParam({ name: 'orgId', description: 'Organization UUID' })
  listDepartments(
    @Param('orgId') organizationId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return firstValueFrom(this.identityClient.send('departments.list', {
      organizationId,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
    }));
  }

  @Get('departments/:id')
  @Roles(UserRole.ADMIN, UserRole.DEPARTMENT_HEAD, UserRole.HIRING_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get department by ID' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  getDepartment(@Param('id') id: string) {
    return firstValueFrom(this.identityClient.send('departments.get', { id }));
  }

  @Patch('departments/:id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Update department (name, code, headUserId). headUserId must be DEPARTMENT_HEAD.' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiBody({ type: UpdateDepartmentDto })
  updateDepartment(@Param('id') id: string, @Body() body: UpdateDepartmentDto) {
    return firstValueFrom(this.identityClient.send('departments.update', { id, ...body }));
  }

  @Delete('departments/:id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[ADMIN] Delete a department' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  deleteDepartment(@Param('id') id: string) {
    return firstValueFrom(this.identityClient.send('departments.delete', { id }));
  }

  // ─── Notifications (FR-19) ────────────────────────────────────────

  @Get('notifications')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List in-app notifications for the current user. FR-19.' })
  listNotifications(
    @CurrentUser('sub') recipientId: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return firstValueFrom(this.identityClient.send('notifications.list', {
      recipientId,
      unreadOnly: unreadOnly === 'true',
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
    }));
  }

  @Patch('notifications/:id/read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a specific notification as read.' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  markNotificationRead(@Param('id') id: string, @CurrentUser('sub') recipientId: string) {
    return firstValueFrom(this.identityClient.send('notifications.markRead', { id, recipientId }));
  }

  @Patch('notifications/read-all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all notifications as read for the current user.' })
  markAllNotificationsRead(@CurrentUser('sub') recipientId: string) {
    return firstValueFrom(this.identityClient.send('notifications.markAllRead', { recipientId }));
  }
}
