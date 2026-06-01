import { Controller, Get, Post, Patch, Body, Param, Query, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody, ApiProperty, ApiForbiddenResponse } from '@nestjs/swagger';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom } from 'rxjs';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@wr/contracts';

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
