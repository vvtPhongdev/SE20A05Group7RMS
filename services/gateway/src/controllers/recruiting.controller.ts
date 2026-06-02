import { Controller, Get, Post, Patch, Body, Param, Query, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody, ApiProperty, ApiForbiddenResponse } from '@nestjs/swagger';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom } from 'rxjs';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@wr/contracts';

// ─── Recruitment Request DTOs ─────────────────────────────────────────────────

export class CreateHiringRequestDto {
  @ApiProperty({ example: 'uuid-of-department' })
  departmentId!: string;

  @ApiProperty({ example: 'Senior Backend Engineer' })
  title!: string;

  @ApiProperty({ required: false, description: 'Full job description' })
  description?: string;

  @ApiProperty({ required: false, description: 'Business justification for the hire' })
  justification?: string;

  @ApiProperty({ required: false, default: 1, description: 'Number of open positions' })
  headcount?: number;

  @ApiProperty({ required: false, enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'], default: 'NORMAL' })
  priority?: string;

  @ApiProperty({ required: false, enum: ['ONSITE', 'REMOTE', 'HYBRID'] })
  workMode?: string;

  @ApiProperty({ required: false })
  location?: string;
}

export class UpdateHiringRequestDto {
  @ApiProperty({ required: false })
  title?: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  justification?: string;

  @ApiProperty({ required: false })
  headcount?: number;

  @ApiProperty({ required: false, enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] })
  priority?: string;

  @ApiProperty({ required: false, enum: ['ONSITE', 'REMOTE', 'HYBRID'] })
  workMode?: string;

  @ApiProperty({ required: false })
  location?: string;
}

export class ApproveRequestDto {
  @ApiProperty({ required: false, description: 'Optional comments for the approval' })
  comments?: string;
}

export class RejectRequestDto {
  @ApiProperty({ description: 'Mandatory rejection reason, visible to Department Head' })
  reason!: string;
}

export class RevisionRequestDto {
  @ApiProperty({ description: 'Mandatory revision feedback, visible to Department Head' })
  feedback!: string;
}

// ─── Plan DTOs ────────────────────────────────────────────────────────────────

export class CreateOverallPlanDto {
  @ApiProperty({ example: '2026-07-01', description: 'Campaign start date (ISO date)' })
  startDate!: string;

  @ApiProperty({ example: '2026-09-30', description: 'Campaign end date (ISO date). Must be after startDate.' })
  endDate!: string;
}

export class RejectPlanDto {
  @ApiProperty({ description: 'Mandatory reason for rejection / revision request' })
  reason!: string;
}

export class CreateTaskPlanDto {
  @ApiProperty({ enum: ['JOB_POSTING', 'CV_COLLECTION', 'CV_SCREENING', 'INTERVIEW_COORDINATION'], example: 'CV_SCREENING' })
  taskType!: string;

  @ApiProperty({ example: 'uuid-of-hr-staff' })
  assignedToId!: string;

  @ApiProperty({ example: '2026-07-01', description: 'Task start date (ISO date). Must be within plan window.' })
  startDate!: string;

  @ApiProperty({ example: '2026-08-15', description: 'Task deadline (ISO date). Must be within plan window.' })
  endDate!: string;

  @ApiProperty({ required: false })
  notes?: string;
}

export class UpdateTaskPlanDto {
  @ApiProperty({ required: false, enum: ['JOB_POSTING', 'CV_COLLECTION', 'CV_SCREENING', 'INTERVIEW_COORDINATION'] })
  taskType?: string;

  @ApiProperty({ required: false })
  assignedToId?: string;

  @ApiProperty({ required: false })
  startDate?: string;

  @ApiProperty({ required: false })
  endDate?: string;

  @ApiProperty({ required: false })
  notes?: string;
}

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] })
  status!: string;
}

