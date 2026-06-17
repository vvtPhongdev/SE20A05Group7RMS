import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Inject,
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
import { UserRole } from '@wr/contracts';
import {
  buildCvStoragePath,
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
  constructor(@Inject(SERVICE_TOKENS.CV) private readonly cvClient: ClientProxy) {}

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

    let extension: '.pdf' | '.docx';
    try {
      extension = validateCvFileName(file.originalname).extension;
    } catch {
      throw new BadRequestException('Only PDF and DOCX files are supported');
    }

    const bucket = storageBuckets.cvs;
    const path = buildCvStoragePath(userId, file.originalname);
    const uploaded = await uploadFile(bucket, path, file.buffer, {
      contentType: file.mimetype,
    }).catch(() => {
      throw new BadRequestException('Failed to upload CV');
    });

    try {
      return await firstValueFrom(
        this.cvClient.send('cv.upload_candidate', {
          candidateId: userId,
          fileName: file.originalname,
          fileType: extension === '.docx' ? 'DOCX' : 'PDF',
          filePath: uploaded.publicUrl,
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
