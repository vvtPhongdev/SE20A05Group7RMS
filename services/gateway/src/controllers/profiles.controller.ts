import { Controller, Get, Post, Patch, Body, Param, Query, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom } from 'rxjs';

/**
 * Thin proxy controller for Profiles service (candidate profiles, documents, evidence).
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
  @ApiOperation({ summary: 'Get candidate profile' })
  getProfile(@Param('id') id: string) {
    return firstValueFrom(this.profilesClient.send('profiles.get', { id }));
  }

  @Patch('candidate-profiles/:id')
  @ApiOperation({ summary: 'Update candidate profile' })
  updateProfile(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(this.profilesClient.send('profiles.update', { id, ...body }));
  }

  // ─── Documents ───────────────────────────────────────────────────

  @Post('documents')
  @ApiOperation({ summary: 'Upload a document (CV/JD)' })
  uploadDocument(@Body() body: any) {
    return firstValueFrom(this.profilesClient.send('documents.upload', body));
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
