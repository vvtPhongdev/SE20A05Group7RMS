import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@wr/contracts';
import { firstValueFrom } from 'rxjs';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { SERVICE_TOKENS } from '../constants';

@ApiTags('Department Head Interview Feedback')
@ApiBearerAuth()
@Roles(UserRole.DEPARTMENT_HEAD)
@Controller('dept-head/interview-feedback')
export class DeptHeadInterviewFeedbackController {
  constructor(@Inject(SERVICE_TOKENS.INTERVIEW) private readonly interviewClient: ClientProxy) {}

  @Get()
  @ApiOperation({ summary: 'List completed or past interviews available for department-head feedback' })
  list(@CurrentUser() user: any) {
    return firstValueFrom(
      this.interviewClient.send('interview.list_completed', {
        userId: user.sub,
        role: user.role,
      }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department-head interview feedback details' })
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
  @ApiOperation({ summary: 'Record department-head feedback for an interview' })
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
}
