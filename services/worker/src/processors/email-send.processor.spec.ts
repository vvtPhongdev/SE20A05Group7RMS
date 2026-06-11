import { processEmailSendJob } from './email-send.processor';
import { PrismaClient } from '@prisma/client';
import * as nodemailer from 'nodemailer';
import { logger } from '../logger';

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    emailLog: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

jest.mock('nodemailer', () => {
  const mockTransporter = {
    sendMail: jest.fn().mockResolvedValue({ messageId: 'msg-1' }),
  };
  return {
    createTransport: jest.fn().mockReturnValue(mockTransporter),
  };
});

describe('processEmailSendJob', () => {
  let prismaMock: any;
  let transporterMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock = new PrismaClient() as any;
    transporterMock = (nodemailer.createTransport as jest.Mock)();
  });

  it('skips email sending if email status is SENT', async () => {
    prismaMock.emailLog.findUnique.mockResolvedValue({
      id: 'email-1',
      status: 'SENT',
    });

    const consoleSpy = jest.spyOn(logger, 'log').mockImplementation();

    await processEmailSendJob({
      emailLogId: 'email-1',
      to: 'user@example.com',
      subject: 'Test Subject',
      body: 'Test Body',
    });

    expect(prismaMock.emailLog.findUnique).toHaveBeenCalledWith({
      where: { id: 'email-1' },
    });
    expect(transporterMock.sendMail).not.toHaveBeenCalled();
    expect(prismaMock.emailLog.update).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Idempotency] Email email-1 has already been sent'),
    );
    consoleSpy.mockRestore();
  });

  it('sends email and updates status if email status is not SENT', async () => {
    prismaMock.emailLog.findUnique.mockResolvedValue({
      id: 'email-2',
      status: 'PENDING',
    });

    await processEmailSendJob({
      emailLogId: 'email-2',
      to: 'user@example.com',
      subject: 'Test Subject',
      body: 'Test Body',
    });

    expect(prismaMock.emailLog.findUnique).toHaveBeenCalledWith({
      where: { id: 'email-2' },
    });
    expect(transporterMock.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'Test Subject',
        text: 'Test Body',
      }),
    );
    expect(prismaMock.emailLog.update).toHaveBeenCalledWith({
      where: { id: 'email-2' },
      data: expect.objectContaining({
        status: 'SENT',
        sentAt: expect.any(Date),
      }),
    });
  });
});
