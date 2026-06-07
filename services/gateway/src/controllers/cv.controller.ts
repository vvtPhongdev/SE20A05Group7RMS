import { Controller, Get, Post, Body, Param, Inject, UseInterceptors, UploadedFile, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom } from 'rxjs';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@wr/contracts';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer');
const diskStorage = multer.diskStorage;

@ApiTags('CV')
@ApiBearerAuth()
@Controller('candidates')
export class CvController {
  constructor(
    @Inject(SERVICE_TOKENS.CV) private readonly cvClient: ClientProxy,
  ) {}

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
}
