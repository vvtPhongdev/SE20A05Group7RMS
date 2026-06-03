import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CandidateProfilesService } from './candidate-profiles.service';

@Controller()
export class CandidateProfilesController {
  constructor(private readonly service: CandidateProfilesService) {}

  @MessagePattern('profiles.get')
  get(@Payload() payload: { id: string }) {
    return this.service.getProfile(payload.id);
  }

  @MessagePattern('profiles.update')
  update(@Payload() payload: {
    id: string;
    actorId?: string;
    headline?: string;
    summary?: string;
    visibility?: string;
    preferredWorkMode?: string;
    preferredLocations?: string[];
    yearsOfExperience?: number;
  }) {
    const { id, actorId, ...data } = payload;
    return this.service.updateProfile(id, data);
  }

  @MessagePattern('profiles.search')
  search(@Payload() payload: {
    q?: string;
    workMode?: string;
    location?: string;
    minYearsExperience?: number;
    page?: number | string;
    pageSize?: number | string;
  }) {
    return this.service.searchProfiles(payload);
  }

  @MessagePattern('profiles.screen')
  screen(@Payload() payload: {
    candidateProfileId: string;
    roleId?: string;
    actorId?: string;
  }) {
    return this.service.screenProfile(payload.candidateProfileId, payload.roleId);
  }
}
