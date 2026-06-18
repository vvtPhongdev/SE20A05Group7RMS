import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Inject,
  Res,
  UploadedFile,
  UseInterceptors,
  NotFoundException,
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
import { IsEmail, IsObject, IsOptional, IsString } from 'class-validator';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom } from 'rxjs';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@wr/contracts';
import { readFile, unlink } from 'fs/promises';
import { basename, resolve } from 'path';
import type { Response } from 'express';
import {
  buildCvStoragePath,
  buildStoragePath,
  downloadFile,
  parseSupabasePublicUrl,
  removeFile,
  storageBuckets,
  uploadFile,
  validateCvFileName,
} from '@wr/storage';

export class UploadDocumentDto {
  @ApiProperty({ enum: ['CV', 'JD'], example: 'CV' })
  documentType!: string;

  @ApiProperty({ type: 'string', format: 'binary', description: 'PDF, DOCX, or DOC file' })
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
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  structuredData?: Record<string, unknown>;
}

type AvatarStorageRecord = {
  fileName?: string;
  url?: string;
  bucket?: string;
  path?: string;
  mimeType?: string;
};

/**
 * Thin proxy controller for Profiles service (candidate profiles, documents, evidence).
 */
@ApiTags('Profiles')
@ApiBearerAuth()
@Controller()
export class ProfilesController {
  constructor(@Inject(SERVICE_TOKENS.PROFILES) private readonly profilesClient: ClientProxy) {}

  private avatarPath(fileName: string) {
    if (!fileName || basename(fileName) !== fileName) {
      throw new NotFoundException('Profile photo not found');
    }

    return resolve(process.cwd(), 'uploads', 'avatars', fileName);
  }

  private isValidImage(buffer: Buffer, mimeType: string) {
    if (mimeType === 'image/jpeg') {
      return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }

    if (mimeType === 'image/png') {
      return (
        buffer.length >= 8 &&
        buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      );
    }

    if (mimeType === 'image/gif') {
      const signature = buffer.subarray(0, 6).toString('ascii');
      return signature === 'GIF87a' || signature === 'GIF89a';
    }

    return false;
  }

  private async sendAvatar(avatar: AvatarStorageRecord | null, res: Response) {
    if (!avatar?.url && !avatar?.fileName) {
      throw new NotFoundException('Profile photo not found');
    }

    const storageLocation =
      avatar.bucket && avatar.path
        ? { bucket: avatar.bucket, path: avatar.path }
        : avatar.url
          ? parseSupabasePublicUrl(avatar.url)
          : null;

    if (storageLocation) {
      try {
        const blob = await downloadFile(storageLocation.bucket, storageLocation.path);
        const buffer = Buffer.from(await blob.arrayBuffer());
        res.type(avatar.mimeType || blob.type || 'application/octet-stream');
        res.setHeader('Content-Disposition', 'inline');
        res.send(buffer);
        return;
      } catch (error) {
        throw new NotFoundException('Profile photo not found');
      }
    }

    try {
      const file = await readFile(this.avatarPath(avatar.fileName!));
      res.type(avatar.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', 'inline');
      res.send(file);
    } catch (error) {
      throw new NotFoundException('Profile photo not found');
    }
  }

  private async removeStoredAvatar(avatar?: AvatarStorageRecord | null) {
    if (avatar?.bucket && avatar.path) {
      await removeFile(avatar.bucket, avatar.path).catch(() => undefined);
      return;
    }

    if (avatar?.fileName) {
      await unlink(this.avatarPath(avatar.fileName)).catch(() => undefined);
    }
  }

  @Get('candidate-profiles/me')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Get the current candidate profile' })
  getMyProfile(@CurrentUser('sub') userId: string) {
    return firstValueFrom(this.profilesClient.send('profiles.get', { id: userId }));
  }

  @Patch('candidate-profiles/me')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Update the current candidate profile' })
  updateMyProfile(@CurrentUser('sub') userId: string, @Body() body: UpdateCandidateProfileDto) {
    return firstValueFrom(this.profilesClient.send('profiles.update', { id: userId, ...body }));
  }

  @Get('candidate-profiles/me/avatar')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Get the current candidate profile photo' })
  async getMyAvatar(@CurrentUser('sub') userId: string, @Res() res: Response) {
    const avatar = await firstValueFrom(
      this.profilesClient.send<AvatarStorageRecord | null>('profiles.avatar.get', { id: userId }),
    );

    await this.sendAvatar(avatar, res);
  }

  @Post('candidate-profiles/me/avatar')
  @Roles(UserRole.CANDIDATE)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload the current candidate profile photo' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadMyAvatar(
    @CurrentUser('sub') userId: string,
    @UploadedFile()
    file?: { buffer: Buffer; originalname?: string; mimetype: string; size: number },
  ) {
    if (!file) {
      throw new BadRequestException('Profile photo is required');
    }

    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
    };
    const extension = extensions[file.mimetype];

