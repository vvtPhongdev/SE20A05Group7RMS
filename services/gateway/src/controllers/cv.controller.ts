import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  NotFoundException,
  Param,
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
  downloadFile,
  parseSupabasePublicUrl,
  removeFile,
  storageBuckets,
  uploadFile,
  validateCvFileName,
} from '@wr/storage';
import { firstValueFrom } from 'rxjs';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
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

  constructor(@Inject(SERVICE_TOKENS.CV) private readonly cvClient: ClientProxy) {}

  private cvContentType(fileName: string) {
    const extension = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
    if (extension === '.pdf') return 'application/pdf';
    if (extension === '.docx') {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    if (extension === '.doc') return 'application/msword';
    return 'application/octet-stream';
  }

  @Get('candidate/:candidateId/latest')
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER, UserRole.HR_RECRUITER, UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Get the latest CV for a candidate profile' })
  getLatestForCandidate(@Param('candidateId') candidateId: string) {
    return firstValueFrom(this.cvClient.send('cv.get_by_candidate', { candidateId }));
  }

  @Get('candidate/:candidateId/latest/file')
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER, UserRole.HR_RECRUITER, UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Open or download the latest CV for a candidate profile' })
  async getLatestFileForCandidate(@Param('candidateId') candidateId: string, @Res() res: Response) {
    const cv = await firstValueFrom(this.cvClient.send('cv.get_by_candidate', { candidateId }));
    if (!cv?.filePath) {
      throw new NotFoundException('Candidate CV file is not available');
    }

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
    @CurrentUser('sub') userId: string,
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
    const path = buildCvStoragePath(userId, file.originalname);
    const uploadedPromise = uploadFile(bucket, path, file.buffer, {
      contentType: file.mimetype,
    }).catch(() => {
      throw new BadRequestException('Failed to upload CV');
    });
    const [uploaded, rawText] = await Promise.all([uploadedPromise, rawTextPromise]);

    try {
      return await firstValueFrom(
        this.cvClient.send('cv.upload_candidate', {
          candidateId: userId,
          fileName: file.originalname,
          fileType,
          filePath: uploaded.publicUrl,
          rawText,
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
