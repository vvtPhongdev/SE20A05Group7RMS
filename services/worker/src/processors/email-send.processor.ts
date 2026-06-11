// import { PrismaClient } from '@prisma/client';
// import { EmailSendJobPayload, EmailStatus } from '@wr/contracts';
// import * as nodemailer from 'nodemailer';
// import * as path from 'path';
// import * as fs from 'fs';

// const prisma = new PrismaClient({
//   log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
// });

// function getLogoPath(): string | null {
//   const logoPath = path.join(__dirname, '../../../../assets/logo.png');
//   return fs.existsSync(logoPath) ? logoPath : null;
// }

// interface TemplateConfig {
//   primaryColor: string;
//   bannerBg: string;
//   bannerText: string;
//   icon: string;
//   title: string;
// }

// function getTemplateConfig(subject: string): TemplateConfig {
//   const sub = subject.toLowerCase();

//   // 1. Verification / OTP
//   if (
//     sub.includes('registration') ||
//     sub.includes('verification') ||
//     sub.includes('password reset')
//   ) {
//     return {
//       primaryColor: '#4f46e5', // Indigo
//       bannerBg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
//       bannerText: '#ffffff',
//       icon: '🔑',
//       title: 'Security Verification',
//     };
//   }

//   // 2. Offer Letters
//   if (
//     sub.includes('offer letter') ||
//     sub.includes('selected') ||
//     (sub.includes('hiring') && sub.includes('decision') && !sub.includes('reject'))
//   ) {
//     return {
//       primaryColor: '#10b981', // Emerald Green
//       bannerBg: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
//       bannerText: '#ffffff',
//       icon: '🎉',
//       title: 'Formal Job Offer',
//     };
//   }

//   // 3. Rejections
//   if (
//     sub.includes('reject') ||
//     sub.includes('not selected') ||
//     (sub.includes('update') && sub.includes('application'))
//   ) {
//     return {
//       primaryColor: '#6b7280', // Gray
//       bannerBg: 'linear-gradient(135deg, #9ca3af 0%, #4b5563 100%)',
//       bannerText: '#ffffff',
//       icon: '✉️',
//       title: 'Application Update',
//     };
//   }

//   // 4. Interviews
//   if (
//     sub.includes('interview') ||
//     sub.includes('schedule') ||
//     sub.includes('invitation') ||
//     sub.includes('rescheduled') ||
//     sub.includes('cancelled')
//   ) {
//     return {
//       primaryColor: '#3b82f6', // Blue
//       bannerBg: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
//       bannerText: '#ffffff',
//       icon: '🗓️',
//       title: 'Interview Details',
//     };
//   }

//   // 5. Default fallback
//   return {
//     primaryColor: '#4f46e5',
//     bannerBg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
//     bannerText: '#ffffff',
//     icon: '🔔',
//     title: 'Recruitment Update',
//   };
// }

// function buildHtmlTemplate(subject: string, body: string, hasLogo: boolean): string {
//   const config = getTemplateConfig(subject);

//   // Convert plain text newlines to HTML paragraphs
//   const formattedBody = body
//     .trim()
//     .split('\n\n')
//     .map(
//       (paragraph) =>
//         `<p style="margin: 0 0 16px 0; line-height: 1.6;">${paragraph.replace(/\n/g, '<br>')}</p>`,
//     )
//     .join('');

//   const logoHtml = hasLogo
//     ? `<!-- LOGO HEADER -->
//         <div style="margin-bottom: 24px; text-align: center;">
//           <img src="cid:logo" alt="RMS Recruiter Logo" style="height: 50px; max-width: 200px; display: inline-block; object-fit: contain;" />
//         </div>`
//     : '';

