import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CandidateProfilesService } from './candidate-profiles.service';

@Controller()
export class CandidateProfilesController {
  constructor(private readonly service: CandidateProfilesService) {}

  @MessagePattern('profiles.get')
  getProfile(@Payload() payload: { id: string }) {
    return this.service.getProfile(payload.id);
  }

  @MessagePattern('profiles.update')
  updateProfile(@Payload() payload: { id: string; [key: string]: any }) {
    const { id, ...data } = payload;
    return this.service.updateProfile(id, data);
  }
}
