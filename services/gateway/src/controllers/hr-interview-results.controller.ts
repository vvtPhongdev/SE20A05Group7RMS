import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@wr/contracts';
import { firstValueFrom } from 'rxjs';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { SERVICE_TOKENS } from '../constants';

@ApiTags('HR Interview Results')
@ApiBearerAuth()
@Roles(UserRole.HR_LEADER, UserRole.HR_RECRUITER)
@Controller('hr/interview-results')
export class HrInterviewResultsController {
  constructor(@Inject(SERVICE_TOKENS.INTERVIEW) private readonly interviewClient: ClientProxy) {}

  @Get()
  @ApiOperation({ summary: 'List completed or past interviews for HR result recording' })
  list(@CurrentUser() user: any) {
    return firstValueFrom(
      this.interviewClient.send('interview.list_completed', {
        userId: user.sub,
        role: user.role,
      }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get HR interview result details' })
  getDetails(@Param('id') id: string, @CurrentUser() user: any) {
    return firstValueFrom(
      this.interviewClient.send('interview.get_details', {
        id,
        userId: user.sub,
        role: user.role,
      }),
    );
  }

  @Post(':id/my-feedback')
  @ApiOperation({ summary: 'Record current HR evaluator feedback' })
  recordMyFeedback(
    @Param('id') interviewId: string,
    @Body()
    body: {
      decision: 'PASS' | 'FAIL';
      technical: number;
      communication: number;
      culture: number;
      notes?: string;
    },
    @CurrentUser() user: any,
  ) {
    return firstValueFrom(
      this.interviewClient.send('interview.record_my_feedback', {
        interviewId,
        ...body,
        evaluatorId: user.sub,
        actorRole: user.role,
      }),
    );
  }

  @Post(':id/final-recommendation')
  @ApiOperation({ summary: 'Submit HR final recommendation for Admin final decision' })
  submitFinalRecommendation(
    @Param('id') interviewId: string,
    @Body()
    body: {
      finalRecommendation: string;
      summaryNotes?: string;
    },
    @CurrentUser() user: any,
  ) {
    return firstValueFrom(
      this.interviewClient.send('interview.record_result', {
        interviewId,
        feedbacks: [],
        finalRecommendation: body.finalRecommendation,
        summaryNotes: body.summaryNotes,
        evaluatorId: user.sub,
      }),
    );
  }
}