//   return `
// <!DOCTYPE html>
// <html>
// <head>
//   <meta charset="utf-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <title>${subject}</title>
// </head>
// <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
//   <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
//     <tr>
//       <td align="center">
//         ${logoHtml}
//         <table width="100%" max-width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
//           <!-- BANNER HEADER -->
//           <tr>
//             <td style="background: ${config.bannerBg}; padding: 40px 30px; text-align: center; color: ${config.bannerText};">
//               <div style="font-size: 48px; margin-bottom: 16px;">${config.icon}</div>
//               <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; font-family: inherit;">${config.title}</h1>
//               <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">${subject}</p>
//             </td>
//           </tr>
//           <!-- CARD CONTENT -->
//           <tr>
//             <td style="padding: 40px 30px; color: #1e293b; font-size: 16px; font-family: inherit;">
//               <div style="margin-bottom: 24px;">
//                 ${formattedBody}
//               </div>
//             </td>
//           </tr>
//           <!-- FOOTER -->
//           <tr>
//             <td style="background-color: #f1f5f9; padding: 24px 30px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; font-family: inherit;">
//               <p style="margin: 0 0 8px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #475569;">Works Recruiter System (RMS)</p>
//               <p style="margin: 0 0 12px 0; line-height: 1.5;">This is an automated notification. Please do not reply directly to this email.</p>
//               <div style="border-top: 1px solid #cbd5e1; margin: 12px 0;"></div>
//               <p style="margin: 0; font-size: 11px; opacity: 0.8; line-height: 1.4;">Confidentiality Notice: This message contains confidential information and is intended solely for the individual named. If you are not the intended recipient, please destroy this message immediately.</p>
//             </td>
//           </tr>
//         </table>
//       </td>
//     </tr>
//   </table>
// </body>
// </html>
//   `.trim();
// }

// export async function processEmailSendJob(payload: EmailSendJobPayload): Promise<void> {
//   const { emailLogId, to, subject, body } = payload;

//   const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST || 'localhost',
//     port: parseInt(process.env.SMTP_PORT || '1025', 10),
//     secure: process.env.SMTP_PORT === '465',
//     auth: process.env.SMTP_USER
//       ? {
//           user: process.env.SMTP_USER,
//           pass: process.env.SMTP_PASS,
//         }
//       : undefined,
//   });

//   const logoPath = getLogoPath();
//   const html = buildHtmlTemplate(subject, body, !!logoPath);

//   try {
//     await transporter.sendMail({
//       from: process.env.SMTP_FROM || 'Works Reruiter <noreply@worksreruiter.com>',
//       to,
//       subject,
//       text: body,
//       html,
//       attachments: logoPath
//         ? [
//             {
//               filename: 'logo.png',
//               path: logoPath,
//               cid: 'logo',
//             },
//           ]
//         : undefined,
//     });

//     await prisma.emailLog.update({
//       where: { id: emailLogId },
//       data: {
//         status: EmailStatus.SENT,
//         sentAt: new Date(),
//       },
//     });
//   } catch (error: any) {
//     console.error(`Failed to send email ${emailLogId}:`, error);
//     await prisma.emailLog.update({
//       where: { id: emailLogId },
//       data: {
//         status: EmailStatus.FAILED,
//         errorMessage: error.message || String(error),
//       },
//     });
//     throw error;
//   }
// }
import { PrismaClient } from '@prisma/client';
import { EmailSendJobPayload, EmailStatus } from '@wr/contracts';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';
import { config } from '../config';

const prisma = new PrismaClient({
  log: config.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
});

// 1. TỐI ƯU HIỆU NĂNG: Khởi tạo transporter một lần ở global scope
const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_PORT === 465,
  auth: config.SMTP_USER
    ? {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      }
    : undefined,
});

function getLogoPath(): string | null {
  const logoPath = path.join(__dirname, '../../../../assets/logo.png');
  return fs.existsSync(logoPath) ? logoPath : null;
}

interface TemplateConfig {
  primaryColor: string;
  bannerBg: string;
  bannerText: string;
  icon: string;
  title: string;
}

