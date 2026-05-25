import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CandidateProfilesService } from './candidate-profiles.service';

@ApiTags('candidate-profiles')
@Controller('candidate-profiles')
export class CandidateProfilesController {
  constructor(private readonly service: CandidateProfilesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
