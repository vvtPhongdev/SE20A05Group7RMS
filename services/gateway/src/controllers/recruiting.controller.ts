import { Controller, Get, Post, Patch, Body, Param, Query, Inject, Res } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom } from 'rxjs';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import {
  HiringDecision,
  OfferResponse,
  TaskStatus,
  TaskType,
  Urgency,
  UserRole,
} from '@wr/contracts';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  IsUUID,
  IsString,
  IsOptional,
  IsDateString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsBoolean,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateJobPostingDto {
  @ApiProperty({ example: 'uuid-of-recruitment-request', description: 'Recruitment Request ID' })
  @IsUUID()
  @IsNotEmpty()
  requestId!: string;

  @ApiProperty({
    example: 'Senior TypeScript Developer',
    required: false,
    description: 'Custom Job Title',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiProperty({
    example: 'Looking for a developer...',
    required: false,
    description: 'Custom Job Description',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiProperty({ required: false, description: 'Custom Requirements (JSON)' })
  @IsOptional()
  requirements?: any;

  @ApiProperty({
    example: 'PUBLIC',
    enum: ['PUBLIC', 'PRIVATE'],
    default: 'PRIVATE',
    description: 'Visibility status',
  })
  @IsOptional()
  @IsString()
  visibility?: any;

  @ApiProperty({ example: '2026-07-01T00:00:00.000Z', required: false, description: 'Expire Date' })
  @IsOptional()
  @IsDateString()
  expireDate?: string;
}

export class UpdateJobPostingDto {
  @ApiProperty({
    example: 'Senior TypeScript Developer',
    required: false,
    description: 'Custom Job Title',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiProperty({
    example: 'Looking for a developer...',
    required: false,
    description: 'Custom Job Description',
  })
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

export class CreateOfferDto {
  @ApiProperty({ example: 'recruitment-request-uuid' })
  @IsUUID()
  requestId!: string;

  @ApiProperty({ example: 'candidate-profile-uuid' })
  @IsUUID()
  candidateId!: string;

  @ApiProperty({ example: '45,000,000 VND gross per month' })
  @IsString()
  @IsNotEmpty()
  compensation!: string;

  @ApiProperty({ example: '2026-07-15T00:00:00.000Z' })
  @IsDateString()
  startDate!: string;
}

export class OfferResponseDto {
  @ApiProperty({ enum: OfferResponse, example: OfferResponse.ACCEPT })
  @IsEnum(OfferResponse)
  response!: OfferResponse;

  @ApiProperty({ required: false, example: 'I accept the offer.' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateRecruitmentRequestDto {
  @ApiProperty({ example: 'Senior Frontend Engineer' })
  @IsString()
  @IsNotEmpty()
  positionTitle!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  headcount!: number;

  @ApiProperty({ example: 'Build and maintain customer-facing web apps...' })
  @IsString()
  @IsNotEmpty()
  jobDescription!: string;

  @ApiProperty({ example: 'Team is understaffed for the upcoming product launch.' })
  @IsString()
  @IsNotEmpty()
  justification!: string;

  @ApiProperty({ enum: Urgency, example: Urgency.MEDIUM })
  @IsEnum(Urgency)
  urgency!: Urgency;

  @ApiProperty({ required: false, description: 'Additional structured requirements (JSON)' })
  @IsOptional()
  skillRequirements?: Record<string, unknown>;

  @ApiProperty({
    required: false,
    description: 'If true, submit directly for review instead of saving as draft',
  })
  @IsOptional()
  @IsBoolean()
  submit?: boolean;
}

export class UpdateRecruitmentRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  positionTitle?: string;

  @ApiProperty({ required: false, example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  headcount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  jobDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  justification?: string;

  @ApiProperty({ required: false, enum: Urgency })
  @IsOptional()
  @IsEnum(Urgency)
  urgency?: Urgency;

  @ApiProperty({ required: false })
  @IsOptional()
  skillRequirements?: Record<string, unknown>;

  @ApiProperty({
    required: false,
    description: 'Whether the Department Head accepted HR suggested changes during revision',
  })
  @IsOptional()
  @IsBoolean()
  acceptedHrSuggestion?: boolean;

  @ApiProperty({
    required: false,
    description: 'Department Head reason when rejecting HR suggested changes',
  })
  @IsOptional()
  @IsString()
  revisionResponse?: string;
}

export class AssignRecruitmentRequestDto {
  @ApiProperty({ example: 'uuid-of-hr-leader' })
  @IsUUID()
  hrManagerId!: string;
}

export class ReturnForRevisionDto {
  @ApiProperty({ example: 'Please clarify the budget for this position.' })
  @IsString()
  @IsNotEmpty()
  feedback!: string;
}

export class RequestRecruitmentChangesDto {
  @ApiProperty({ example: 'Please revise the headcount and budget notes.' })
  @IsString()
  @IsNotEmpty()
  feedback!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  positionTitle?: string;

  @ApiProperty({ required: false, example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  headcount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  jobDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  justification?: string;

  @ApiProperty({ required: false, enum: Urgency })
  @IsOptional()
  @IsEnum(Urgency)
  urgency?: Urgency;

  @ApiProperty({ required: false })
  @IsOptional()
  skillRequirements?: Record<string, unknown>;
}

export class CreateOverallPlanDto {
  @ApiProperty({ example: 'uuid-of-recruitment-request' })
  @IsUUID()
  hiringRequestId!: string;

  @ApiProperty({ example: '2026-07-01T00:00:00.000Z' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-08-15T00:00:00.000Z' })
  @IsDateString()
  endDate!: string;
}

export class ResubmitOverallPlanDto {
  @ApiProperty({ example: '2026-07-01T00:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2026-08-15T00:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class RejectOverallPlanDto {
  @ApiProperty({ example: 'Please adjust the screening timeline before approval.' })
  @IsString()
  @IsNotEmpty()
  revisionNotes!: string;
}

export class CreateTaskPlanDto {
  @ApiProperty({ example: 'uuid-of-overall-plan' })
  @IsUUID()
  overallPlanId!: string;

  @ApiProperty({ enum: TaskType })
  @IsEnum(TaskType)
  taskType!: TaskType;

  @ApiProperty({ example: '2026-07-01T00:00:00.000Z' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-07-08T00:00:00.000Z' })
  @IsDateString()
  endDate!: string;

  @ApiProperty({ example: 'uuid-of-assigned-recruiter', required: false })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}

export class UpdateTaskPlanStatusDto {
  @ApiProperty({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  status!: TaskStatus;
}

export class UpdateTaskPlanDto {
  @ApiProperty({ enum: TaskType, required: false })
  @IsOptional()
  @IsEnum(TaskType)
  taskType?: TaskType;

  @ApiProperty({ example: '2026-07-01T00:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2026-07-08T00:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class AssignTaskPlanRecruiterDto {
  @ApiProperty({ example: 'uuid-of-hr-recruiter' })
  @IsUUID()
  assignedToId!: string;
}

enum AdminRequestDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class DecideRecruitmentRequestDto {
  @ApiProperty({ enum: AdminRequestDecision })
  @IsEnum(AdminRequestDecision)
  decision!: AdminRequestDecision;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comments?: string;
}

export class HiringDecisionDto {
  @ApiProperty({ enum: HiringDecision })
  @IsEnum(HiringDecision)
  decision!: HiringDecision;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  notes!: string;

  @ApiProperty({ required: false, description: 'Required for HIRE decisions' })
  @ValidateIf((dto: HiringDecisionDto) => dto.decision === HiringDecision.HIRE)
  @IsUUID()
  candidateId?: string;

  @ApiProperty({ required: false, example: '45,000,000 VND gross per month' })
  @ValidateIf((dto: HiringDecisionDto) => dto.decision === HiringDecision.HIRE)
  @IsString()
  @IsNotEmpty()
  compensation?: string;

  @ApiProperty({ required: false, example: '2026-07-15T00:00:00.000Z' })
  @ValidateIf((dto: HiringDecisionDto) => dto.decision === HiringDecision.HIRE)
  @IsDateString()
  startDate?: string;
}

export class RequestHiringInfoDto {
  @ApiProperty()
  @IsUUID()
  candidateId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  notes!: string;
}

/**
 * Thin proxy controller for Recruiting service (roles, applications, invites, evaluations).
 */
@ApiTags('Recruiting')
@ApiBearerAuth()
@Controller()
export class RecruitingController {
  constructor(@Inject(SERVICE_TOKENS.RECRUITING) private readonly recruitingClient: ClientProxy) {}

  @Get('recruitment-requests')
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER, UserRole.HR_RECRUITER)
  @ApiOperation({ summary: 'List recruitment requests for admin/HR oversight' })
  listRecruitmentRequests(@Query() query: any, @CurrentUser() user: any) {
    const payload = { ...query, role: user.role, userId: user.sub };
    return firstValueFrom(this.recruitingClient.send('recruitment-requests.admin.list', payload));
  }

  @Post('recruitment-requests')
  @Roles(UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Create a recruitment request (department head)' })
  createRecruitmentRequest(
    @Body() body: CreateRecruitmentRequestDto,
    @CurrentUser('sub') userId: string,
  ) {
    return firstValueFrom(
      this.recruitingClient.send('recruitment-requests.depthead.create', {
        ...body,
        createdById: userId,
      }),
    );
  }

  @Get('recruitment-requests/:id')
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER, UserRole.HR_RECRUITER, UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Get a recruitment request visible to the current user' })
  getRecruitmentRequest(@Param('id') id: string, @CurrentUser() user: any) {
    return firstValueFrom(
      this.recruitingClient.send('recruitment-requests.get', {
        id,
        userId: user.sub,
        role: user.role,
      }),
    );
  }

  @Patch('recruitment-requests/:id')
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.HR_LEADER)
  @ApiOperation({ summary: 'Update a recruitment request' })
  updateRecruitmentRequest(
    @Param('id') id: string,
    @Body() body: UpdateRecruitmentRequestDto,
    @CurrentUser() user: any,
  ) {
    return firstValueFrom(
      this.recruitingClient.send('recruitment-requests.depthead.update', {
        id,
        userId: user.sub,
        role: user.role,
        ...body,
      }),
    );
  }

  @Patch('recruitment-requests/:id/submit')
  @Roles(UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Submit a draft recruitment request for review' })
  submitRecruitmentRequest(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return firstValueFrom(
      this.recruitingClient.send('recruitment-requests.depthead.submit', { id, userId }),
    );
  }

  @Patch('recruitment-requests/:id/assign')
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER)
  @ApiOperation({ summary: 'Assign a recruitment request to an HR manager' })
  assignRecruitmentRequest(
    @Param('id') id: string,
    @Body() body: AssignRecruitmentRequestDto,
    @CurrentUser('sub') userId: string,
  ) {
    return firstValueFrom(
      this.recruitingClient.send('recruitment-requests.admin.assign', {
        id,
        hrManagerId: body.hrManagerId,
        assignedById: userId,
      }),
    );
  }

  @Patch('recruitment-requests/:id/return-for-revision')
  @Roles(UserRole.HR_LEADER)
  @ApiOperation({ summary: 'Return a recruitment request to the department head for revision' })
  returnRecruitmentRequestForRevision(
    @Param('id') id: string,
    @Body() body: ReturnForRevisionDto,
    @CurrentUser('sub') userId: string,
  ) {
    return firstValueFrom(
      this.recruitingClient.send('recruitment-requests.hr.return_for_revision', {
        id,
        hrManagerId: userId,
        feedback: body.feedback,
      }),
    );
  }

  @Patch('recruitment-requests/:id/request-changes')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Request changes to an HR-forwarded recruitment request' })
  requestRecruitmentRequestChanges(
    @Param('id') id: string,
    @Body() body: RequestRecruitmentChangesDto,
    @CurrentUser('sub') userId: string,
  ) {
    return firstValueFrom(
      this.recruitingClient.send('recruitment-requests.admin.request_changes', {
        id,
        adminId: userId,
        ...body,
      }),
    );
  }

  @Patch('recruitment-requests/:id/forward-to-admin')
  @Roles(UserRole.HR_LEADER)
  @ApiOperation({ summary: 'Forward an HR-reviewed recruitment request to Admin' })
  forwardRecruitmentRequestToAdmin(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return firstValueFrom(
      this.recruitingClient.send('recruitment-requests.hr.forward_to_admin', {
        id,
        hrManagerId: userId,
      }),
    );
  }

  @Patch('recruitment-requests/:id/decision')
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER)
  @ApiOperation({ summary: 'Approve or reject a pending recruitment request' })
  decideRecruitmentRequest(
    @Param('id') id: string,
    @Body() body: DecideRecruitmentRequestDto,
    @CurrentUser() user: any,
  ) {
    return firstValueFrom(
      this.recruitingClient.send('recruitment-requests.admin.decide', {
        id,
        decision: body.decision,
        comments: body.comments,
        adminId: user.sub,
        role: user.role,
      }),
    );
  }

  // ─── Overall Plan / Task Plan ──────────────────────────────────────

  @Post('overall-plan')
  @Roles(UserRole.HR_LEADER)
  @ApiOperation({ summary: 'Create an overall plan for an approved recruitment request' })
  createOverallPlan(@Body() body: CreateOverallPlanDto, @CurrentUser('sub') userId: string) {
    return firstValueFrom(
      this.recruitingClient.send('overall-plan.create', { ...body, createdById: userId }),
    );
  }

  @Get('overall-plan/by-request/:requestId')
  @Roles(UserRole.HR_LEADER, UserRole.HR_RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get the overall plan for a recruitment request' })
  getOverallPlanByRequest(@Param('requestId') requestId: string, @CurrentUser() user: any) {
    return firstValueFrom(
      this.recruitingClient.send('overall-plan.getByRequest', {
        hiringRequestId: requestId,
        userId: user.sub,
        role: user.role,
      }),
    );
  }

  @Patch('overall-plan/:id/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve an overall recruitment plan' })
  approveOverallPlan(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return firstValueFrom(
      this.recruitingClient.send('overall-plan.approve', { id, approvedById: userId }),
    );
  }

  @Patch('overall-plan/:id/submit')
  @Roles(UserRole.HR_LEADER)
  @ApiOperation({ summary: 'Submit a drafted overall plan with tasks for Admin approval' })
  submitOverallPlan(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return firstValueFrom(
      this.recruitingClient.send('overall-plan.submit', { id, performedById: userId }),
    );
  }

  @Patch('overall-plan/:id/start-campaign')
  @Roles(UserRole.HR_LEADER)
  @ApiOperation({ summary: 'Start an approved campaign and notify assigned HR recruiters' })
  startCampaign(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return firstValueFrom(
      this.recruitingClient.send('overall-plan.start_campaign', { id, performedById: userId }),
    );
  }

  @Patch('overall-plan/:id/reject')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject an overall recruitment plan with revision notes' })
  rejectOverallPlan(
    @Param('id') id: string,
    @Body() body: RejectOverallPlanDto,
    @CurrentUser('sub') userId: string,
  ) {
    return firstValueFrom(
      this.recruitingClient.send('overall-plan.reject', {
        id,
        approvedById: userId,
        revisionNotes: body.revisionNotes,
      }),
    );
  }

  @Patch('overall-plan/:id/resubmit')
  @Roles(UserRole.HR_LEADER)
  @ApiOperation({ summary: 'Resubmit a rejected overall plan for approval' })
  resubmitOverallPlan(
    @Param('id') id: string,
    @Body() body: ResubmitOverallPlanDto,
    @CurrentUser('sub') userId: string,
  ) {
    return firstValueFrom(
      this.recruitingClient.send('overall-plan.resubmit', { id, performedById: userId, ...body }),
    );
  }

  @Post('task-plan')
  @Roles(UserRole.HR_LEADER)
  @ApiOperation({ summary: 'Create (assign) a task within an overall plan' })
  createTaskPlan(@Body() body: CreateTaskPlanDto, @CurrentUser('sub') userId: string) {
    return firstValueFrom(
      this.recruitingClient.send('task-plan.create', {
        ...body,
        assignedToId: body.assignedToId || userId,
        performedById: userId,
      }),
    );
  }

  @Get('task-plan')
  @Roles(UserRole.HR_LEADER, UserRole.HR_RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List campaign task plans' })
  listTaskPlans(@Query() query: any, @CurrentUser() user: any) {
    return firstValueFrom(
      this.recruitingClient.send('task-plan.listAll', {
        ...query,
        role: user.role,
        userId: user.sub,
      }),
    );
  }

  @Patch('task-plan/:id/status')
  @Roles(UserRole.HR_LEADER, UserRole.HR_RECRUITER)
  @ApiOperation({ summary: 'Update a task plan status' })
  updateTaskPlanStatus(
    @Param('id') id: string,
    @Body() body: UpdateTaskPlanStatusDto,
    @CurrentUser() user: any,
  ) {
    return firstValueFrom(
      this.recruitingClient.send('task-plan.updateStatus', {
        id,
        status: body.status,
        performedById: user.sub,
        actorRole: user.role,
      }),
    );
  }

  @Post('hiring-decisions/:requestId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Make the final hiring decision after interviews' })
  makeHiringDecision(
    @Param('requestId') requestId: string,
    @Body() body: HiringDecisionDto,
    @CurrentUser('sub') userId: string,
  ) {
    return firstValueFrom(
      this.recruitingClient.send('recruiting.hiring_decision.decide', {
        requestId,
        decision: body.decision,
        notes: body.notes,
        adminId: userId,
        candidateId: body.candidateId,
        compensation: body.compensation,
        startDate: body.startDate,
      }),
    );
  }

  @Post('hiring-decisions/:requestId/request-info')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Request more information before a final hiring decision' })
  requestHiringInfo(
    @Param('requestId') requestId: string,
    @Body() body: RequestHiringInfoDto,
    @CurrentUser('sub') userId: string,
  ) {
    return firstValueFrom(
      this.recruitingClient.send('recruiting.hiring_decision.request_info', {
        requestId,
        candidateId: body.candidateId,
        notes: body.notes,
        adminId: userId,
      }),
    );
  }

  @Get('reports/admin-dashboard')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get admin dashboard overview' })
  getAdminDashboard() {
    return firstValueFrom(this.recruitingClient.send('recruiting.admin_dashboard', {}));
  }

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
  createApplication(@Body() body: any, @CurrentUser() user?: any) {
    const payload =
      user?.role === UserRole.CANDIDATE
        ? { ...body, candidateId: undefined, userId: user.sub }
        : { ...body };
    payload.actorUserId = user?.sub;
    payload.actorRole = user?.role;
    return firstValueFrom(this.recruitingClient.send('applications.create', payload));
  }

  @Get('applications')
  @ApiOperation({ summary: 'List applications' })
  listApplications(@Query() query: any, @CurrentUser() user?: any) {
    return firstValueFrom(
      this.recruitingClient.send('applications.list', {
        ...query,
        userId: user?.sub,
        userRole: user?.role,
      }),
    );
  }

  @Patch('task-plan/:id')
  @Roles(UserRole.HR_LEADER)
  @ApiOperation({ summary: 'Update a drafted task plan before Admin approval' })
  updateTaskPlan(
    @Param('id') id: string,
    @Body() body: UpdateTaskPlanDto,
    @CurrentUser('sub') userId: string,
  ) {
    return firstValueFrom(
      this.recruitingClient.send('task-plan.update', {
        id,
        performedById: userId,
        ...body,
      }),
    );
  }

  @Patch('task-plan/:id/assign-recruiter')
  @Roles(UserRole.HR_LEADER)
  @ApiOperation({ summary: 'Assign an approved campaign task to an HR recruiter' })
  assignTaskPlanRecruiter(
    @Param('id') id: string,
    @Body() body: AssignTaskPlanRecruiterDto,
    @CurrentUser('sub') userId: string,
  ) {
    return firstValueFrom(
      this.recruitingClient.send('task-plan.assignRecruiter', {
        id,
        assignedToId: body.assignedToId,
        performedById: userId,
      }),
    );
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

  @Post('offers')
  @Roles(UserRole.HR_LEADER)
  @ApiOperation({ summary: 'FR-17: Generate an offer letter for review' })
  generateOffer(@Body() body: CreateOfferDto, @CurrentUser() user: any) {
    return firstValueFrom(
      this.recruitingClient.send('recruiting.offers.generate', {
        ...body,
        generatedById: user.sub,
      }),
    );
  }

  @Get('offers/:id')
  @Roles(UserRole.HR_LEADER, UserRole.HR_RECRUITER, UserRole.ADMIN, UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Review an offer letter' })
  getOffer(@Param('id') id: string, @CurrentUser() user: any) {
    return firstValueFrom(
      this.recruitingClient.send('recruiting.offers.get', {
        id,
        actorUserId: user.sub,
        actorRole: user.role,
      }),
    );
  }

  @Post('offers/:id/send')
  @Roles(UserRole.HR_LEADER)
  @ApiOperation({ summary: 'Send a reviewed offer letter' })
  sendOffer(@Param('id') id: string, @CurrentUser() user: any) {
    return firstValueFrom(
      this.recruitingClient.send('recruiting.offers.send', {
        id,
        sentById: user.sub,
      }),
    );
  }

  @Post('offers/:id/respond')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Accept or decline an offer letter' })
  respondToOffer(
    @Param('id') id: string,
    @Body() body: OfferResponseDto,
    @CurrentUser() user: any,
  ) {
    return firstValueFrom(
      this.recruitingClient.send('recruiting.offers.respond', {
        id,
        response: body.response,
        note: body.note,
        candidateUserId: user.sub,
      }),
    );
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
  searchTalent(@Body() body: any, @CurrentUser() user?: any) {
    return firstValueFrom(
      this.recruitingClient.send('talent.search', {
        ...body,
        actorUserId: user?.sub,
        actorRole: user?.role,
      }),
    );
  }

  @Post('talent/feedback')
  @ApiOperation({ summary: 'Record HR feedback for talent search learning loop' })
  recordTalentFeedback(@Body() body: any, @CurrentUser() user?: any) {
    return firstValueFrom(
      this.recruitingClient.send('talent.feedback', {
        ...body,
        actorUserId: user?.sub,
        actorRole: user?.role,
      }),
    );
  }

  @Get('talent/feedback/export-triplets')
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER)
  @ApiOperation({ summary: 'Export talent search feedback as embedding training triplets' })
  exportTalentTriplets(@Query() query: any) {
    return firstValueFrom(
      this.recruitingClient.send('talent.feedback.export_triplets', {
        requestId: query.requestId,
        limit: query.limit ? Number(query.limit) : undefined,
      }),
    );
  }

  @Get('talent/expand')
  @ApiOperation({ summary: 'Expand a skill query via the knowledge graph' })
  expandQuery(@Query('q') query: string) {
    return firstValueFrom(this.recruitingClient.send('talent.expand', { query }));
  }

  // ─── Job Postings ────────────────────────────────────────────────

  @Post('job-postings')
  @Roles(UserRole.HR_LEADER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create job posting from approved recruitment request' })
  createJobPosting(@Body() body: CreateJobPostingDto, @CurrentUser() user?: any) {
    return firstValueFrom(
      this.recruitingClient.send('recruiting.job_posting.create', {
        ...body,
        actorUserId: user?.sub,
        actorRole: user?.role,
      }),
    );
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

  @Get('public/job-postings')
  @Public()
  @ApiOperation({ summary: 'List public published job postings' })
  listPublicJobPostings(@Query() query: any) {
    return firstValueFrom(
      this.recruitingClient.send('recruiting.job_posting.list', {
        ...query,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        userRole: UserRole.CANDIDATE,
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
  @Roles(UserRole.HR_LEADER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update job posting details' })
  updateJobPosting(@Param('id') id: string, @Body() body: UpdateJobPostingDto) {
    return firstValueFrom(
      this.recruitingClient.send('recruiting.job_posting.update', { id, ...body }),
    );
  }

  @Post('job-postings/:id/publish')
  @Roles(UserRole.HR_LEADER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Publish job posting' })
  publishJobPosting(@Param('id') id: string) {
    return firstValueFrom(this.recruitingClient.send('recruiting.job_posting.publish', { id }));
  }

  @Post('job-postings/:id/close')
  @Roles(UserRole.HR_LEADER, UserRole.ADMIN)
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
    return firstValueFrom(
      this.recruitingClient.send('recruiting.annual_report', { year: parsedYear }),
    );
  }

  @Get('reports/departments')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get department recruitment statistics' })
  getDepartmentStats(@Query('range') range?: '30d' | 'quarter' | 'year') {
    return firstValueFrom(
      this.recruitingClient.send('recruiting.department_stats', {
        range: range || '30d',
      }),
    );
  }

  @Get('reports/department/:id')
  @Roles(UserRole.ADMIN, UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Get department recruitment report' })
  getDepartmentReport(@Param('id') id: string, @CurrentUser() user: any) {
    return firstValueFrom(
      this.recruitingClient.send('recruiting.department_report', {
        id,
        userId: user.sub,
        role: user.role,
      }),
    );
  }

  @Get('reports/time-to-hire')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get time-to-hire metrics report' })
  getTimeToHireReport() {
    return firstValueFrom(this.recruitingClient.send('recruiting.time_to_hire', {}));
  }

  @Get('reports/pipeline')
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER)
  @ApiOperation({ summary: 'Get recruitment pipeline overview' })
  getPipelineOverview() {
    return firstValueFrom(this.recruitingClient.send('recruiting.pipeline_overview', {}));
  }
  @Get('reports/annual/export')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Export annual recruitment report to CSV or PDF' })
  async exportAnnualReport(
    @Res() res: any,
    @Query('year') year?: string,
    @Query('format') format?: 'csv' | 'pdf',
  ) {
    const parsedYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const selectedFormat = format || 'csv';
    const result = await firstValueFrom(
      this.recruitingClient.send('recruiting.annual_report_export', {
        year: parsedYear,
        format: selectedFormat,
      }),
    );

    if (selectedFormat === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=annual-report-${parsedYear}.csv`);
      res.send(result.data);
    } else {
      const buffer = Buffer.from(result.data, 'base64');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=annual-report-${parsedYear}.pdf`);
      res.send(buffer);
    }
  }

  @Get('reports/realtime-tracking')
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER, UserRole.HR_RECRUITER, UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'FR-20: Real-time recruitment requests status tracking dashboard' })
  getRealtimeTracking(@CurrentUser() user: any) {
    return firstValueFrom(
      this.recruitingClient.send('recruiting.realtime_tracking', {
        userId: user.sub,
        role: user.role,
      }),
    );
  }

  // ─── Audit Logs (T-107, NFR-3) ───────────────────────────────────

  @Get('audit-logs')
  @ApiOperation({ summary: 'NFR-3: Query audit trail entries for a given entity' })
  getAuditLogs(@Query('entityType') entityType: string, @Query('entityId') entityId: string) {
    return firstValueFrom(
      this.recruitingClient.send('audit-log.findByEntity', { entityType, entityId }),
    );
  }
}
