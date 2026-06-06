import { Controller, Get, Post, Patch, Body, Param, Inject, UseInterceptors, UploadedFile, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiProperty } from '@nestjs/swagger';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom } from 'rxjs';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@wr/contracts';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { IsUUID, IsString, IsOptional, IsNotEmpty } from 'class-validator';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer');
const diskStorage = multer.diskStorage;

export class UpdateCandidateProfileDto {
  @ApiProperty({ example: 'John Doe', required: false, description: 'Candidate Full Name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fullName?: string;

  @ApiProperty({ example: '0912345678', required: false, description: 'Candidate Phone Number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Experienced developer with 5 years...', required: false, description: 'Candidate Professional Summary' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ required: false, description: 'Structured Candidate CV Data' })
  @IsOptional()
  structuredData?: any;
}

export class ApplyJobDto {
  @ApiProperty({ example: 'uuid-of-recruitment-request', description: 'Recruitment Request ID' })
  @IsUUID()
  @IsNotEmpty()
  requestId!: string;
}

@ApiTags('Candidates')
@ApiBearerAuth()
@Controller('candidates')
export class CandidatesController {
  constructor(
    @Inject(SERVICE_TOKENS.CV) private readonly cvClient: ClientProxy,
    @Inject(SERVICE_TOKENS.PROFILES) private readonly profilesClient: ClientProxy,
    @Inject(SERVICE_TOKENS.RECRUITING) private readonly recruitingClient: ClientProxy,
  ) {}

  // ─── Profile Endpoints ───────────────────────────────────────────

  @Get('profile')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Get current candidate profile' })
  getProfile(@CurrentUser() user: JwtPayload) {
    return firstValueFrom(this.profilesClient.send('profiles.get', { id: user.sub }));
  }

  @Patch('profile')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Update current candidate profile' })
  updateProfile(@CurrentUser() user: JwtPayload, @Body() body: UpdateCandidateProfileDto) {
    return firstValueFrom(this.profilesClient.send('profiles.update', { id: user.sub, ...body }));
  }

  // ─── CV Endpoints ────────────────────────────────────────────────

  @Post('upload-cv')
  @Roles(UserRole.CANDIDATE)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload CV (PDF/DOCX)' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req: any, _file: any, cb: any) => {
          const uploadPath = './uploads/cvs';
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (_req: any, file: any, cb: any) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `cv-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req: any, file: any, cb: any) => {
        if (
          file.mimetype === 'application/pdf' ||
          file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
          cb(null, true);
        } else {
          cb(new Error('Only PDF and DOCX files are allowed!'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  uploadCv(
    @UploadedFile() file: any,
    @Body() body: { requestId: string; candidateId: string },
  ) {
    if (!file) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'No file uploaded or file format is invalid',
      };
    }

    return firstValueFrom(
      this.cvClient.send('cv.upload', {
        candidateId: body.candidateId,
        fileName: file.originalname,
        fileType: file.mimetype === 'application/pdf' ? 'PDF' : 'DOCX',
        filePath: file.path.replace(/\\/g, '/'),
        requestId: body.requestId,
      }),
    );
  }

  @Get(':id/cv')
  @Roles(UserRole.HR_MANAGER)
  @ApiOperation({ summary: 'Get CV document' })
  getCv(@Param('id') id: string) {
    return firstValueFrom(this.cvClient.send('cv.get_by_candidate', { candidateId: id }));
  }

  // ─── Applications Endpoints ─────────────────────────────────────

  @Get('applications')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'List candidate applications' })
  async listApplications(@CurrentUser() user: JwtPayload) {
    const profile = await firstValueFrom(this.profilesClient.send('profiles.get', { id: user.sub }));
    if (!profile) {
      return [];
    }
    return firstValueFrom(this.recruitingClient.send('applications.list', { candidateId: profile.id }));
  }

  @Post('applications')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Apply to a recruitment request' })
  applyJob(@CurrentUser() user: JwtPayload, @Body() body: ApplyJobDto) {
    return firstValueFrom(
      this.recruitingClient.send('applications.create', {
        requestId: body.requestId,
        userId: user.sub,
      }),
    );
  }
}
