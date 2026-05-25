import { Controller, Get, Post, Body, Param, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom } from 'rxjs';

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
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() body: any) {
    return firstValueFrom(this.identityClient.send('auth.register', body));
  }

  @Post('auth/login')
  @ApiOperation({ summary: 'Login' })
  login(@Body() body: any) {
    return firstValueFrom(this.identityClient.send('auth.login', body));
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
}
