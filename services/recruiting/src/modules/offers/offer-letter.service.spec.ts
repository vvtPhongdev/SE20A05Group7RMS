import {
  OfferStatus,
  RecruitmentRequestStatus,
} from '@wr/contracts';
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
    $transaction: jest.fn(),
  };
  const emailQueue = { add: jest.fn() };
  const service = new OfferLetterService(prisma as any, emailQueue as any);

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
    expect(result.content).toContain('Backend Engineer');
    expect(result.content).toContain('Engineering');
    expect(result.content).toContain('45,000,000 VND');
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
      }),
      expect.any(Object),
    );
  });
});
