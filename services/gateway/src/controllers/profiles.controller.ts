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

export class UploadDocumentDto {
  @ApiProperty({ enum: ['CV', 'JD'], example: 'CV' })
  documentType!: string;

  @ApiProperty({ type: 'string', format: 'binary', description: 'PDF or DOCX file' })
  file!: unknown;

  @ApiProperty({ required: false })
  candidateProfileId?: string;

  @ApiProperty({ required: false })
  roleId?: string;
}

export class CvSearchDto {
  @ApiProperty({ required: false, example: 'React TypeScript' })
  q?: string;

  @ApiProperty({ required: false, enum: ['ONSITE', 'REMOTE', 'HYBRID'] })
  workMode?: string;

  @ApiProperty({ required: false, example: 'Hanoi' })
  location?: string;

  @ApiProperty({ required: false, example: 2 })
  minYearsExperience?: number;

  @ApiProperty({ required: false, default: 1 })
  page?: number;

  @ApiProperty({ required: false, default: 20 })
  pageSize?: number;
}

export class ScreenCvDto {
  @ApiProperty({ required: false })
  roleId?: string;
}

export class UpdateCandidateProfileDto {
  @ApiProperty({ required: false })
  headline?: string;

  @ApiProperty({ required: false })
  summary?: string;

  @ApiProperty({ required: false, enum: ['PUBLIC', 'REGISTERED_ONLY', 'PRIVATE'] })
  visibility?: string;

  @ApiProperty({ required: false, enum: ['ONSITE', 'REMOTE', 'HYBRID'] })
  preferredWorkMode?: string;

  @ApiProperty({ required: false, type: [String] })
  preferredLocations?: string[];

  @ApiProperty({ required: false })
  yearsOfExperience?: number;
}

/**
 * Thin proxy controller for Profiles service (candidate profiles, documents, evidence).
 */
@ApiTags('Profiles')
@ApiBearerAuth()
@Controller()
export class ProfilesController {
  constructor(@Inject(SERVICE_TOKENS.PROFILES) private readonly profilesClient: ClientProxy) {}

  // ─── Candidate Profiles ──────────────────────────────────────────

  @Get('candidate-profiles/:id')
  @ApiOperation({ summary: 'Get candidate profile' })
  getProfile(@Param('id') id: string) {
    return firstValueFrom(this.profilesClient.send('profiles.get', { id }));
  }

  @Patch('candidate-profiles/:id')
  @ApiOperation({ summary: 'Update candidate profile' })
  updateProfile(@Param('id') id: string, @Body() body: UpdateCandidateProfileDto) {
    return firstValueFrom(this.profilesClient.send('profiles.update', { id, ...body }));
  }

  @Post('cv/search')
  @ApiOperation({ summary: 'Search candidates' })
  searchCandidates(@Body() body: CvSearchDto) {
    return firstValueFrom(this.profilesClient.send('profiles.search', body));
  }

  @Post('cv/:candidateProfileId/screen')
  @ApiOperation({ summary: 'Screen a candidate CV against a role' })
  screenCv(@Param('candidateProfileId') candidateProfileId: string, @Body() body: ScreenCvDto) {
    return firstValueFrom(
      this.profilesClient.send('profiles.screen', { candidateProfileId, ...body }),
    );
  }

  // ─── Documents ───────────────────────────────────────────────────

  @Post('documents')
  @ApiOperation({ summary: 'Upload a document (CV/JD)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadDocumentDto })
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @UploadedFile()
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    @Body() body: Omit<UploadDocumentDto, 'file'>,
  ) {
    return firstValueFrom(
      this.profilesClient.send('documents.upload', {
        ...body,
        fileBuffer: file.buffer.toString('base64'),
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSizeBytes: file.size,
      }),
    );
  }

  @Get('documents')
  @ApiOperation({ summary: 'List documents' })
  listDocuments(@Query() query: any) {
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
  listEvidence(@Query() query: any) {
    return firstValueFrom(this.profilesClient.send('evidence.list', query));
  }

  @Get('evidence/:id')
  @ApiOperation({ summary: 'Get evidence record' })
  getEvidence(@Param('id') id: string) {
    return firstValueFrom(this.profilesClient.send('evidence.get', { id }));
  }
}
