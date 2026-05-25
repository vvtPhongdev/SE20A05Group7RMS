import { Controller, Get, Post, Patch, Body, Param, Query, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom } from 'rxjs';

/**
 * Thin proxy controller for Recruiting service (roles, applications, invites, evaluations).
 */
@ApiTags('Recruiting')
@ApiBearerAuth()
@Controller()
export class RecruitingController {
  constructor(
    @Inject(SERVICE_TOKENS.RECRUITING) private readonly recruitingClient: ClientProxy,
  ) {}

  // ─── Roles ───────────────────────────────────────────────────────

  @Post('roles')
  @ApiOperation({ summary: 'Create a role / JD' })
  createRole(@Body() body: any) {
    return firstValueFrom(this.recruitingClient.send('roles.create', body));
  }

  @Get('roles')
  @ApiOperation({ summary: 'List roles' })
  listRoles(@Query() query: any) {
    return firstValueFrom(this.recruitingClient.send('roles.list', query));
  }

  @Get('roles/:id')
  @ApiOperation({ summary: 'Get role by ID' })
  getRole(@Param('id') id: string) {
    return firstValueFrom(this.recruitingClient.send('roles.get', { id }));
  }

  // ─── Applications ────────────────────────────────────────────────

  @Post('applications')
  @ApiOperation({ summary: 'Apply to a role' })
  createApplication(@Body() body: any) {
    return firstValueFrom(this.recruitingClient.send('applications.create', body));
  }

  @Get('applications')
  @ApiOperation({ summary: 'List applications' })
  listApplications(@Query() query: any) {
    return firstValueFrom(this.recruitingClient.send('applications.list', query));
  }

  @Get('applications/:id')
  @ApiOperation({ summary: 'Get application by ID' })
  getApplication(@Param('id') id: string) {
    return firstValueFrom(this.recruitingClient.send('applications.get', { id }));
  }

  @Patch('applications/:id/status')
  @ApiOperation({ summary: 'Update application status' })
  updateApplicationStatus(@Param('id') id: string, @Body() body: any) {
    return firstValueFrom(this.recruitingClient.send('applications.updateStatus', { id, ...body }));
  }

  // ─── Invites ─────────────────────────────────────────────────────

  @Post('invites')
  @ApiOperation({ summary: 'Send invite to candidate' })
  createInvite(@Body() body: any) {
    return firstValueFrom(this.recruitingClient.send('invites.create', body));
  }

  @Get('invites')
  @ApiOperation({ summary: 'List invites' })
  listInvites(@Query() query: any) {
    return firstValueFrom(this.recruitingClient.send('invites.list', query));
  }

  // ─── Evaluations ─────────────────────────────────────────────────

  @Post('evaluations')
  @ApiOperation({ summary: 'Trigger evaluation run' })
  createEvaluation(@Body() body: any) {
    return firstValueFrom(this.recruitingClient.send('evaluations.create', body));
  }

  @Get('evaluations/:id')
  @ApiOperation({ summary: 'Get evaluation result' })
  getEvaluation(@Param('id') id: string) {
    return firstValueFrom(this.recruitingClient.send('evaluations.get', { id }));
  }

  // ─── Talent Search ────────────────────────────────────────────────

  @Post('talent/search')
  @ApiOperation({ summary: 'Search candidates by skills / role (knowledge graph + vector)' })
  searchTalent(@Body() body: any) {
    return firstValueFrom(this.recruitingClient.send('talent.search', body));
  }

  @Get('talent/expand')
  @ApiOperation({ summary: 'Expand a skill query via the knowledge graph' })
  expandQuery(@Query('q') query: string) {
    return firstValueFrom(this.recruitingClient.send('talent.expand', { query }));
  }
}
