import { Controller, Get, Post, Body, Param, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom } from 'rxjs';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@wr/contracts';

@ApiTags('CV')
@ApiBearerAuth()
@Controller('candidates')
export class CvController {
  constructor(
    @Inject(SERVICE_TOKENS.CV) private readonly cvClient: ClientProxy,
  ) {}

  @Post('upload-cv')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Upload CV (PDF/DOCX)' })
  uploadCv(@Body() body: any) {
    return firstValueFrom(this.cvClient.send('cv.upload', body));
  }

  @Get(':id/cv')
  @Roles(UserRole.HR_MANAGER)
  @ApiOperation({ summary: 'Get CV document' })
  getCv(@Param('id') id: string) {
    return firstValueFrom(this.cvClient.send('cv.get_by_candidate', { candidateId: id }));
  }
}
