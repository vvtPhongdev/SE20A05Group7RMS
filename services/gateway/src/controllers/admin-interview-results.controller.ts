import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { HiringDecision, UserRole } from '@wr/contracts';
import { IsDateString, IsEnum, IsNotEmpty, IsString, IsUUID, ValidateIf } from 'class-validator';
import { firstValueFrom } from 'rxjs';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { SERVICE_TOKENS } from '../constants';

export class AdminInterviewDecisionDto {
  @ApiProperty({ enum: HiringDecision })
  @IsEnum(HiringDecision)
  decision!: HiringDecision;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  notes!: string;

  @ApiProperty({ required: false, description: 'Required for HIRE decisions' })
  @ValidateIf((dto: AdminInterviewDecisionDto) => dto.decision === HiringDecision.HIRE)
  @IsUUID()
  candidateId?: string;

  @ApiProperty({ required: false, example: '45,000,000 VND gross per month' })
  @ValidateIf((dto: AdminInterviewDecisionDto) => dto.decision === HiringDecision.HIRE)
  @IsString()
  @IsNotEmpty()
  compensation?: string;

  @ApiProperty({ required: false, example: '2026-07-15T00:00:00.000Z' })
  @ValidateIf((dto: AdminInterviewDecisionDto) => dto.decision === HiringDecision.HIRE)
  @IsDateString()
  startDate?: string;
}

export class AdminInterviewRequestInfoDto {
  @ApiProperty()
  @IsUUID()
  candidateId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  notes!: string;
}

@ApiTags('Admin Interview Results')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/interview-results')
export class AdminInterviewResultsController {
  constructor(
    @Inject(SERVICE_TOKENS.INTERVIEW) private readonly interviewClient: ClientProxy,
    @Inject(SERVICE_TOKENS.RECRUITING) private readonly recruitingClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List completed interview results for Admin final decision review' })
  list(@CurrentUser() user: any) {
    return firstValueFrom(
      this.interviewClient.send('interview.list_completed', {
        userId: user.sub,
        role: user.role,
      }),
    );
  }

  @Post(':requestId/decision')
  @ApiOperation({ summary: 'Approve hire and send offer, or reject after interview results' })
  decide(
    @Param('requestId') requestId: string,
    @Body() body: AdminInterviewDecisionDto,
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

  @Post(':requestId/request-info')
  @ApiOperation({ summary: 'Request more information before a final hiring decision' })
  requestInfo(
    @Param('requestId') requestId: string,
    @Body() body: AdminInterviewRequestInfoDto,
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
}
