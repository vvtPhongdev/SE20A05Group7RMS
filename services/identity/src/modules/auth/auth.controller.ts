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

  @MessagePattern('auth.supabase-login')
  async loginWithSupabase(@Payload() data: any) {
    return this.service.loginWithSupabase(data);
  }

  @MessagePattern('auth.supabase-register')
  async registerWithSupabase(@Payload() data: any) {
    return this.service.registerWithSupabase(data);
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

  @MessagePattern('auth.organization-invitations.create')
  async createOrganizationInvitation(@Payload() data: any) {
    return this.service.createOrganizationInvitation(data);
  }

  @MessagePattern('auth.organization-invitations.validate')
  async validateOrganizationInvitation(@Payload() data: any) {
    return this.service.validateOrganizationInvitation(data);
  }

  @MessagePattern('auth.organization-invitations.list')
  async listOrganizationInvitations(@Payload() data: any) {
    return this.service.listOrganizationInvitations(data);
  }

  @MessagePattern('auth.organization-invitations.resend')
  async resendOrganizationInvitation(@Payload() data: any) {
    return this.service.resendOrganizationInvitation(data);
  }

  @MessagePattern('auth.organization-invitations.revoke')
  async revokeOrganizationInvitation(@Payload() data: any) {
    return this.service.revokeOrganizationInvitation(data);
  }
  @MessagePattern('identity.auth.update-account')
  async updateAccount(@Payload() data: any) {
    return this.service.updateAccount(data);
  }

  @MessagePattern('identity.auth.verify-register')
  async verifyRegister(@Payload() data: any) {
    return this.service.verifyRegister(data);
  }

  @MessagePattern('identity.auth.resend-register-otp')
  async resendRegisterOtp(@Payload() data: any) {
    return this.service.resendRegisterOtp(data);
  }

  @MessagePattern('identity.auth.logout')
  async logout(@Payload() data: any) {
    return this.service.logout(data);
  }
}
