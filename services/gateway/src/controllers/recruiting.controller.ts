import { Controller, Get, Post, Patch, Body, Param, Query, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom } from 'rxjs';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@wr/contracts';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IsUUID, IsString, IsOptional, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateJobPostingDto {
  @ApiProperty({ example: 'uuid-of-recruitment-request', description: 'Recruitment Request ID' })
  @IsUUID()
  @IsNotEmpty()
  requestId!: string;

  @ApiProperty({ example: 'Senior TypeScript Developer', required: false, description: 'Custom Job Title' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiProperty({ example: 'Looking for a developer...', required: false, description: 'Custom Job Description' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiProperty({ required: false, description: 'Custom Requirements (JSON)' })
  @IsOptional()
  requirements?: any;

  @ApiProperty({ example: 'PUBLIC', enum: ['PUBLIC', 'PRIVATE'], default: 'PRIVATE', description: 'Visibility status' })
  @IsOptional()
  @IsString()
  visibility?: any;

  @ApiProperty({ example: '2026-07-01T00:00:00.000Z', required: false, description: 'Expire Date' })
  @IsOptional()
  @IsDateString()
  expireDate?: string;
}

export class UpdateJobPostingDto {
  @ApiProperty({ example: 'Senior TypeScript Developer', required: false, description: 'Custom Job Title' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiProperty({ example: 'Looking for a developer...', required: false, description: 'Custom Job Description' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiProperty({ required: false, description: 'Custom Requirements (JSON)' })
  @IsOptional()
  requirements?: any;

  @ApiProperty({ example: 'PUBLIC', enum: ['PUBLIC', 'PRIVATE'], description: 'Visibility status' })
  @IsOptional()
  @IsString()
  visibility?: any;

  @ApiProperty({ example: '2026-07-01T00:00:00.000Z', required: false, description: 'Expire Date' })
  @IsOptional()
  @IsDateString()
  expireDate?: string;

  @ApiProperty({ example: 'PUBLISHED', description: 'Job Posting Status' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateOverallPlanDto {
  @ApiProperty({ example: '2026-07-01', description: 'Campaign start date (ISO date)' })
  startDate!: string;

  @ApiProperty({ example: '2026-09-30', description: 'Campaign end date (ISO date). Must be after startDate.' })
  endDate!: string;
}

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


  // ─── Job Postings ────────────────────────────────────────────────

  @Post('job-postings')
  @Roles(UserRole.HR_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create job posting from approved recruitment request' })
  createJobPosting(@Body() body: CreateJobPostingDto) {
    return firstValueFrom(this.recruitingClient.send('recruiting.job_posting.create', body));
  }

  @Get('job-postings')
  @ApiOperation({ summary: 'List all job postings' })
  listJobPostings(@Query() query: any, @CurrentUser() user?: any) {
    return firstValueFrom(
      this.recruitingClient.send('recruiting.job_posting.list', {
        ...query,
        userRole: user?.role,
        userDeptId: user?.departmentId,
      }),
    );
  }

  @Get('job-postings/:id')
  @ApiOperation({ summary: 'Get job posting by ID' })
  getJobPosting(@Param('id') id: string, @CurrentUser() user?: any) {
    return firstValueFrom(
      this.recruitingClient.send('recruiting.job_posting.get', {
        id,
        userRole: user?.role,
        userDeptId: user?.departmentId,
      }),
    );
  }

  @Patch('job-postings/:id')
  @Roles(UserRole.HR_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update job posting details' })
  updateJobPosting(@Param('id') id: string, @Body() body: UpdateJobPostingDto) {
    return firstValueFrom(this.recruitingClient.send('recruiting.job_posting.update', { id, ...body }));
  }

  @Post('job-postings/:id/publish')
  @Roles(UserRole.HR_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Publish job posting' })
  publishJobPosting(@Param('id') id: string) {
    return firstValueFrom(this.recruitingClient.send('recruiting.job_posting.publish', { id }));
  }

  @Post('job-postings/:id/close')
  @Roles(UserRole.HR_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Close job posting' })
  closeJobPosting(@Param('id') id: string) {
    return firstValueFrom(this.recruitingClient.send('recruiting.job_posting.close', { id }));
  }

  // ─── Reports ─────────────────────────────────────────────────────

  @Get('reports/annual')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get annual recruitment report' })
  getAnnualReport(@Query('year') year?: string) {
    const parsedYear = year ? parseInt(year, 10) : new Date().getFullYear();
    return firstValueFrom(this.recruitingClient.send('recruiting.annual_report', { year: parsedYear }));
  }

  @Get('reports/department/:id')
  @Roles(UserRole.ADMIN, UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Get department recruitment report' })
  getDepartmentReport(@Param('id') id: string, @CurrentUser() user: any) {
    return firstValueFrom(this.recruitingClient.send('recruiting.department_report', { id, userId: user.sub, role: user.role }));
  }

  @Get('reports/time-to-hire')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get time-to-hire metrics report' })
  getTimeToHireReport() {
    return firstValueFrom(this.recruitingClient.send('recruiting.time_to_hire', {}));
  }

  @Get('reports/pipeline')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  @ApiOperation({ summary: 'Get recruitment pipeline overview' })
  getPipelineOverview() {
    return firstValueFrom(this.recruitingClient.send('recruiting.pipeline_overview', {}));
  }

  // ─── Overall Plan ─────────────────────────────────────────────────

  @Post('recruiting/requests/:id/plan')
  @Roles(UserRole.HIRING_MANAGER)
  @ApiOperation({
    summary: 'Create an overall recruitment plan for an APPROVED request',
    description: 'Validates: request must be APPROVED, endDate > startDate, no existing plan. Transitions request to PLANNING.',
  })
  @ApiForbiddenResponse({ description: 'Requires HIRING_MANAGER role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  @ApiBody({ type: CreateOverallPlanDto })
  createOverallPlan(
    @Param('id') hiringRequestId: string,
    @Body() body: CreateOverallPlanDto,
    @CurrentUser('sub') createdById: string,
  ) {
    return firstValueFrom(
      this.recruitingClient.send('overall-plan.create', {
        hiringRequestId,
        createdById,
        startDate: body.startDate,
        endDate: body.endDate,
      }),
    );
  }

  @Get('recruiting/requests/:id/plan')
  @Roles(UserRole.HIRING_MANAGER, UserRole.ADMIN, UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Get the overall plan (with all tasks) for a recruitment request' })
  @ApiForbiddenResponse({ description: 'Requires HIRING_MANAGER, ADMIN, or DEPARTMENT_HEAD role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  getOverallPlanByRequest(@Param('id') hiringRequestId: string) {
    return firstValueFrom(this.recruitingClient.send('overall-plan.getByRequest', { hiringRequestId }));
  }
}
