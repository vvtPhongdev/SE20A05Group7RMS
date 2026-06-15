import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@wr/contracts';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { extname, resolve } from 'path';
import { firstValueFrom } from 'rxjs';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { SERVICE_TOKENS } from '../constants';

const MAX_CV_FILE_SIZE = 10 * 1024 * 1024;

@ApiTags('Candidate CVs')
@ApiBearerAuth()
@Roles(UserRole.CANDIDATE)
@Controller('candidate/cvs')
export class CvController {
  constructor(@Inject(SERVICE_TOKENS.CV) private readonly cvClient: ClientProxy) {}

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

    const extension = extname(file.originalname).toLowerCase();
    if (!['.pdf', '.docx'].includes(extension)) {
      throw new BadRequestException('Only PDF and DOCX files are supported');
    }
    if (file.size > MAX_CV_FILE_SIZE) {
      throw new BadRequestException('CV file must be 10MB or smaller');
    }

    const uploadDirectory = resolve(process.cwd(), 'uploads', 'cv');
    const filePath = resolve(uploadDirectory, `${randomUUID()}${extension}`);
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(filePath, file.buffer);

    try {
      return await firstValueFrom(
        this.cvClient.send('cv.upload_candidate', {
          candidateId: userId,
          fileName: file.originalname,
          fileType: extension === '.docx' ? 'DOCX' : 'PDF',
          filePath,
        }),
      );
    } catch (error) {
      await unlink(filePath).catch(() => undefined);
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a CV owned by the current candidate' })
  deleteMine(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return firstValueFrom(this.cvClient.send('cv.delete_for_candidate', { id, userId }));
  }
}
