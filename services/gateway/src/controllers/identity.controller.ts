import { Controller, Get, Post, Body, Param, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom } from 'rxjs';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';

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
    return firstValueFrom(this.identityClient.send('auth.reset-password', body));
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
}
