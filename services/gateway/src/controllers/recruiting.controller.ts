import { Controller, Get, Post, Patch, Body, Param, Query, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom } from 'rxjs';

export class CreateTaskPlanDto {
  @ApiProperty({
    enum: ['JOB_POSTING', 'CV_COLLECTION', 'CV_SCREENING', 'INTERVIEW_COORDINATION'],
    example: 'CV_SCREENING',
  })
  taskType!: string;

  @ApiProperty({ example: 'uuid-of-hr-staff', description: 'UUID of the HR staff member to assign' })
  assignedToId!: string;

  @ApiProperty({ example: '2026-07-01', description: 'Task start date (ISO date). Must be within plan window.' })
  startDate!: string;

  @ApiProperty({ example: '2026-08-15', description: 'Task deadline / end date (ISO date). Must be within plan window.' })
  endDate!: string;

  @ApiProperty({ required: false, example: 'Screen all CVs and shortlist top 10 candidates.' })
  notes?: string;
}

export class UpdateTaskPlanDto {
  @ApiProperty({ required: false, enum: ['JOB_POSTING', 'CV_COLLECTION', 'CV_SCREENING', 'INTERVIEW_COORDINATION'] })
  taskType?: string;

  @ApiProperty({ required: false })
  assignedToId?: string;

  @ApiProperty({ required: false, example: '2026-07-05' })
  startDate?: string;

  @ApiProperty({ required: false, example: '2026-08-20' })
  endDate?: string;

