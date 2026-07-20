import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom } from 'rxjs';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import {
  HiringDecision,
  isHrRole,
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
import { buildStoragePath, createSignedDownloadUrl, storageBuckets, uploadFile } from '@wr/storage';

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

  @ApiProperty({ example: '2026-07-01T00:00:00.000Z', description: 'Start Date' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-07-31T23:59:59.000Z', description: 'Expire Date' })
  @IsDateString()
  expireDate!: string;
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

  @ApiProperty({ example: '2026-07-01T00:00:00.000Z', required: false, description: 'Start Date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

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
  @ApiProperty({ example: 'uuid-of-department' })
  @IsUUID()
  departmentId!: string;

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

  @ApiProperty({ example: 7, minimum: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;
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

  private async withSignedRecruitmentMedia<T extends { requirements?: unknown }>(
    posting: T,
  ): Promise<T> {
    const requirements = posting.requirements;
    if (!requirements || typeof requirements !== 'object' || Array.isArray(requirements))
      return posting;

    const recruitmentMedia = (requirements as Record<string, unknown>).recruitmentMedia;
    if (!Array.isArray(recruitmentMedia)) return posting;

    const media = await Promise.all(
      recruitmentMedia.map(async (item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
        const asset = item as Record<string, unknown>;
        if (typeof asset.bucket !== 'string' || typeof asset.path !== 'string') return asset;

        try {
          return {
            ...asset,
            url: await createSignedDownloadUrl(asset.bucket, asset.path),
          };
        } catch {
          return asset;
        }
      }),
    );

    return {
      ...posting,
      requirements: {
        ...(requirements as Record<string, unknown>),
        recruitmentMedia: media,
      },
    };
  }

  @Get('recruitment-requests')
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER)
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
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER, UserRole.DEPARTMENT_HEAD)
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

  @Delete('recruitment-requests/:id')
  @Roles(UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Delete a pending recruitment request owned by the department head' })
  deleteRecruitmentRequest(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return firstValueFrom(
      this.recruitingClient.send('recruitment-requests.depthead.delete', { id, userId }),
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

  // â”€â”€â”€ Overall Plan / Task Plan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @Post('overall-plan')
  @Roles(UserRole.HR_LEADER)
  @ApiOperation({ summary: 'Create an overall plan for an approved recruitment request' })
  createOverallPlan(@Body() body: CreateOverallPlanDto, @CurrentUser('sub') userId: string) {
    return firstValueFrom(
      this.recruitingClient.send('overall-plan.create', { ...body, createdById: userId }),
    );
  }

  @Get('overall-plan/by-request/:requestId')
  @Roles(UserRole.HR_LEADER, UserRole.ADMIN)
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
  @ApiOperation({ summary: 'Start an approved campaign and notify assigned HR members' })
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
  @Roles(UserRole.HR_LEADER, UserRole.ADMIN)
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
  @Roles(UserRole.HR_LEADER)
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

  // â”€â”€â”€ Roles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // â”€â”€â”€ Applications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  @ApiOperation({ summary: 'Assign an approved campaign task to an HR member' })
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

  @Get('offers/me')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'List offer letters sent to the current candidate' })
  listMyOffers(@CurrentUser() user: any) {
    return firstValueFrom(
      this.recruitingClient.send('recruiting.offers.listForCandidate', {
        candidateUserId: user.sub,
      }),
    );
  }

  @Get('offers/:id')
  @Roles(UserRole.HR_LEADER, UserRole.ADMIN, UserRole.CANDIDATE)
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
  // â”€â”€â”€ Invites â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // â”€â”€â”€ Evaluations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // â”€â”€â”€ Talent Search â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  @Post('talent/screening-decision')
  @Roles(UserRole.HR_LEADER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Persist shortlist or rejection decisions from CV screening' })
  updateTalentScreeningDecision(@Body() body: any, @CurrentUser() user?: any) {
    return firstValueFrom(
      this.recruitingClient.send('talent.screening-decision', {
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

  // â”€â”€â”€ Job Postings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  @Post('job-postings/media')
  @Roles(UserRole.HR_LEADER, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload banner or recruitment notice media for a job posting' })
  async uploadJobPostingMedia(
    @UploadedFile() file: any,
    @Body() body: { requestId?: string; kind?: string },
    @CurrentUser() user?: any,
  ) {
    if (!file) {
      throw new BadRequestException('Media file is required');
    }
    if (!body.requestId) {
      throw new BadRequestException('requestId is required');
    }

    const canUpload = user?.role === UserRole.ADMIN || isHrRole(user?.role);
    if (!canUpload) {
      throw new ForbiddenException('Only HR can upload job posting media');
    }

    const allowedTypes: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };
    const extension = allowedTypes[file.mimetype];
    if (!extension) {
      throw new BadRequestException('Only JPG, PNG, WEBP, or GIF images are supported');
    }

    const mediaKind = body.kind === 'NOTICE' ? 'NOTICE' : 'BANNER';
    const ownerId = body.requestId;
    const bucket = mediaKind === 'BANNER' ? storageBuckets.banners : storageBuckets.noticeImages;
    const path = buildStoragePath(ownerId, file.originalname || `media${extension}`);

    try {
      const uploaded = await uploadFile(bucket, path, file.buffer, {
        contentType: file.mimetype,
      });
      return {
        kind: mediaKind,
        url: await createSignedDownloadUrl(uploaded.bucket, uploaded.path),
        bucket: uploaded.bucket,
        path: uploaded.path,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to upload job posting media',
      );
    }
  }

  @Get('job-postings')
  @ApiOperation({ summary: 'List all job postings' })
  async listJobPostings(@Query() query: any, @CurrentUser() user?: any) {
    const postings = await firstValueFrom(
      this.recruitingClient.send('recruiting.job_posting.list', {
        ...query,
        userRole: user?.role,
        userDeptId: user?.departmentId,
      }),
    );
    return Promise.all(
      postings.map((posting: { requirements?: unknown }) =>
        this.withSignedRecruitmentMedia(posting),
      ),
    );
  }

  @Get('public/job-postings')
  @Public()
  @ApiOperation({ summary: 'List public published job postings' })
  async listPublicJobPostings(@Query() query: any) {
    const postings = await firstValueFrom(
      this.recruitingClient.send('recruiting.job_posting.list', {
        ...query,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        userRole: UserRole.CANDIDATE,
      }),
    );
    return Promise.all(
      postings.map((posting: { requirements?: unknown }) =>
        this.withSignedRecruitmentMedia(posting),
      ),
    );
  }

  @Get('job-postings/:id')
  @ApiOperation({ summary: 'Get job posting by ID' })
  async getJobPosting(@Param('id') id: string, @CurrentUser() user?: any) {
    const posting = await firstValueFrom(
      this.recruitingClient.send('recruiting.job_posting.get', {
        id,
        userRole: user?.role,
        userDeptId: user?.departmentId,
      }),
    );
    return this.withSignedRecruitmentMedia(posting);
  }

  @Patch('job-postings/:id')
  @Roles(UserRole.HR_LEADER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update job posting details' })
  updateJobPosting(
    @Param('id') id: string,
    @Body() body: UpdateJobPostingDto,
    @CurrentUser() user?: any,
  ) {
    return firstValueFrom(
      this.recruitingClient.send('recruiting.job_posting.update', {
        id,
        ...body,
        actorUserId: user?.sub,
        actorRole: user?.role,
      }),
    );
  }

  @Post('job-postings/:id/publish')
  @Roles(UserRole.HR_LEADER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Publish job posting' })
  publishJobPosting(@Param('id') id: string, @CurrentUser() user?: any) {
    return firstValueFrom(
      this.recruitingClient.send('recruiting.job_posting.publish', {
        id,
        actorUserId: user?.sub,
        actorRole: user?.role,
      }),
    );
  }

  @Post('job-postings/:id/close')
  @Roles(UserRole.HR_LEADER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Close job posting' })
  closeJobPosting(@Param('id') id: string, @CurrentUser() user?: any) {
    return firstValueFrom(
      this.recruitingClient.send('recruiting.job_posting.close', {
        id,
        actorUserId: user?.sub,
        actorRole: user?.role,
      }),
    );
  }

  // â”€â”€â”€ Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER)
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

  @Get('reports/hr-request-queue-summary')
  @Roles(UserRole.HR_LEADER)
  @ApiOperation({ summary: 'Get HR recruitment-request review queue summary' })
  getHrRequestQueueSummary() {
    return firstValueFrom(this.recruitingClient.send('recruiting.hr_request_queue_summary', {}));
  }

  @Get('reports/hr-dashboard')
  @Roles(UserRole.HR_LEADER)
  @ApiOperation({ summary: 'Get HR recruitment dashboard data' })
  getHrDashboard() {
    return firstValueFrom(this.recruitingClient.send('recruiting.hr_dashboard', {}));
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
  @Roles(UserRole.ADMIN, UserRole.HR_LEADER, UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'FR-20: Real-time recruitment requests status tracking dashboard' })
  getRealtimeTracking(@CurrentUser() user: any) {
    return firstValueFrom(
      this.recruitingClient.send('recruiting.realtime_tracking', {
        userId: user.sub,
        role: user.role,
      }),
    );
  }

  // â”€â”€â”€ Audit Logs (T-107, NFR-3) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @Get('audit-logs')
  @ApiOperation({ summary: 'NFR-3: Query audit trail entries for a given entity' })
  getAuditLogs(@Query('entityType') entityType: string, @Query('entityId') entityId: string) {
    return firstValueFrom(
      this.recruitingClient.send('audit-log.findByEntity', { entityType, entityId }),
    );
  }
}