/**
 * Thin proxy controller for Recruiting service (roles, applications, invites, evaluations, plans).
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

  // ─── Recruitment Requests (T-028 / T-029) ────────────────────────

  @Post('recruitment-requests')
  @Roles(UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: '[DEPT_HEAD] Create a recruitment request (starts as DRAFT). FR-02.' })
  @ApiForbiddenResponse({ description: 'Requires DEPARTMENT_HEAD role' })
  @ApiBody({ type: CreateHiringRequestDto })
  createHiringRequest(
    @Body() body: CreateHiringRequestDto,
    @CurrentUser('sub') requestedById: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return firstValueFrom(
      this.recruitingClient.send('hiring-requests.create', { ...body, requestedById, organizationId }),
    );
  }

  @Get('recruitment-requests')
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.HIRING_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List recruitment requests (role-filtered). FR-02.' })
  @ApiForbiddenResponse({ description: 'Requires DEPARTMENT_HEAD, HIRING_MANAGER, or ADMIN role' })
  listHiringRequests(
    @Query('status') status: string | undefined,
    @Query('departmentId') departmentId: string | undefined,
    @Query('page') page: string | undefined,
    @CurrentUser('sub') actorId: string,
    @CurrentUser('role') actorRole: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return firstValueFrom(
      this.recruitingClient.send('hiring-requests.list', {
        actorId,
        actorRole,
        organizationId,
        status,
        departmentId,
        page: page ? parseInt(page, 10) : 1,
      }),
    );
  }

  @Get('recruitment-requests/:id')
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.HIRING_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a single recruitment request with approvals and logs. FR-02.' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  getHiringRequest(@Param('id') id: string) {
    return firstValueFrom(this.recruitingClient.send('hiring-requests.get', { id }));
  }

  @Patch('recruitment-requests/:id')
  @Roles(UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: '[DEPT_HEAD] Update a DRAFT recruitment request. FR-02.' })
  @ApiForbiddenResponse({ description: 'Requires DEPARTMENT_HEAD role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  @ApiBody({ type: UpdateHiringRequestDto })
  updateHiringRequest(
    @Param('id') id: string,
    @Body() body: UpdateHiringRequestDto,
    @CurrentUser('sub') actorId: string,
  ) {
    return firstValueFrom(this.recruitingClient.send('hiring-requests.update', { id, actorId, ...body }));
  }

  @Post('recruitment-requests/:id/submit')
  @Roles(UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: '[DEPT_HEAD] Submit request: DRAFT → PENDING_APPROVAL. FR-02.' })
  @ApiForbiddenResponse({ description: 'Requires DEPARTMENT_HEAD role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  submitHiringRequest(@Param('id') id: string, @CurrentUser('sub') actorId: string) {
    return firstValueFrom(this.recruitingClient.send('hiring-requests.submit', { id, actorId }));
  }

  @Post('recruitment-requests/:id/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Approve request: PENDING_APPROVAL → APPROVED. Self-approval blocked. FR-03.' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  @ApiBody({ type: ApproveRequestDto })
  approveHiringRequest(
    @Param('id') id: string,
    @Body() body: ApproveRequestDto,
    @CurrentUser('sub') actorId: string,
  ) {
    return firstValueFrom(this.recruitingClient.send('hiring-requests.approve', { id, actorId, comments: body.comments }));
  }

  @Post('recruitment-requests/:id/reject')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Reject request with mandatory reason. FR-03.' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  @ApiBody({ type: RejectRequestDto })
  rejectHiringRequest(
    @Param('id') id: string,
    @Body() body: RejectRequestDto,
    @CurrentUser('sub') actorId: string,
  ) {
    return firstValueFrom(this.recruitingClient.send('hiring-requests.reject', { id, actorId, reason: body.reason }));
  }

  @Post('recruitment-requests/:id/revision')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Request revision with feedback: PENDING_APPROVAL → REVISION_REQUESTED. FR-03.' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  @ApiBody({ type: RevisionRequestDto })
  requestRevision(
    @Param('id') id: string,
    @Body() body: RevisionRequestDto,
    @CurrentUser('sub') actorId: string,
  ) {
    return firstValueFrom(this.recruitingClient.send('hiring-requests.requestRevision', { id, actorId, feedback: body.feedback }));
  }

  // ─── Overall Plan ─────────────────────────────────────────────────

  @Post('recruitment-requests/:id/plan')
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

  @Get('recruitment-requests/:id/plan')
  @Roles(UserRole.HIRING_MANAGER, UserRole.ADMIN, UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Get the overall plan (with all tasks) for a recruitment request' })
  @ApiForbiddenResponse({ description: 'Requires HIRING_MANAGER, ADMIN, or DEPARTMENT_HEAD role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  getOverallPlanByRequest(@Param('id') hiringRequestId: string) {
    return firstValueFrom(this.recruitingClient.send('overall-plan.getByRequest', { hiringRequestId }));
  }

  @Post('recruitment-requests/:id/plan/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Approve the overall recruitment plan',
    description: 'Plan → APPROVED, HiringRequest → ACTIVE (downstream unlocked). Must be PENDING_APPROVAL.',
  })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  approveOverallPlan(
    @Param('id') hiringRequestId: string,
    @CurrentUser('sub') approverId: string,
  ) {
    return firstValueFrom(this.recruitingClient.send('overall-plan.approve', { hiringRequestId, approverId }));
  }

  @Post('recruitment-requests/:id/plan/reject')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Reject the overall recruitment plan — requires reason, notifies HR',
    description: 'Plan → REVISION_REQUIRED, revisionNotes set. HiringRequest stays PLANNING. Must be PENDING_APPROVAL.',
  })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  @ApiBody({ type: RejectPlanDto })
  rejectOverallPlan(
    @Param('id') hiringRequestId: string,
    @Body() body: RejectPlanDto,
    @CurrentUser('sub') approverId: string,
  ) {
    return firstValueFrom(this.recruitingClient.send('overall-plan.reject', { hiringRequestId, approverId, reason: body.reason }));
  }

  // ─── Task Plans ───────────────────────────────────────────────────

  @Post('recruitment-requests/:id/plan/tasks')
  @Roles(UserRole.HIRING_MANAGER)
  @ApiOperation({
    summary: 'Add a task to the recruitment plan',
    description: 'Validates task dates are within the OverallPlan window. Notifies the assignee.',
  })
  @ApiForbiddenResponse({ description: 'Requires HIRING_MANAGER role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  @ApiBody({ type: CreateTaskPlanDto })
  createTaskPlan(@Param('id') hiringRequestId: string, @Body() body: CreateTaskPlanDto) {
    return firstValueFrom(this.recruitingClient.send('task-plan.createByRequest', { hiringRequestId, ...body }));
  }

  @Get('recruitment-requests/:id/plan/tasks')
  @Roles(UserRole.HIRING_MANAGER, UserRole.ADMIN, UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'List all tasks for a recruitment plan with assignee, deadline, and status' })
  @ApiForbiddenResponse({ description: 'Requires HIRING_MANAGER, ADMIN, or DEPARTMENT_HEAD role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  listTaskPlans(@Param('id') hiringRequestId: string) {
    return firstValueFrom(this.recruitingClient.send('task-plan.listByRequest', { hiringRequestId }));
  }

  @Get('plan-tasks/:taskId')
  @Roles(UserRole.HIRING_MANAGER, UserRole.ADMIN, UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Get a single task plan by ID' })
  @ApiForbiddenResponse({ description: 'Requires HIRING_MANAGER, ADMIN, or DEPARTMENT_HEAD role' })
  @ApiParam({ name: 'taskId', description: 'TaskPlan UUID' })
  getTaskPlan(@Param('taskId') id: string) {
    return firstValueFrom(this.recruitingClient.send('task-plan.get', { id }));
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
  @ApiOperation({ summary: 'Update task completion status (PENDING → IN_PROGRESS → COMPLETED)' })
  @ApiForbiddenResponse({ description: 'Requires HIRING_MANAGER role' })
  @ApiParam({ name: 'taskId', description: 'TaskPlan UUID' })
  @ApiBody({ type: UpdateTaskStatusDto })
  updateTaskStatus(@Param('taskId') id: string, @Body() body: UpdateTaskStatusDto) {
    return firstValueFrom(this.recruitingClient.send('task-plan.updateStatus', { id, status: body.status }));
  }
}