    if (!extension || !this.isValidImage(file.buffer, file.mimetype)) {
      throw new BadRequestException('Only valid JPG, PNG, or GIF images are supported');
    }

    const bucket = storageBuckets.avatars;
    const path = buildStoragePath(userId, file.originalname || `profile${extension}`);
    const uploaded = await uploadFile(bucket, path, file.buffer, {
      contentType: file.mimetype,
    }).catch(() => {
      throw new BadRequestException('Failed to upload avatar');
    });

    try {
      const result = await firstValueFrom(
        this.profilesClient.send<{ previousAvatar?: AvatarStorageRecord | null; updatedAt: Date }>(
          'profiles.avatar.set',
          {
            id: userId,
            avatar: {
              url: uploaded.publicUrl,
              bucket,
              path,
              mimeType: file.mimetype,
              updatedAt: new Date().toISOString(),
            },
          },
        ),
      );
      await this.removeStoredAvatar(result.previousAvatar);

      return {
        mimeType: file.mimetype,
        url: uploaded.publicUrl,
        updatedAt: result.updatedAt,
      };
    } catch (error) {
      await removeFile(bucket, path).catch(() => undefined);
      throw error;
    }
  }

  @Delete('candidate-profiles/me/avatar')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Delete the current candidate profile photo' })
  async deleteMyAvatar(@CurrentUser('sub') userId: string) {
    const result = await firstValueFrom(
      this.profilesClient.send<{
        previousAvatar?: AvatarStorageRecord | null;
        updatedAt: Date;
      }>('profiles.avatar.remove', { id: userId }),
    );

    await this.removeStoredAvatar(result.previousAvatar);

    return {
      deleted: Boolean(result.previousAvatar),
      updatedAt: result.updatedAt,
    };
  }

  // ─── Candidate Profiles ──────────────────────────────────────────

  @Get('candidate-profiles')
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER, UserRole.HR_RECRUITER)
  @ApiOperation({ summary: 'List candidate profiles (talent pool)' })
  listCandidates(@Query() query: { q?: string; page?: string; pageSize?: string }) {
    return firstValueFrom(this.profilesClient.send('profiles.list', query));
  }

  @Get('candidate-profiles/:id')
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER, UserRole.HR_RECRUITER, UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Get candidate profile' })
  getProfile(@Param('id') id: string) {
    return firstValueFrom(this.profilesClient.send('profiles.get', { id }));
  }

  @Get('candidate-profiles/:id/avatar')
  @Public()
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER, UserRole.HR_RECRUITER, UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Get candidate profile photo by candidate ID' })
  async getCandidateAvatar(@Param('id') id: string, @Res() res: Response) {
    const avatar = await firstValueFrom(
      this.profilesClient.send<AvatarStorageRecord | null>('profiles.avatar.get', { id }),
    );

    await this.sendAvatar(avatar, res);
  }

  @Patch('candidate-profiles/:id')
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER, UserRole.HR_RECRUITER)
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
    if (!file) {
      throw new BadRequestException('Document file is required');
    }

    const bucket = storageBuckets.cvs;
    let path: string;
    if (body.documentType?.toUpperCase() === 'CV') {
      try {
        validateCvFileName(file.originalname);
      } catch {
        throw new BadRequestException('Only PDF, DOCX, and DOC files are supported');
      }
      path = buildCvStoragePath(body.candidateProfileId || 'anonymous', file.originalname);
    } else {
      path = buildStoragePath(body.candidateProfileId || 'anonymous', file.originalname);
    }

    return (async () => {
      const uploaded = await uploadFile(bucket, path, file.buffer, {
        contentType: file.mimetype,
      }).catch(() => {
        throw new BadRequestException('Failed to upload document');
      });

      try {
        return await firstValueFrom(
          this.profilesClient.send('documents.upload', {
            ...body,
            fileName: file.originalname,
            mimeType: file.mimetype,
            fileSizeBytes: file.size,
            filePath: uploaded.publicUrl,
            bucket,
            path,
          }),
        );
      } catch (error) {
        await removeFile(bucket, path).catch(() => undefined);
        throw error;
      }
    })();
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