function getTemplateConfig(subject: string): TemplateConfig {
  const sub = subject.toLowerCase();

  if (
    sub.includes('registration') ||
    sub.includes('verification') ||
    sub.includes('password reset')
  ) {
    return {
      primaryColor: '#4f46e5',
      bannerBg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      bannerText: '#ffffff',
      icon: '🔑',
      title: 'Security Verification',
    };
  }

  if (
    sub.includes('offer letter') ||
    sub.includes('selected') ||
    (sub.includes('hiring') && sub.includes('decision') && !sub.includes('reject'))
  ) {
    return {
      primaryColor: '#10b981',
      bannerBg: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
      bannerText: '#ffffff',
      icon: '🎉',
      title: 'Formal Job Offer',
    };
  }

  if (
    sub.includes('reject') ||
    sub.includes('not selected') ||
    (sub.includes('update') && sub.includes('application'))
  ) {
    return {
      primaryColor: '#6b7280',
      bannerBg: 'linear-gradient(135deg, #9ca3af 0%, #4b5563 100%)',
      bannerText: '#ffffff',
      icon: '✉️',
      title: 'Application Update',
    };
  }

  if (
    sub.includes('interview') ||
    sub.includes('schedule') ||
    sub.includes('invitation') ||
    sub.includes('rescheduled') ||
    sub.includes('cancelled')
  ) {
    return {
      primaryColor: '#3b82f6',
      bannerBg: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
      bannerText: '#ffffff',
      icon: '🗓️',
      title: 'Interview Details',
    };
  }

  return {
    primaryColor: '#4f46e5',
    bannerBg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    bannerText: '#ffffff',
    icon: '🔔',
    title: 'Recruitment Update',
  };
}

// Hàm giải quyết triệt để nguy cơ phá vỡ giao diện HTML do ký tự lạ nhập từ người dùng
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildHtmlTemplate(subject: string, body: string, hasLogo: boolean): string {
  const config = getTemplateConfig(subject);

  const safeBody = escapeHtml(body.trim());
  const formattedBody = safeBody
    .split(/\n\s*\n/)
    .map(
      (paragraph) =>
        `<p style="margin: 0 0 16px 0; line-height: 1.6;">${paragraph.replace(/\n/g, '<br>')}</p>`,
    )
    .join('');

  // 2. CĂN CHỈNH LOGO: Chuyển div thành tr/td table chuẩn hóa để tương thích mọi ứng dụng mail
  const logoRowHtml = hasLogo
    ? `<tr>
         <td align="center" style="padding-bottom: 24px;">
           <img src="cid:logo" alt="RMS Recruiter Logo" style="height: 45px; max-width: 180px; display: block; object-fit: contain; border: 0;" />
         </td>
       </tr>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
          ${logoRowHtml}
          <tr>
            <td>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <tr>
                  <td style="background: ${config.bannerBg}; padding: 40px 30px; text-align: center; color: ${config.bannerText};">
                    <div style="font-size: 48px; margin-bottom: 16px;">${config.icon}</div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; font-family: inherit;">${config.title}</h1>
                    <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">${escapeHtml(subject)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px; color: #1e293b; font-size: 16px; font-family: inherit;">
                    <div style="margin-bottom: 24px;">
                      ${formattedBody}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f1f5f9; padding: 24px 30px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; font-family: inherit;">
                    <p style="margin: 0 0 8px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #475569;">Works Recruiter System (RMS)</p>
                    <p style="margin: 0 0 12px 0; line-height: 1.5;">This is an automated notification. Please do not reply directly to this email.</p>
                    <div style="border-top: 1px solid #cbd5e1; margin: 12px 0;"></div>
                    <p style="margin: 0; font-size: 11px; opacity: 0.8; line-height: 1.4;">Confidentiality Notice: This message contains confidential information and is intended solely for the individual named. If you are not the intended recipient, please destroy this message immediately.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function processEmailSendJob(payload: EmailSendJobPayload): Promise<void> {
  const { emailLogId, to, subject, body } = payload;

  const logoPath = getLogoPath();
  const html = buildHtmlTemplate(subject, body, !!logoPath);

  try {
    await transporter.sendMail({
      // 3. SỬA LỖI CHÍNH TẢ: Thay thế 'Works Reruiter' thành 'Works Recruiter' đúng chính tả
      from: config.SMTP_FROM,
      to,
      subject,
      text: body,
      html,
      attachments: logoPath
        ? [
            {
              filename: 'logo.png',
              path: logoPath,
              cid: 'logo',
            },
          ]
        : undefined,
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
