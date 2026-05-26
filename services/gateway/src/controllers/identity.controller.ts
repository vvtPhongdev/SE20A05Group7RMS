import { Controller, Get, Post, Body, Param, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom } from 'rxjs';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';

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
  register(@Body() body: any) {
    return firstValueFrom(this.identityClient.send('auth.register', body));
  }

  @Post('auth/login')
  @Public()
  @ApiOperation({ summary: 'Login' })
  login(@Body() body: any) {
    return firstValueFrom(this.identityClient.send('auth.login', body));
  }

  @Post('auth/refresh')
  @Public()
  @ApiOperation({ summary: 'Refresh JWT token' })
  refresh(@Body() body: any) {
    return firstValueFrom(this.identityClient.send('auth.refresh', body));
  }

  @Post('auth/forgot-password')
  @Public()
  @ApiOperation({ summary: 'Request password reset' })
  forgotPassword(@Body() body: any) {
    return firstValueFrom(this.identityClient.send('auth.forgot-password', body));
  }

  @Post('auth/reset-password')
  @Public()
  @ApiOperation({ summary: 'Reset password with token' })
  resetPassword(@Body() body: any) {
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
