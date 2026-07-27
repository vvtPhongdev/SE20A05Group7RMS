import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { extractTextFromBuffer } from '@wr/ai';
import { UserRole } from '@wr/contracts';
import {
  buildCvStoragePath,
  candidateCvTemplateStoragePath,
  downloadFile,
  parseSupabasePublicUrl,
  removeFile,
  storageBuckets,
  uploadFile,
  validateCvFileName,
} from '@wr/storage';
import { firstValueFrom } from 'rxjs';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { SERVICE_TOKENS } from '../constants';
import { Response } from 'express';
import { basename } from 'path';

@ApiTags('Candidate CVs')
@ApiBearerAuth()
@Roles(UserRole.CANDIDATE)
@Controller('candidate/cvs')
export class CvController {
  private readonly logger = new Logger(CvController.name);

  constructor(
    @Inject(SERVICE_TOKENS.CV) private readonly cvClient: ClientProxy,
    @Inject(SERVICE_TOKENS.PROFILES) private readonly profilesClient: ClientProxy,
  ) {}

  private cvContentType(fileName: string) {
    const extension = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
    if (extension === '.pdf') return 'application/pdf';
    if (extension === '.docx') {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    if (extension === '.doc') return 'application/msword';
    return 'application/octet-stream';
  }

  private async getCandidateNameForStorage(userId: string, fallbackName?: string) {
    const profile = await firstValueFrom(
      this.profilesClient.send<{ fullName?: string }>('profiles.get', { id: userId }),
    ).catch(() => null);

    return profile?.fullName || fallbackName || userId;
  }

  @Get('template')
  @Public()
  @Roles()
  @ApiOperation({ summary: 'Download the official candidate CV template from storage' })
  async downloadTemplate(@Res() res: Response) {
    try {
      const blob = await downloadFile(storageBuckets.templates, candidateCvTemplateStoragePath);
      const buffer = Buffer.from(await blob.arrayBuffer());
      res.type('application/msword');
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      res.setHeader('Content-Disposition', 'attachment; filename="RMS-CV-Template.doc"');
      return res.send(buffer);
    } catch (error) {
      this.logger.error(
        `Unable to download CV template from ${storageBuckets.templates}/${candidateCvTemplateStoragePath}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new NotFoundException('CV template is not available');
    }
  }

  @Get('candidate/:candidateId/latest')
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER, UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Get the latest CV for a candidate profile' })
  getLatestForCandidate(@Param('candidateId') candidateId: string) {
    return firstValueFrom(this.cvClient.send('cv.get_by_candidate', { candidateId }));
  }

  @Get('candidate/:candidateId/latest/file')
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER, UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Open or download the latest CV for a candidate profile' })
  async getLatestFileForCandidate(@Param('candidateId') candidateId: string, @Res() res: Response) {
    const cv = await firstValueFrom(this.cvClient.send('cv.get_by_candidate', { candidateId }));
    if (!cv?.filePath) {
      throw new NotFoundException('Candidate CV file is not available');
    }

    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-CV-Document-Id', cv.id);

    const storageLocation = parseSupabasePublicUrl(cv.filePath);
    if (storageLocation) {
      try {
        const blob = await downloadFile(storageLocation.bucket, storageLocation.path);
        const buffer = Buffer.from(await blob.arrayBuffer());
        res.type(blob.type || this.cvContentType(cv.fileName || cv.filePath));
        res.setHeader(
          'Content-Disposition',
          `inline; filename="${basename(cv.fileName || storageLocation.path)}"`,
        );
        res.send(buffer);
        return;
      } catch (error) {
        this.logger.warn(
          `Unable to download candidate CV ${cv.id} from storage bucket ${storageLocation.bucket}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        throw new NotFoundException('Candidate CV file was not found in storage');
      }
    }

    if (/^https?:\/\//i.test(cv.filePath)) {
      return res.redirect(cv.filePath);
    }

    return res.sendFile(cv.filePath, {
      headers: {
        'Content-Disposition': `inline; filename="${basename(cv.fileName || cv.filePath)}"`,
      },
    });
  }

  @Get()
  @ApiOperation({ summary: 'List CVs owned by the current candidate' })
  listMine(@CurrentUser('sub') userId: string) {
    return firstValueFrom(this.cvClient.send('cv.list_for_candidate', { userId }));
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a CV for the current candidate' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadMine(
    @CurrentUser() user: JwtPayload,
    @Body('parserPreference') parserPreference?: 'MODEL_VECTOR' | 'GEMINI_API',
    @UploadedFile()
    file?: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  ) {
    if (!file) {
      throw new BadRequestException('CV file is required');
    }

    let extension: '.pdf' | '.docx' | '.doc';
    try {
      extension = validateCvFileName(file.originalname).extension;
    } catch {
      throw new BadRequestException('Only PDF, DOCX, and DOC files are supported');
    }

    const userId = user.sub;
    const fileType = extension === '.docx' ? 'DOCX' : extension === '.doc' ? 'DOC' : 'PDF';
    const rawTextPromise = extractTextFromBuffer(file.buffer, fileType).catch((error) => {
      this.logger.warn(
        `Fast CV parse failed for ${file.originalname}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return '';
    });

    const bucket = storageBuckets.cvs;
    const candidateName = await this.getCandidateNameForStorage(userId, user.displayName);
    const path = buildCvStoragePath(userId, file.originalname, new Date(), candidateName);
    const storedFileName = basename(path);
    const uploadedPromise = uploadFile(bucket, path, file.buffer, {
      contentType: file.mimetype,
    }).catch((error) => {
      this.logger.error(
        `Failed to upload CV ${file.originalname} to storage (bucket: ${bucket}, path: ${path}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new BadRequestException('Failed to upload CV');
    });
    const [uploaded, rawText] = await Promise.all([uploadedPromise, rawTextPromise]);

    try {
      return await firstValueFrom(
        this.cvClient.send('cv.upload_candidate', {
          candidateId: userId,
          fileName: storedFileName,
          fileType,
          filePath: uploaded.publicUrl,
          rawText,
          parserPreference,
        }),
      );
    } catch (error) {
      await removeFile(uploaded.bucket, uploaded.path).catch(() => undefined);
      throw error;
    }
  }

  @Patch(':id/file')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Replace an uploaded CV owned by the current candidate' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async replaceMine(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body('parserPreference') parserPreference?: 'MODEL_VECTOR' | 'GEMINI_API',
    @UploadedFile()
    file?: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  ) {
    if (!file) {
      throw new BadRequestException('CV file is required');
    }

    let extension: '.pdf' | '.docx' | '.doc';
    try {
      extension = validateCvFileName(file.originalname).extension;
    } catch {
      throw new BadRequestException('Only PDF, DOCX, and DOC files are supported');
    }

    const userId = user.sub;
    const fileType = extension === '.docx' ? 'DOCX' : extension === '.doc' ? 'DOC' : 'PDF';
    const rawTextPromise = extractTextFromBuffer(file.buffer, fileType).catch((error) => {
      this.logger.warn(
        `Fast CV parse failed for updated ${file.originalname}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return '';
    });

    const bucket = storageBuckets.cvs;
    const candidateName = await this.getCandidateNameForStorage(userId, user.displayName);
    const path = buildCvStoragePath(userId, file.originalname, new Date(), candidateName);
    const storedFileName = basename(path);
    const uploadedPromise = uploadFile(bucket, path, file.buffer, {
      contentType: file.mimetype,
    }).catch((error) => {
      this.logger.error(
        `Failed to upload replacement CV ${file.originalname} to storage (bucket: ${bucket}, path: ${path}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new BadRequestException('Failed to upload replacement CV');
    });
    const [uploaded, rawText] = await Promise.all([uploadedPromise, rawTextPromise]);

    try {
      return await firstValueFrom(
        this.cvClient.send('cv.replace_for_candidate', {
          id,
          userId,
          fileName: storedFileName,
          fileType,
          filePath: uploaded.publicUrl,
          rawText,
          parserPreference,
        }),
      );
    } catch (error) {
      await removeFile(uploaded.bucket, uploaded.path).catch(() => undefined);
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a CV owned by the current candidate' })
  deleteMine(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return firstValueFrom(this.cvClient.send('cv.delete_for_candidate', { id, userId }));
  }
}
