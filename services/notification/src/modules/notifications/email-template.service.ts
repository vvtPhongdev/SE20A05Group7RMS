import { Injectable } from '@nestjs/common';
import { EmailTemplateType } from '@wr/contracts';

const TEMPLATES = {
  [EmailTemplateType.INTERVIEW_INVITATION]: {
    subject: 'Interview Invitation: {{position}}',
    body: `Dear {{recipientName}},

You have been invited to an interview for the position of {{position}}.

Interview Details:
- Date & Time: {{scheduledAt}}
- Location/Link: {{location}}

Preparation Instructions:
{{preparationInstructions}}

Best regards,
HR Team — Works Recruiter`,
  },
  [EmailTemplateType.OFFER_LETTER]: {
    subject: 'Offer Letter: {{position}}',
    body: `Dear {{candidateName}},

We are pleased to extend you an offer for the position of {{position}}.

Please find the details of your offer below:
----------------------------------------
{{offerContent}}
----------------------------------------

Next Steps:
{{nextSteps}}

Please respond by: {{responseDeadline}}

Sincerely,
HR Team — Works Recruiter`,
  },
  [EmailTemplateType.REJECTION]: {
    subject: 'Application Update: {{position}}',
    body: `Dear {{candidateName}},

Thank you for your interest in the position of {{position}} and for taking the time to speak with us.

After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.

Feedback:
{{rejectionReason}}

We wish you the best of luck in your job search and future professional endeavors.

Sincerely,
HR Team — Works Recruiter`,
  },
};

@Injectable()
export class EmailTemplateService {
  render(
    type: EmailTemplateType | string,
    data: Record<string, any>,
  ): { subject: string; body: string } {
    const template = TEMPLATES[type as EmailTemplateType];
    if (!template) {
      throw new Error(`Unknown email template type: ${type}`);
    }

    const subject = this.interpolate(template.subject, data);
    const body = this.interpolate(template.body, data);

    return { subject, body };
  }

  private interpolate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }
}
