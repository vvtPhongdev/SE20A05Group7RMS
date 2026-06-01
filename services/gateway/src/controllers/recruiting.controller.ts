import { Controller, Get, Post, Patch, Body, Param, Query, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiBody, ApiProperty, ApiForbiddenResponse } from '@nestjs/swagger';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom } from 'rxjs';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@wr/contracts';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

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

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  justification?: string;

  @ApiProperty({ required: false, example: 2 })
  headcount?: number;

  @ApiProperty({ required: false, enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'], example: 'NORMAL' })
  priority?: string;

  @ApiProperty({ required: false, enum: ['ONSITE', 'REMOTE', 'HYBRID'] })
  workMode?: string;

  @ApiProperty({ required: false })
  location?: string;

  @ApiProperty({ required: false, type: BudgetRangeDto })
  budgetRange?: BudgetRangeDto;

  @ApiProperty({ required: false, example: '2026-09-01T00:00:00.000Z' })
  targetStartDate?: string;
}

export class UpdateRecruitmentRequestDto {
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

  @ApiProperty({ required: false, type: BudgetRangeDto })
  budgetRange?: BudgetRangeDto;

  @ApiProperty({ required: false })
  targetStartDate?: string;
}

export class ApproveRejectDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED', 'REVISION_REQUESTED'] })
  decision!: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';

  @ApiProperty({ required: false })
  comments?: string;
}

export class CreateOverallPlanDto {
  @ApiProperty({ example: '2026-07-01', description: 'Campaign start date (ISO date)' })
  startDate!: string;

  @ApiProperty({ example: '2026-09-30', description: 'Campaign end date (ISO date). Must be after startDate.' })
  endDate!: string;
}

<<<<<<< Updated upstream
=======
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

>>>>>>> Stashed changes
/**
 * Thin proxy controller for Recruiting service.
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
  @ApiOperation({ summary: 'Create a recruitment request (DRAFT)' })
  @ApiForbiddenResponse({ description: 'Requires DEPARTMENT_HEAD role' })
  createRecruitmentRequest(@Body() body: CreateRecruitmentRequestDto, @CurrentUser() user: JwtPayload) {
    return firstValueFrom(
      this.recruitingClient.send('recruitment-requests.create', {
        ...body,
        requestedById: user.sub,
        organizationId: body.organizationId ?? user.organizationId,
      }),
    );
  }

  @Get('recruitment-requests')
  @ApiOperation({ summary: 'List recruitment requests' })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED', 'PLANNING'] })
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
  @ApiOperation({ summary: 'Update a recruitment request (DRAFT or REVISION_REQUESTED only)' })
  @ApiForbiddenResponse({ description: 'Requires DEPARTMENT_HEAD role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  updateRecruitmentRequest(@Param('id') id: string, @Body() body: UpdateRecruitmentRequestDto) {
    return firstValueFrom(this.recruitingClient.send('recruitment-requests.update', { id, ...body }));
  }

  @Post('recruitment-requests/:id/submit')
  @Roles(UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Submit request (DRAFT → PENDING_APPROVAL)' })
  @ApiForbiddenResponse({ description: 'Requires DEPARTMENT_HEAD role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  submitRecruitmentRequest(@Param('id') id: string) {
    return firstValueFrom(this.recruitingClient.send('recruitment-requests.submit', { id }));
  }

  @Post('recruitment-requests/:id/forward-to-boss')
  @Roles(UserRole.HIRING_MANAGER)
  @ApiOperation({ summary: 'Forward to next approval level (HR → Boss)' })
  @ApiForbiddenResponse({ description: 'Requires HIRING_MANAGER role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  forwardRecruitmentRequestToBoss(@Param('id') id: string) {
    return firstValueFrom(this.recruitingClient.send('recruitment-requests.forward-to-boss', { id }));
  }

  @Post('recruitment-requests/:id/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve a recruitment request' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  @ApiBody({ type: ApproveRejectDto })
  approveRecruitmentRequest(@Param('id') id: string, @Body() body: ApproveRejectDto, @CurrentUser('sub') actorId: string) {
    return firstValueFrom(this.recruitingClient.send('recruitment-requests.approve', { id, actorId, comments: body.comments }));
  }

  @Post('recruitment-requests/:id/reject')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject or request revision of a recruitment request' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  @ApiBody({ type: ApproveRejectDto })
  rejectRecruitmentRequest(@Param('id') id: string, @Body() body: ApproveRejectDto, @CurrentUser('sub') actorId: string) {
    return firstValueFrom(this.recruitingClient.send('recruitment-requests.reject', { id, actorId, decision: body.decision, comments: body.comments }));
  }

  @Get('recruitment-requests/:id/logs')
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.HIRING_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get audit trail for a recruitment request' })
  @ApiForbiddenResponse({ description: 'Requires DEPARTMENT_HEAD, HIRING_MANAGER, or ADMIN role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  getRecruitmentRequestLogs(@Param('id') id: string) {
    return firstValueFrom(this.recruitingClient.send('recruitment-requests.logs', { id }));
  }

  @Get('recruitment-requests/:id/tracking')
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.HIRING_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get tracking dashboard data for a recruitment request' })
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
    description: 'Validates: request must be APPROVED, endDate > startDate, no existing plan. Transitions request to PLANNING.',
  })
  @ApiForbiddenResponse({ description: 'Requires HIRING_MANAGER role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  @ApiBody({ type: CreateOverallPlanDto })
  createOverallPlan(@Param('id') hiringRequestId: string, @Body() body: CreateOverallPlanDto, @CurrentUser('sub') createdById: string) {
    return firstValueFrom(this.recruitingClient.send('overall-plan.create', { hiringRequestId, createdById, startDate: body.startDate, endDate: body.endDate }));
  }

  @Get('recruitment-requests/:id/plan')
  @Roles(UserRole.HIRING_MANAGER, UserRole.ADMIN, UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Get the overall plan (with all tasks) for a recruitment request' })
  @ApiForbiddenResponse({ description: 'Requires HIRING_MANAGER, ADMIN, or DEPARTMENT_HEAD role' })
  @ApiParam({ name: 'id', description: 'Hiring request UUID' })
  getOverallPlanByRequest(@Param('id') hiringRequestId: string) {
    return firstValueFrom(this.recruitingClient.send('overall-plan.getByRequest', { hiringRequestId }));
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
  listTaskPlansByRequest(@Param('id') hiringRequestId: string) {
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
  @ApiOperation({ summary: 'Update task status (PENDING → IN_PROGRESS → COMPLETED)' })
  @ApiForbiddenResponse({ description: 'Requires HIRING_MANAGER role' })
  @ApiParam({ name: 'taskId', description: 'TaskPlan UUID' })
  @ApiBody({ type: UpdateTaskStatusDto })
  updateTaskPlanStatus(@Param('taskId') id: string, @Body() body: UpdateTaskStatusDto) {
    return firstValueFrom(this.recruitingClient.send('task-plan.updateStatus', { id, status: body.status }));
  }
>>>>>>> Stashed changes
}
