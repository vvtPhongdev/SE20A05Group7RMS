import { PrismaClient } from '@prisma/client';
import { EmailSendJobPayload, EmailStatus } from '@wr/contracts';
import * as nodemailer from 'nodemailer';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
});

export async function processEmailSendJob(payload: EmailSendJobPayload): Promise<void> {
  const { emailLogId, to, subject, body } = payload;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Works Reruiter <noreply@worksreruiter.com>',
      to,
      subject,
      html: body.replace(/\n/g, '<br>'),
      text: body,
    });

    await prisma.emailLog.update({
      where: { id: emailLogId },
      data: {
        status: EmailStatus.SENT,
        sentAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error(`Failed to send email ${emailLogId}:`, error);
    await prisma.emailLog.update({
      where: { id: emailLogId },
      data: {
        status: EmailStatus.FAILED,
        errorMessage: error.message || String(error),
      },
    });
    throw error;
  }
}
