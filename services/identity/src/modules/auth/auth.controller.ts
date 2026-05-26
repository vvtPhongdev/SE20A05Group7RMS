import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @MessagePattern('auth.register')
  async register(@Payload() data: any) {
    return this.service.register(data);
  }

  @MessagePattern('auth.login')
  async login(@Payload() data: any) {
    return this.service.login(data);
  }
  @MessagePattern('identity.auth.refresh')
  async refresh(@Payload() data: any) {
    return this.service.refresh(data);
  }

  @MessagePattern('identity.auth.forgot-password')
  async forgotPassword(@Payload() data: any) {
    return this.service.forgotPassword(data);
  }

  @MessagePattern('identity.auth.reset-password')
  async resetPassword(@Payload() data: any) {
    return this.service.resetPassword(data);
  }

  @MessagePattern('identity.auth.logout')
  async logout(@Payload() data: any) {
    return this.service.logout(data);
  }
}
