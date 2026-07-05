import { of } from 'rxjs';
import { OfferResponse, OfferStatus, RecruitmentRequestStatus } from '@wr/contracts';
import { OfferLetterService } from './offer-letter.service';

describe('OfferLetterService', () => {
  const prisma = {
    recruitmentRequest: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    offerLetter: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    application: { update: jest.fn() },
    requestLog: { create: jest.fn() },
    emailLog: { create: jest.fn() },
    notification: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  const emailQueue = { add: jest.fn() };
  const notificationClient = {
    send: jest.fn().mockImplementation((pattern) => {
      if (pattern === 'notification.render_template') {
        return of({
          subject: 'Rendered Offer Letter Subject',
          body: 'Rendered Offer Letter Body',
        });
      }
      return of({
        subscribe: jest.fn(),
      });
    }),
  };
  const service = new OfferLetterService(
    prisma as any,
    emailQueue as any,
    notificationClient as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates a draft letter from request and department data', async () => {
    prisma.recruitmentRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      position: 'Backend Engineer',
      status: RecruitmentRequestStatus.OFFER_EXTENDED,
      department: { name: 'Engineering' },
      applications: [
        {
          status: RecruitmentRequestStatus.OFFER_EXTENDED,
          candidate: { fullName: 'Candidate One' },
        },
      ],
    });
    prisma.offerLetter.findUnique.mockResolvedValue(null);
    prisma.offerLetter.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'offer-1', ...data }),
    );

    const result = await service.generate(
      'request-1',
      {
        candidateId: 'candidate-1',
        compensation: '45,000,000 VND gross per month',
        startDate: '2026-07-15T00:00:00.000Z',
      },
      'hr-1',
    );

    expect(result.status).toBe(OfferStatus.DRAFT);
    expect(result.content).toContain('Dear CANDIDATE ONE,');
    expect(result.content).toContain('formal offer of employment for the position of Backend Engineer');
    expect(result.content).toContain('Candidate: CANDIDATE ONE');
    expect(result.content).toContain('Position: Backend Engineer');
    expect(result.content).toContain('Engineering');
    expect(result.content).toContain('45,000,000 VND');
    expect(result.content).toContain('Proposed Start Date: 2026-07-15');
    expect(result.content).toContain('Warm regards,');
  });

  it('queues the reviewed offer for email delivery', async () => {
    prisma.offerLetter.findUnique.mockResolvedValue({
      id: 'offer-1',
      requestId: 'request-1',
      candidateId: 'candidate-1',
      positionTitle: 'Backend Engineer',
      content: 'Offer letter content',
      status: OfferStatus.DRAFT,
      candidate: {
        userId: 'user-1',
        email: 'candidate@example.com',
      },
      request: { id: 'request-1' },
    });
    prisma.emailLog.create.mockReturnValue({ operation: 'email' });
    prisma.offerLetter.update
      .mockReturnValueOnce({ operation: 'offer' })
      .mockResolvedValueOnce({ id: 'offer-1' });
    prisma.recruitmentRequest.update.mockReturnValue({ operation: 'request' });
    prisma.application.update.mockReturnValue({ operation: 'application' });
    prisma.requestLog.create.mockReturnValue({ operation: 'log' });
    prisma.notification.create.mockReturnValue({ operation: 'notification' });
    prisma.$transaction.mockResolvedValue([
      { id: 'email-1' },
      { id: 'offer-1', status: OfferStatus.SENT },
    ]);

    await service.send('offer-1', 'hr-1');

    expect(emailQueue.add).toHaveBeenCalledWith(
      'send-email',
      expect.objectContaining({
        emailLogId: 'email-1',
        to: 'candidate@example.com',
        subject: 'Job Offer: Backend Engineer - [Company Name]',
        body: 'Offer letter content',
      }),
      expect.any(Object),
    );
    expect(prisma.emailLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subject: 'Job Offer: Backend Engineer - [Company Name]',
          body: 'Offer letter content',
        }),
      }),
    );
  });

  it('closes the workflow when a candidate accepts an offer', async () => {
    prisma.offerLetter.findUnique.mockResolvedValue({
      id: 'offer-1',
      requestId: 'request-1',
      candidateId: 'candidate-1',
      positionTitle: 'Backend Engineer',
      status: OfferStatus.SENT,
      candidate: {
        userId: 'user-1',
        email: 'candidate@example.com',
      },
      request: {
        id: 'request-1',
        status: RecruitmentRequestStatus.OFFER_EXTENDED,
        createdById: 'dept-head-1',
      },
    });
    prisma.offerLetter.update.mockReturnValue({ operation: 'offer' });
    prisma.application.update.mockReturnValue({ operation: 'application' });
    prisma.recruitmentRequest.update.mockReturnValue({ operation: 'request' });
    prisma.requestLog.create.mockReturnValue({ operation: 'log' });
    prisma.$transaction.mockResolvedValue([{ id: 'offer-1', status: OfferStatus.ACCEPTED }]);

    const result = await service.respond(
      'offer-1',
      OfferResponse.ACCEPT,
      'user-1',
      'Happy to join',
    );

    expect(prisma.offerLetter.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          response: OfferResponse.ACCEPT,
          responseNote: 'Happy to join',
        }),
      }),
    );

    expect(prisma.application.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: RecruitmentRequestStatus.HIRED },
      }),
    );
    expect(prisma.recruitmentRequest.update).toHaveBeenCalledWith({
      where: { id: 'request-1' },
      data: { status: RecruitmentRequestStatus.COMPLETED },
    });
    expect(prisma.requestLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'OFFER_ACCEPTED',
          fromStatus: RecruitmentRequestStatus.OFFER_EXTENDED,
          toStatus: RecruitmentRequestStatus.OFFER_ACCEPTED,
        }),
      }),
    );
    expect(prisma.requestLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'CANDIDATE_HIRED',
          fromStatus: RecruitmentRequestStatus.OFFER_ACCEPTED,
          toStatus: RecruitmentRequestStatus.HIRED,
        }),
      }),
    );
    expect(prisma.requestLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'CAMPAIGN_COMPLETED',
          fromStatus: RecruitmentRequestStatus.HIRED,
          toStatus: RecruitmentRequestStatus.COMPLETED,
        }),
      }),
    );
    expect(result.status).toBe(OfferStatus.ACCEPTED);
  });
});
