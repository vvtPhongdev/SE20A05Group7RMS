import { Controller, Get, Post, Patch, Body, Param, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SERVICE_TOKENS } from '../constants';
import { firstValueFrom } from 'rxjs';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@wr/contracts';

@ApiTags('Interviews')
@ApiBearerAuth()
@Controller('interviews')
export class InterviewController {
  constructor(
    @Inject(SERVICE_TOKENS.INTERVIEW) private readonly interviewClient: ClientProxy,
  ) {}

  // ─── Schedules ────────────────────────────────────────────────────

  @Post('schedules')
  @Roles(UserRole.HR_MANAGER)
  @ApiOperation({ summary: 'FR-12 + FR-07: Create interview schedule (plan-locked, conflict-checked)' })
  createSchedule(
    @Body()
    body: {
      requestId: string;
      candidateId: string;
      scheduledAt: string;
      duration: number;
      location: string;
      interviewers: string[];
    },
  ) {
    return firstValueFrom(this.interviewClient.send('interview.create_schedule', body));
  }

  @Get('schedules/:id')
  @Roles(UserRole.HR_MANAGER, UserRole.ADMIN, UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'Get interview schedule by ID' })
  getSchedule(@Param('id') id: string) {
    return firstValueFrom(this.interviewClient.send('interview.get_schedule', { id }));
  }

  @Get('requests/:requestId/schedules')
  @Roles(UserRole.HR_MANAGER, UserRole.ADMIN, UserRole.DEPARTMENT_HEAD)
  @ApiOperation({ summary: 'List all interview schedules for a recruitment request' })
  listSchedules(@Param('requestId') requestId: string) {
    return firstValueFrom(this.interviewClient.send('interview.list_schedules', { requestId }));
  }

  @Patch('schedules/:id/reschedule')
  @Roles(UserRole.HR_MANAGER)
  @ApiOperation({ summary: 'T-051: Reschedule interview — conflict-checked, notifies all parties' })
  rescheduleSchedule(
    @Param('id') id: string,
    @Body()
    body: {
      scheduledAt: string;
      duration: number;
      location: string;
      interviewers: string[];
      reason: string;
    },
  ) {
    return firstValueFrom(
      this.interviewClient.send('interview.reschedule_schedule', { id, ...body }),
    );
  }

  @Patch('schedules/:id/cancel')
  @Roles(UserRole.HR_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancel an interview schedule' })
  cancelSchedule(@Param('id') id: string, @Body() body: { cancelledBy: string }) {
    return firstValueFrom(
      this.interviewClient.send('interview.cancel_schedule', { id, ...body }),
    );
  }

  // ─── Invitations (FR-13) ──────────────────────────────────────────

  @Post('schedules/:id/invitations')
  @Roles(UserRole.HR_MANAGER)
  @ApiOperation({ summary: 'FR-13: Send interview invitations to candidate and panel' })
  sendInvitations(
    @Param('id') interviewId: string,
    @Body()
    body: {
      recipients: Array<{ email: string; name: string; role: string }>;
    },
  ) {
    return firstValueFrom(
      this.interviewClient.send('interview.send_invitations', { interviewId, ...body }),
    );
  }

  @Get('schedules/:id/email-logs')
  @Roles(UserRole.HR_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get invitation email delivery logs for an interview' })
  getEmailLogs(@Param('id') interviewId: string) {
    return firstValueFrom(
      this.interviewClient.send('interview.get_email_logs', { interviewId }),
    );
  }

  // ─── Results (FR-14) ──────────────────────────────────────────────

  @Post('schedules/:id/results')
  @Roles(UserRole.HR_MANAGER)
  @ApiOperation({ summary: 'FR-14: Record interview result (PASS/FAIL) with panel notes' })
  recordResult(
    @Param('id') interviewId: string,
    @Body() body: { result: string; notes: string },
  ) {
    return firstValueFrom(
      this.interviewClient.send('interview.record_result', { interviewId, ...body }),
    );
  }
}
