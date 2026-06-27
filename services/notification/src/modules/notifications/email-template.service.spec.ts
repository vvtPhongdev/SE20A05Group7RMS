import { Test, TestingModule } from '@nestjs/testing';
import { EmailTemplateService } from './email-template.service';
import { EmailTemplateType } from '@wr/contracts';

describe('EmailTemplateService', () => {
  let service: EmailTemplateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailTemplateService],
    }).compile();

    service = module.get<EmailTemplateService>(EmailTemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('render', () => {
    it('should render a task deadline reminder', () => {
      const result = service.render(EmailTemplateType.TASK_DEADLINE_REMINDER, {
        recipientName: 'Task Owner',
        taskType: 'JOB_POSTING',
        position: 'Backend Engineer',
        timing: 'due within 24 hours',
        deadline: '21 June 2026',
      });

      expect(result.subject).toContain('Backend Engineer');
      expect(result.body).toContain('due within 24 hours');
    });

    it('should render INTERVIEW_INVITATION with interpolated placeholders', () => {
      const data = {
        recipientName: 'John Doe',
        position: 'Software Engineer',
        scheduledAt: 'Tuesday, June 16, 2026 at 2:00 PM',
        location: 'https://zoom.us/j/123456789',
        preparationInstructions: 'Bring a coding device.',
      };

      const result = service.render(EmailTemplateType.INTERVIEW_INVITATION, data);

      expect(result.subject).toBe('Interview Invitation: Software Engineer');
      expect(result.body).toContain('Dear John Doe,');
      expect(result.body).toContain('position of Software Engineer');
      expect(result.body).toContain('Date & Time: Tuesday, June 16, 2026 at 2:00 PM');
      expect(result.body).toContain('Location/Link: https://zoom.us/j/123456789');
      expect(result.body).toContain('Bring a coding device.');
    });

    it('should render OFFER_LETTER with interpolated placeholders', () => {
      const data = {
        candidateName: 'Jane Smith',
        position: 'Product Manager',
        offerContent: 'We offer you $120k/year starting from July 1st.',
        nextSteps: 'Sign the PDF on our portal.',
        responseDeadline: 'June 20, 2026',
      };

      const result = service.render(EmailTemplateType.OFFER_LETTER, data);

      expect(result.subject).toBe('Offer Letter: Product Manager');
      expect(result.body).toContain('Dear Jane Smith,');
      expect(result.body).toContain('offer for the position of Product Manager');
      expect(result.body).toContain('We offer you $120k/year starting from July 1st.');
      expect(result.body).toContain('Sign the PDF on our portal.');
      expect(result.body).toContain('Please respond by: June 20, 2026');
    });

    it('should render REJECTION with interpolated placeholders', () => {
      const data = {
        candidateName: 'Bob Johnson',
        position: 'DevOps Engineer',
        rejectionReason: 'Need more hands-on Kubernetes experience.',
      };

      const result = service.render(EmailTemplateType.REJECTION, data);

      expect(result.subject).toBe('Application Update: DevOps Engineer');
      expect(result.body).toContain('Dear Bob Johnson,');
      expect(result.body).toContain('position of DevOps Engineer');
      expect(result.body).toContain('Need more hands-on Kubernetes experience.');
    });

    it('should throw an error for unknown template types', () => {
      expect(() => {
        service.render('UNKNOWN_TEMPLATE_TYPE', {});
      }).toThrow('Unknown email template type: UNKNOWN_TEMPLATE_TYPE');
    });
  });
});
