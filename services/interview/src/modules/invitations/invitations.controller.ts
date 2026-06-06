import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InvitationsService } from './invitations.service';

@Controller()
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  /**
   * FR-13: Send interview invitations to candidate, Department Head, and Admin.
   * Triggered by HR Manager after scheduling an interview.
   */
  @MessagePattern('interview.send_invitations')
  async sendInvitations(
    @Payload()
    payload: {
      interviewId: string;
      /** Email + name for each recipient */
      recipients: Array<{ email: string; name: string; role: string }>;
    },
  ) {
    return this.invitationsService.sendInvitations(payload);
  }

  @MessagePattern('interview.get_email_logs')
  async getEmailLogs(@Payload() payload: { interviewId: string }) {
    return this.invitationsService.getEmailLogs(payload.interviewId);
  }
}
