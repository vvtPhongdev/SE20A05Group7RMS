import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Inject, HttpCode, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom } from 'rxjs';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@wr/contracts';
import { IsEmail, IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

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

export class CreateUserDto {
  @ApiProperty({ example: 'admin@acme.com', description: 'User email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'John Doe', description: 'Display name' })
  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @ApiProperty({
    example: 'HR_MANAGER',
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

export class UpdateUserRoleDto {
  @ApiProperty({
    example: 'HR_MANAGER',
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
  @HttpCode(HttpStatus.CREATED)
  register(@Body() body: RegisterDto) {
    return firstValueFrom(this.identityClient.send('auth.register', body));
  }

  @Post('auth/login')
  @Public()
  @ApiOperation({ summary: 'Login' })
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto) {
    return firstValueFrom(this.identityClient.send('auth.login', body));
  }

  @Post('auth/refresh')
  @Public()
  @ApiOperation({ summary: 'Refresh JWT token' })
  @HttpCode(HttpStatus.OK)
  refresh(@Body() body: RefreshTokenDto) {
    return firstValueFrom(this.identityClient.send('identity.auth.refresh', body));
  }

  @Post('auth/logout')
  @Public()
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() body: LogoutDto) {
    await firstValueFrom(this.identityClient.send('identity.auth.logout', body));
    return;
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
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List users with pagination and role filter' })
  listUsers(@Query() query: ListUsersQueryDto) {
    return firstValueFrom(this.identityClient.send('users.list', query));
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
}
