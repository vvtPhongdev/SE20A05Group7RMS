import { Controller, Get, Post, Patch, Body, Param, Query, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiBody, ApiProperty } from '@nestjs/swagger';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom } from 'rxjs';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';

// ─── Recruitment-Request DTOs (for Swagger) ──────────────────────────────────

export class BudgetRangeDto {
  @ApiProperty({ example: 10000000 })
  min!: number;

  @ApiProperty({ example: 20000000 })
  max!: number;

  @ApiProperty({ example: 'VND', minLength: 3, maxLength: 3 })
  currency!: string;
}

export class CreateRecruitmentRequestDto {
  @ApiProperty({ example: 'uuid-of-department' })
  departmentId!: string;

  @ApiProperty({ example: 'uuid-of-organization' })
  organizationId!: string;

  @ApiProperty({ example: 'Senior Backend Engineer' })
  title!: string;

  @ApiProperty({ required: false, example: 'We need a senior engineer for the platform team.' })
  description?: string;

  @ApiProperty({ required: false, example: 'Increased workload from Q3 roadmap.' })
  justification?: string;

  @ApiProperty({ required: false, example: 2 })
  headcount?: number;

  @ApiProperty({ required: false, enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'], example: 'NORMAL' })
  priority?: string;

  @ApiProperty({ required: false, enum: ['ONSITE', 'REMOTE', 'HYBRID'], example: 'HYBRID' })
  workMode?: string;

  @ApiProperty({ required: false, example: 'Ho Chi Minh City' })
  location?: string;

  @ApiProperty({ required: false, type: BudgetRangeDto })
  budgetRange?: BudgetRangeDto;

  @ApiProperty({ required: false, example: '2026-09-01T00:00:00.000Z' })
  targetStartDate?: string;
}

export class UpdateRecruitmentRequestDto {
  @ApiProperty({ required: false, example: 'Senior Backend Engineer' })
  title?: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  justification?: string;

  @ApiProperty({ required: false, example: 2 })
  headcount?: number;

  @ApiProperty({ required: false, enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] })
  priority?: string;

  @ApiProperty({ required: false, enum: ['ONSITE', 'REMOTE', 'HYBRID'] })
  workMode?: string;

  @ApiProperty({ required: false })
  location?: string;

  @ApiProperty({ required: false, type: BudgetRangeDto })
  budgetRange?: BudgetRangeDto;

  @ApiProperty({ required: false })
  targetStartDate?: string;
}

export class ApproveRejectDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED', 'REVISION_REQUESTED'] })
  decision!: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';

  @ApiProperty({ required: false, example: 'Approved. Please proceed.' })
  comments?: string;
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

  // ─── Recruitment Requests ─────────────────────────────────────────

  @Post('recruitment-requests')
  @ApiOperation({
    summary: 'Create a recruitment request (DRAFT)',
    description: 'Creates a new hiring request in DRAFT status. The requestedById and organizationId are taken from the JWT.',
  })
  createRecruitmentRequest(
    @Body() body: CreateRecruitmentRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return firstValueFrom(
      this.recruitingClient.send('recruitment-requests.create', {
        ...body,
        requestedById: user.sub,
        organizationId: body.organizationId ?? user.organizationId,
      }),
    );
  }

  @Get('recruitment-requests')
  @ApiOperation({
    summary: 'List recruitment requests',
    description: 'Returns a paginated list of hiring requests. Results are filterable by status, departmentId, and requestedById.',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'] })
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  @ApiQuery({ name: 'organizationId', required: false, type: String })
  @ApiQuery({ name: 'requestedById', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  listRecruitmentRequests(@Query() query: any) {
    return firstValueFrom(this.recruitingClient.send('recruitment-requests.list', query));
  }

  @Get('recruitment-requests/:id')
  @ApiOperation({ summary: 'Get recruitment request details' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  getRecruitmentRequest(@Param('id') id: string) {
    return firstValueFrom(this.recruitingClient.send('recruitment-requests.get', { id }));
  }

  @Patch('recruitment-requests/:id')
  @ApiOperation({
    summary: 'Update a recruitment request',
    description: 'Updates a DRAFT or REVISION_REQUESTED request. Only the owning DEPARTMENT_HEAD should call this.',
  })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  updateRecruitmentRequest(
    @Param('id') id: string,
    @Body() body: UpdateRecruitmentRequestDto,
  ) {
    return firstValueFrom(
      this.recruitingClient.send('recruitment-requests.update', { id, ...body }),
    );
  }

  @Post('recruitment-requests/:id/submit')
  @ApiOperation({
    summary: 'Submit a recruitment request for approval',
    description: 'Transitions the request from DRAFT (or REVISION_REQUESTED) → PENDING_APPROVAL at level 1.',
  })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  submitRecruitmentRequest(@Param('id') id: string) {
    return firstValueFrom(this.recruitingClient.send('recruitment-requests.submit', { id }));
  }

  @Post('recruitment-requests/:id/forward-to-boss')
  @ApiOperation({
    summary: 'Forward a recruitment request to the next approval level',
    description: 'Increments the currentLevel on a PENDING_APPROVAL request (HR → Boss).',
  })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  forwardRecruitmentRequestToBoss(@Param('id') id: string) {
    return firstValueFrom(
      this.recruitingClient.send('recruitment-requests.forward-to-boss', { id }),
    );
  }

  @Post('recruitment-requests/:id/approve')
  @ApiOperation({
    summary: 'Approve a recruitment request',
    description: 'Sets the request status to APPROVED and records an approval entry. Requires ADMIN role.',
  })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  @ApiBody({ type: ApproveRejectDto })
  approveRecruitmentRequest(
    @Param('id') id: string,
    @Body() body: ApproveRejectDto,
    @CurrentUser('sub') actorId: string,
  ) {
    return firstValueFrom(
      this.recruitingClient.send('recruitment-requests.approve', {
        id,
        actorId,
        comments: body.comments,
      }),
    );
  }

  @Post('recruitment-requests/:id/reject')
  @ApiOperation({
    summary: 'Reject or request revision of a recruitment request',
    description: 'Sets status to REJECTED or REVISION_REQUESTED depending on the decision field. Requires ADMIN role.',
  })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  @ApiBody({ type: ApproveRejectDto })
  rejectRecruitmentRequest(
    @Param('id') id: string,
    @Body() body: ApproveRejectDto,
    @CurrentUser('sub') actorId: string,
  ) {
    return firstValueFrom(
      this.recruitingClient.send('recruitment-requests.reject', {
        id,
        actorId,
        decision: body.decision,
        comments: body.comments,
      }),
    );
  }

  @Get('recruitment-requests/:id/logs')
  @ApiOperation({
    summary: 'Get audit trail for a recruitment request',
    description: 'Returns all approval/rejection entries for the request, ordered chronologically.',
  })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  getRecruitmentRequestLogs(@Param('id') id: string) {
    return firstValueFrom(this.recruitingClient.send('recruitment-requests.logs', { id }));
  }

  @Get('recruitment-requests/:id/tracking')
  @ApiOperation({
    summary: 'Get tracking dashboard data for a recruitment request',
    description: 'Returns status, approval progress, and key timestamps for the request.',
  })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  getRecruitmentRequestTracking(@Param('id') id: string) {
    return firstValueFrom(this.recruitingClient.send('recruitment-requests.tracking', { id }));
  }
}
