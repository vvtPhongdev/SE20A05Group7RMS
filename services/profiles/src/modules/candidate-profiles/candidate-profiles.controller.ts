import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CandidateProfilesService } from './candidate-profiles.service';

@Controller()
export class CandidateProfilesController {
  constructor(private readonly service: CandidateProfilesService) {}

  @MessagePattern('profiles.list')
  listCandidates(@Payload() payload: { q?: string; page?: number; pageSize?: number }) {
    return this.service.listCandidates(payload);
  }

  @MessagePattern('profiles.get')
  getProfile(@Payload() payload: { id: string }) {
    return this.service.getProfile(payload.id);
  }

  @MessagePattern('profiles.update')
  updateProfile(@Payload() payload: { id: string; [key: string]: any }) {
    const { id, ...data } = payload;
    return this.service.updateProfile(id, data);
  }

  @MessagePattern('profiles.avatar.get')
  getAvatar(@Payload() payload: { id: string }) {
    return this.service.getAvatar(payload.id);
  }

  @MessagePattern('profiles.avatar.set')
  setAvatar(@Payload() payload: { id: string; avatar: Record<string, string> }) {
    return this.service.setAvatar(payload.id, payload.avatar);
  }

  @MessagePattern('profiles.avatar.remove')
  removeAvatar(@Payload() payload: { id: string }) {
    return this.service.removeAvatar(payload.id);
  }
}
