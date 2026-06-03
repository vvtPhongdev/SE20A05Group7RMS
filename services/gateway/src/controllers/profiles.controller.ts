import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Inject,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom } from 'rxjs';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';

// ─── CV / Document DTOs ───────────────────────────────────────────────────────

export class UploadDocumentDto {
  @ApiProperty({ enum: ['CV', 'JD'], example: 'CV' })
  documentType!: string;

  @ApiProperty({ type: 'string', format: 'binary', description: 'PDF or DOCX file' })
  file!: any;

  @ApiProperty({ required: false, description: 'Link to candidate profile (for CV type)' })
  candidateProfileId?: string;

  @ApiProperty({ required: false, description: 'Link to role (for JD type)' })
  roleId?: string;
}

export class CvSearchDto {
  @ApiProperty({ required: false, example: 'React TypeScript', description: 'Free-text query' })
  q?: string;

  @ApiProperty({ required: false, enum: ['ONSITE', 'REMOTE', 'HYBRID'] })
  workMode?: string;

  @ApiProperty({ required: false, example: 'Hanoi' })
  location?: string;

  @ApiProperty({ required: false, example: 2, description: 'Minimum years of experience' })
  minYearsExperience?: number;

  @ApiProperty({ required: false, default: 1 })
  page?: number;

  @ApiProperty({ required: false, default: 20 })
  pageSize?: number;
}

export class ScreenCvDto {
  @ApiProperty({ required: false, description: 'Role ID to screen the candidate against' })
  roleId?: string;
}

export class UpdateCandidateProfileDto {
  @ApiProperty({ required: false, example: 'Senior Full-Stack Engineer' })
  headline?: string;

  @ApiProperty({ required: false })
  summary?: string;

  @ApiProperty({ required: false, enum: ['PUBLIC', 'REGISTERED_ONLY', 'PRIVATE'] })
  visibility?: string;

  @ApiProperty({ required: false, enum: ['ONSITE', 'REMOTE', 'HYBRID'] })
  preferredWorkMode?: string;

  @ApiProperty({ required: false, type: [String], example: ['Hanoi', 'Ho Chi Minh City'] })
  preferredLocations?: string[];

  @ApiProperty({ required: false, example: 5 })
  yearsOfExperience?: number;
}

/**
 * Thin proxy controller for Profiles service.
 * Handles CV upload (multipart), list, search, screen and candidate profile CRUD.
 */
@ApiTags('Profiles')
@ApiBearerAuth()
@Controller()
export class ProfilesController {
  constructor(
    @Inject(SERVICE_TOKENS.PROFILES) private readonly profilesClient: ClientProxy,
  ) {}

  // ─── Candidate Profiles ──────────────────────────────────────────

  @Get('candidate-profiles/:id')
  @ApiOperation({ summary: 'Get candidate profile by ID or user ID' })
  getProfile(@Param('id') id: string) {
    return firstValueFrom(this.profilesClient.send('profiles.get', { id }));
  }

  @Patch('candidate-profiles/:id')
  @ApiOperation({ summary: 'Update candidate profile' })
  updateProfile(
    @Param('id') id: string,
    @Body() body: UpdateCandidateProfileDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return firstValueFrom(
      this.profilesClient.send('profiles.update', { id, actorId: user?.sub, ...body }),
    );
  }

  // ─── CV Search ───────────────────────────────────────────────────

  @Post('cv/search')
  @ApiOperation({ summary: 'Search candidates (talent search)' })
  searchCandidates(@Body() body: CvSearchDto) {
    return firstValueFrom(this.profilesClient.send('profiles.search', body));
  }

  // ─── CV Screen ───────────────────────────────────────────────────

  @Post('cv/:candidateProfileId/screen')
  @ApiOperation({ summary: 'Trigger CV screening for a candidate profile against a role' })
  screenCv(
    @Param('candidateProfileId') candidateProfileId: string,
    @Body() body: ScreenCvDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return firstValueFrom(
      this.profilesClient.send('profiles.screen', {
        candidateProfileId,
        roleId: body.roleId,
        actorId: user?.sub,
      }),
    );
  }

  // ─── Documents (CV / JD) ─────────────────────────────────────────

  @Post('documents')
  @ApiOperation({ summary: 'Upload a CV or JD document (multipart/form-data)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadDocumentDto })
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @UploadedFile() file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    @Body() body: { documentType: string; candidateProfileId?: string; roleId?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    const payload = {
      fileBuffer: file.buffer.toString('base64'),
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
      documentType: body.documentType,
      uploadedById: user?.sub,
      candidateProfileId: body.candidateProfileId ?? null,
      roleId: body.roleId ?? null,
    };
    return firstValueFrom(this.profilesClient.send('documents.upload', payload));
  }

  @Get('documents')
  @ApiOperation({ summary: 'List documents with optional filters' })
  listDocuments(
    @Query() query: {
      uploadedById?: string;
      documentType?: string;
      candidateProfileId?: string;
      page?: string;
      pageSize?: string;
    },
  ) {
    return firstValueFrom(this.profilesClient.send('documents.list', query));
  }

  @Get('documents/:id')
  @ApiOperation({ summary: 'Get document by ID' })
  getDocument(@Param('id') id: string) {
    return firstValueFrom(this.profilesClient.send('documents.get', { id }));
  }

  // ─── Evidence ────────────────────────────────────────────────────

  @Get('evidence')
  @ApiOperation({ summary: 'List evidence records' })
  listEvidence(
    @Query() query: { evaluationRunId?: string; evidenceType?: string; page?: string; pageSize?: string },
  ) {
    return firstValueFrom(this.profilesClient.send('evidence.list', query));
  }

  @Get('evidence/:id')
  @ApiOperation({ summary: 'Get evidence record by ID' })
  getEvidence(@Param('id') id: string) {
    return firstValueFrom(this.profilesClient.send('evidence.get', { id }));
  }
}