  @ApiProperty({ required: false })
  notes?: string;
}

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] })
  status!: string;
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
<<<<<<< Updated upstream
=======

  // ─── Recruitment Requests ─────────────────────────────────────────

  @Post('recruitment-requests')
  @Roles(UserRole.DEPARTMENT_HEAD)
  @ApiOperation({
    summary: 'Create a recruitment request (DRAFT)',
    description: 'Creates a new hiring request in DRAFT status. The requestedById and organizationId are taken from the JWT.',
  })
  @ApiForbiddenResponse({ description: 'Requires DEPARTMENT_HEAD role' })
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
  @Roles(UserRole.DEPARTMENT_HEAD)
  @ApiOperation({
    summary: 'Update a recruitment request',
    description: 'Updates a DRAFT or REVISION_REQUESTED request. Only the owning DEPARTMENT_HEAD should call this.',
  })
  @ApiForbiddenResponse({ description: 'Requires DEPARTMENT_HEAD role' })
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
  @Roles(UserRole.DEPARTMENT_HEAD)
  @ApiOperation({
    summary: 'Submit a recruitment request for approval',
    description: 'Transitions the request from DRAFT (or REVISION_REQUESTED) → PENDING_APPROVAL at level 1.',
  })
  @ApiForbiddenResponse({ description: 'Requires DEPARTMENT_HEAD role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  submitRecruitmentRequest(@Param('id') id: string) {
    return firstValueFrom(this.recruitingClient.send('recruitment-requests.submit', { id }));
  }

  @Post('recruitment-requests/:id/forward-to-boss')
  @Roles(UserRole.HIRING_MANAGER)
  @ApiOperation({
    summary: 'Forward a recruitment request to the next approval level',
    description: 'Increments the currentLevel on a PENDING_APPROVAL request (HR → Boss).',
  })
  @ApiForbiddenResponse({ description: 'Requires HIRING_MANAGER role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  forwardRecruitmentRequestToBoss(@Param('id') id: string) {
    return firstValueFrom(
      this.recruitingClient.send('recruitment-requests.forward-to-boss', { id }),
    );
  }

  @Post('recruitment-requests/:id/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Approve a recruitment request',
    description: 'Sets the request status to APPROVED and records an approval entry. Requires ADMIN role.',
  })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
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
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Reject or request revision of a recruitment request',
    description: 'Sets status to REJECTED or REVISION_REQUESTED depending on the decision field. Requires ADMIN role.',
  })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
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
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.HIRING_MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get audit trail for a recruitment request',
    description: 'Returns all approval/rejection entries for the request, ordered chronologically.',
  })
  @ApiForbiddenResponse({ description: 'Requires DEPARTMENT_HEAD, HIRING_MANAGER, or ADMIN role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  getRecruitmentRequestLogs(@Param('id') id: string) {
    return firstValueFrom(this.recruitingClient.send('recruitment-requests.logs', { id }));
  }

  @Get('recruitment-requests/:id/tracking')
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.HIRING_MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get tracking dashboard data for a recruitment request',
    description: 'Returns status, approval progress, and key timestamps for the request.',
  })
  @ApiForbiddenResponse({ description: 'Requires DEPARTMENT_HEAD, HIRING_MANAGER, or ADMIN role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  getRecruitmentRequestTracking(@Param('id') id: string) {
    return firstValueFrom(this.recruitingClient.send('recruitment-requests.tracking', { id }));
  }

  // ─── Overall Plan ─────────────────────────────────────────────────

  @Post('recruitment-requests/:id/plan')
  @Roles(UserRole.HIRING_MANAGER)
  @ApiOperation({
    summary: 'Create an overall recruitment plan for an APPROVED request',
    description:
      'Creates an OverallPlan in PENDING_APPROVAL status and transitions the HiringRequest to PLANNING. ' +
      'Validates: request must be APPROVED, endDate > startDate, no existing plan for this request.',
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

  @Get('recruitment-requests/:id/plan')
  @Roles(UserRole.HIRING_MANAGER, UserRole.ADMIN, UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Get the overall plan for a recruitment request' })
  @ApiForbiddenResponse({ description: 'Requires HIRING_MANAGER, ADMIN, or DEPARTMENT_HEAD role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  getOverallPlanByRequest(@Param('id') hiringRequestId: string) {
    return firstValueFrom(
      this.recruitingClient.send('overall-plan.getByRequest', { hiringRequestId }),
    );
  }

  // ─── Task Plans ───────────────────────────────────────────────────

  @Post('recruitment-requests/:id/plan/tasks')
  @Roles(UserRole.HIRING_MANAGER)
  @ApiOperation({
    summary: 'Add a task to the recruitment plan',
    description:
      'Creates a TaskPlan within the OverallPlan window. ' +
      'Validates: startDate ≥ plan.startDate, endDate ≤ plan.endDate, endDate > startDate. ' +
      'Notifies the assignee on creation.',
  })
  @ApiForbiddenResponse({ description: 'Requires HIRING_MANAGER role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  @ApiBody({ type: CreateTaskPlanDto })
  createTaskPlan(
    @Param('id') hiringRequestId: string,
    @Body() body: CreateTaskPlanDto,
  ) {
    // Resolve overallPlanId from the hiring request on the microservice side
    return firstValueFrom(
      this.recruitingClient.send('task-plan.createByRequest', {
        hiringRequestId,
        ...body,
      }),
    );
  }

  @Get('recruitment-requests/:id/plan/tasks')
  @Roles(UserRole.HIRING_MANAGER, UserRole.ADMIN, UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'List all tasks for a recruitment plan' })
  @ApiForbiddenResponse({ description: 'Requires HIRING_MANAGER, ADMIN, or DEPARTMENT_HEAD role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  listTaskPlansByRequest(@Param('id') hiringRequestId: string) {
    return firstValueFrom(
      this.recruitingClient.send('task-plan.listByRequest', { hiringRequestId }),
    );
  }

  @Patch('plan-tasks/:taskId')
  @Roles(UserRole.HIRING_MANAGER)
  @ApiOperation({ summary: 'Update a task plan (dates, assignee, notes)' })
  @ApiForbiddenResponse({ description: 'Requires HIRING_MANAGER role' })
  @ApiParam({ name: 'taskId', description: 'TaskPlan UUID' })
  @ApiBody({ type: UpdateTaskPlanDto })
  updateTaskPlan(@Param('taskId') id: string, @Body() body: UpdateTaskPlanDto) {
    return firstValueFrom(this.recruitingClient.send('task-plan.update', { id, ...body }));
  }

  @Patch('plan-tasks/:taskId/status')
  @Roles(UserRole.HIRING_MANAGER)
  @ApiOperation({ summary: 'Update task status (PENDING → IN_PROGRESS → COMPLETED)' })
  @ApiForbiddenResponse({ description: 'Requires HIRING_MANAGER role' })
  @ApiParam({ name: 'taskId', description: 'TaskPlan UUID' })
  @ApiBody({ type: UpdateTaskStatusDto })
  updateTaskPlanStatus(@Param('taskId') id: string, @Body() body: UpdateTaskStatusDto) {
    return firstValueFrom(this.recruitingClient.send('task-plan.updateStatus', { id, status: body.status }));
  }
>>>>>>> Stashed changes
}
