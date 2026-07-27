import { Injectable, HttpStatus, OnModuleDestroy } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { config } from '../../config';
import { PrismaService } from '../../common/database/prisma.service';
import {
  RegisterUserSchema,
  RegisterUserInput,
  AuthTokenResponse,
  LoginSchema,
  LoginInput,
  SupabaseLoginSchema,
  SupabaseLoginInput,
  SupabaseRegisterSchema,
  SupabaseRegisterInput,
  RefreshTokenSchema,
  ForgotPasswordSchema,
  ForgotPasswordInput,
  ResetPasswordSchema,
  ResetPasswordInput,
  UpdateAccountSchema,
  UpdateAccountInput,
  VerifyRegisterSchema,
  VerifyRegisterInput,
  CreateOrganizationInvitationSchema,
  CreateOrganizationInvitationInput,
  ValidateOrganizationInvitationSchema,
  ValidateOrganizationInvitationInput,
  ListOrganizationInvitationsSchema,
  ListOrganizationInvitationsInput,
  ManageOrganizationInvitationSchema,
  ManageOrganizationInvitationInput,
  UserRole,
} from '@wr/contracts';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import IORedis from 'ioredis';

const INVITATION_RESEND_COOLDOWN_MS = 5 * 60 * 1000;
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';

function getLogoPath(): string | null {
  const logoPath = path.join(__dirname, '../../../../../webapp/public/logo-offical.svg');
  return fs.existsSync(logoPath) ? logoPath : null;
}

function buildAuthHtmlTemplate(title: string, bodyHtml: string, hasLogo: boolean): string {
  const logoHtml = hasLogo
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
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
          ${logoHtml}
          <tr>
            <td>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <!-- HEADER BANNER -->
                <tr>
                  <td style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 40px 30px; text-align: center; color: #ffffff;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🔑</div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; font-family: inherit;">${title}</h1>
                  </td>
                </tr>
                <!-- CONTENT -->
                <tr>
                  <td style="padding: 40px 30px; color: #1e293b; font-size: 16px; font-family: inherit; line-height: 1.6;">
                    ${bodyHtml}
                  </td>
                </tr>
                <!-- FOOTER -->
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

@Injectable()
export class AuthService implements OnModuleDestroy {
  private readonly redis: IORedis;
  private readonly supabase: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    const redisUrl = config.REDIS_URL;
    if (redisUrl && redisUrl !== 'localhost') {
      this.redis = new IORedis(redisUrl, {
        maxRetriesPerRequest: null,
      });
    } else {
      this.redis = new IORedis({
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        maxRetriesPerRequest: null,
      });
    }

    this.supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  private async storeRefreshToken(tokenHash: string, userId: string) {
    try {
      await this.redis.set(`refresh:${tokenHash}`, userId, 'EX', 2592000);
    } catch (error) {
      if (config.NODE_ENV === 'development') {
        console.warn(
          'Redis is unavailable or rate-limited; continuing login without persisting the refresh token.',
          error instanceof Error ? error.message : error,
        );
        return;
      }

      throw error;
    }
  }

  private async issueRmsTokens(user: {
    id: string;
    email: string;
    displayName: string;
    role: string;
    organizationId: string | null;
  }): Promise<AuthTokenResponse> {
    const payload = {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      organizationId: user.organizationId,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await this.storeRefreshToken(tokenHash, user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }

  private async getVerifiedSupabaseIdentity(accessToken: string) {
    const { data, error } = await this.supabase.auth.getUser(accessToken);
    const supabaseUser = data.user;

    if (error || !supabaseUser?.email) {
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Invalid Supabase session',
      });
    }

    const metadata = supabaseUser.user_metadata ?? {};
    const displayName =
      typeof metadata.full_name === 'string'
        ? metadata.full_name
        : typeof metadata.name === 'string'
          ? metadata.name
          : supabaseUser.email;

    return {
      id: supabaseUser.id,
      email: supabaseUser.email.toLowerCase(),
      displayName,
    };
  }

  async updateAccount(payload: { userId: string } & UpdateAccountInput) {
    const { userId, ...input } = payload;
    const parsed = UpdateAccountSchema.parse(input);
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!existing) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `User with ID ${userId} not found`,
      });
    }

    const previousEmail = existing.email.toLowerCase();
    const nextEmail = parsed.email ?? previousEmail;
    const emailChanged = nextEmail !== previousEmail;

    if (emailChanged) {
      const conflictingUser = await this.prisma.user.findUnique({
        where: { email: nextEmail },
        select: { id: true },
      });

      if (conflictingUser && conflictingUser.id !== userId) {
        throw new RpcException({
          status: HttpStatus.CONFLICT,
          message: 'Email is already used by another RMS account',
        });
      }

      if (!existing.passwordHash && !parsed.supabaseAccessToken) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Sign in with Google again before changing your email',
        });
      }
    }

    let syncedSupabaseUserId: string | null = null;
    if (emailChanged && parsed.supabaseAccessToken) {
      const supabaseIdentity = await this.getVerifiedSupabaseIdentity(parsed.supabaseAccessToken);
      if (supabaseIdentity.email !== previousEmail) {
        throw new RpcException({
          status: HttpStatus.UNAUTHORIZED,
          message: 'Supabase session does not match the current RMS account',
        });
      }

      const { error } = await this.supabase.auth.admin.updateUserById(supabaseIdentity.id, {
        email: nextEmail,
        email_confirm: true,
      });
      if (error) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Unable to update the linked sign-in email',
        });
      }
      syncedSupabaseUserId = supabaseIdentity.id;
    }

    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          displayName: parsed.displayName,
          email: nextEmail,
          phone: parsed.phone === '' ? null : parsed.phone,
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          organizationId: true,
          departmentId: true,
          phone: true,
          avatar: true,
          isActive: true,
          department: {
            select: { id: true, name: true, code: true },
          },
          departmentsHeaded: {
            select: { id: true, name: true, code: true },
          },
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (syncedSupabaseUserId) {
        await this.supabase.auth.admin
          .updateUserById(syncedSupabaseUserId, {
            email: previousEmail,
            email_confirm: true,
          })
          .catch(() => undefined);
      }
      throw error;
    }
  }

  private async getOrCreateDefaultOrganization() {
    let organization = await this.prisma.organization.findFirst();
    if (!organization) {
      organization = await this.prisma.organization.create({
        data: {
          name: 'Acme Corporation',
          slug: 'acme-corp',
        },
      });
    }

    return organization;
  }

  private invitationError(message: string): never {
    throw new RpcException({ status: HttpStatus.BAD_REQUEST, message });
  }

  private async resolveInvitation(code: string, email: string) {
    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { code },
      include: { organization: { select: { id: true, name: true } }, department: { select: { id: true, name: true } } },
    });

    if (!invitation) this.invitationError('Invitation code is invalid. Check the code and try again.');
    if (invitation.email.toLowerCase() !== email.toLowerCase()) {
      this.invitationError('This invitation was sent to a different email address.');
    }
    if (invitation.revokedAt) this.invitationError('This invitation has been revoked.');
    if (invitation.acceptedAt) this.invitationError('This invitation has already been used.');
    if (invitation.expiresAt <= new Date()) this.invitationError('This invitation has expired. Ask an administrator for a new invitation.');
    return invitation;
  }

  private async getRegistrationAssignment(email: string, invitationCode?: string) {
    if (invitationCode) {
      const invitation = await this.resolveInvitation(invitationCode, email);
      return {
        role: invitation.role,
        organizationId: invitation.organizationId,
        departmentId: invitation.departmentId,
        invitationCode: invitation.code,
      };
    }

    const organization = await this.getOrCreateDefaultOrganization();
    return {
      role: UserRole.CANDIDATE,
      organizationId: organization.id,
      departmentId: null,
      invitationCode: null,
    };
  }

  private async sendRegistrationOtp(email: string) {
    const code = crypto.randomInt(100000, 1000000).toString();
    await this.redis.set(`register:${email}`, code, 'EX', 900);

    const host = config.SMTP_HOST;
    const port = config.SMTP_PORT;
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: config.SMTP_USER && config.SMTP_PASS ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined,
    });
    const logoPath = getLogoPath();
    try {
      await transporter.sendMail({
        from: config.SMTP_FROM.replace('Works Reruiter', 'Works Recruiter').replace('worksreruiter.com', 'worksrecruiter.com'),
        to: email,
        subject: 'Works Recruiter — Complete your Registration',
        text: `Your registration verification code is: ${code}. This code is valid for 15 minutes.`,
        html: buildAuthHtmlTemplate('Complete your Registration', `<p>Use this 6-digit verification code to complete your registration:</p><div style="text-align:center;margin:30px 0"><strong style="font-family:monospace;font-size:32px;letter-spacing:4px">${code}</strong></div><p>This code is valid for <strong>15 minutes</strong>.</p>`, !!logoPath),
        attachments: logoPath ? [{ filename: 'logo-offical.svg', contentType: 'image/svg+xml', path: logoPath, cid: 'logo' }] : undefined,
      });
    } catch (err: any) {
      console.error(`Failed to send registration OTP to ${email}:`, err.message);
      if (config.NODE_ENV !== 'development' && host !== 'localhost') {
        throw new RpcException({ status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to send verification email. Please try again later.' });
      }
    }
  }

  async createOrganizationInvitation(payload: CreateOrganizationInvitationInput & { invitedById: string }) {
    const { invitedById, ...input } = payload;
    const parsed = CreateOrganizationInvitationSchema.parse(input);
    const email = parsed.email.toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email }, select: { isActive: true } });
    if (existingUser?.isActive) {
      throw new RpcException({ status: HttpStatus.CONFLICT, message: 'This email already belongs to an active account.' });
    }
    const organization = await this.prisma.organization.findUnique({ where: { id: parsed.organizationId }, select: { id: true, name: true } });
    if (!organization) this.invitationError('Organization does not exist.');
    if (parsed.departmentId) {
      const department = await this.prisma.department.findFirst({ where: { id: parsed.departmentId, organizationId: parsed.organizationId }, select: { id: true } });
      if (!department) this.invitationError('Department does not belong to this organization.');
    }

    await this.prisma.organizationInvitation.updateMany({
      where: { email, acceptedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    const invitation = await this.prisma.organizationInvitation.create({
      data: { ...parsed, email, invitedById, code: crypto.randomBytes(24).toString('base64url'), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), lastSentAt: new Date() },
      include: { department: { select: { name: true } } },
    });
    await this.prisma.organizationInvitationAudit.create({ data: { invitationId: invitation.id, actorId: invitedById, action: 'CREATED' } });
    const signupBaseUrl = (config.API_CORS_ORIGIN.split(',')[0] ?? '').trim().replace(/\/$/, '');
    const signupLink = `${signupBaseUrl}/signup?inviteCode=${encodeURIComponent(invitation.code)}`;
    const roleLabel = invitation.role.replace(/_/g, ' ');
    const logoPath = getLogoPath();
    const transporter = nodemailer.createTransport({ host: config.SMTP_HOST, port: config.SMTP_PORT, secure: config.SMTP_PORT === 465, auth: config.SMTP_USER && config.SMTP_PASS ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined });
    try {
      await transporter.sendMail({
        from: config.SMTP_FROM.replace('Works Reruiter', 'Works Recruiter').replace('worksreruiter.com', 'worksrecruiter.com'),
        to: email,
        subject: `You're invited to join ${organization.name} on Works Recruiter`,
        text: `You have been invited to join ${organization.name} as ${roleLabel}. Sign up at ${signupLink} or enter this invitation code: ${invitation.code}. This invitation expires in 7 days.`,
        html: buildAuthHtmlTemplate('You are invited to Works Recruiter', `<p>You have been invited to join <strong>${organization.name}</strong> as <strong>${roleLabel}</strong>${invitation.department ? ` in ${invitation.department.name}` : ''}.</p><p style="text-align:center;margin:30px 0"><a href="${signupLink}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Create your account</a></p><p>Your invitation code:</p><p style="font-family:monospace;word-break:break-all">${invitation.code}</p><p>This invitation expires in <strong>7 days</strong>.</p>`, !!logoPath),
        attachments: logoPath ? [{ filename: 'logo-offical.svg', contentType: 'image/svg+xml', path: logoPath, cid: 'logo' }] : undefined,
      });
    } catch (err: any) {
      console.error(`Failed to send invitation to ${email}:`, err.message);
      if (config.NODE_ENV !== 'development' && config.SMTP_HOST !== 'localhost') throw new RpcException({ status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Invitation was created but the email could not be sent.' });
    }
    return { id: invitation.id, email, expiresAt: invitation.expiresAt };
  }

  async listOrganizationInvitations(dto: ListOrganizationInvitationsInput) {
    const parsed = ListOrganizationInvitationsSchema.parse(dto);
    return this.prisma.organizationInvitation.findMany({
      where: { organizationId: parsed.organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { id: true, name: true } },
        auditEvents: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
  }

  async resendOrganizationInvitation(payload: ManageOrganizationInvitationInput & { actorId: string }) {
    const { actorId, ...input } = payload;
    const parsed = ManageOrganizationInvitationSchema.parse(input);
    const invitation = await this.prisma.organizationInvitation.findFirst({
      where: { id: parsed.invitationId, organizationId: parsed.organizationId },
      include: { organization: { select: { name: true } }, department: { select: { name: true } } },
    });
    if (!invitation) this.invitationError('Invitation was not found.');
    if (invitation.revokedAt) this.invitationError('A revoked invitation cannot be resent.');
    if (invitation.acceptedAt) this.invitationError('This invitation has already been accepted.');
    if (invitation.expiresAt <= new Date()) this.invitationError('This invitation has expired. Create a new invitation instead.');
    if (
      invitation.lastSentAt &&
      Date.now() - invitation.lastSentAt.getTime() < INVITATION_RESEND_COOLDOWN_MS
    ) {
      const remainingSeconds = Math.ceil(
        (INVITATION_RESEND_COOLDOWN_MS - (Date.now() - invitation.lastSentAt.getTime())) / 1000,
      );
      throw new RpcException({
        status: HttpStatus.TOO_MANY_REQUESTS,
        message: `Invitation email was recently sent. Try again in ${remainingSeconds} seconds.`,
      });
    }

    const signupBaseUrl = (config.API_CORS_ORIGIN.split(',')[0] ?? '').trim().replace(/\/$/, '');
    const signupLink = `${signupBaseUrl}/signup?inviteCode=${encodeURIComponent(invitation.code)}`;
    const logoPath = getLogoPath();
    const transporter = nodemailer.createTransport({ host: config.SMTP_HOST, port: config.SMTP_PORT, secure: config.SMTP_PORT === 465, auth: config.SMTP_USER && config.SMTP_PASS ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined });
    try {
      await transporter.sendMail({
        from: config.SMTP_FROM.replace('Works Reruiter', 'Works Recruiter').replace('worksreruiter.com', 'worksrecruiter.com'),
        to: invitation.email,
        subject: `Reminder: join ${invitation.organization.name} on Works Recruiter`,
        text: `Sign up at ${signupLink} or enter invitation code ${invitation.code}. This invitation expires on ${invitation.expiresAt.toLocaleDateString()}.`,
        html: buildAuthHtmlTemplate('Your Works Recruiter invitation', `<p>Your invitation to join <strong>${invitation.organization.name}</strong> as <strong>${invitation.role.replace(/_/g, ' ')}</strong> is still active.</p><p style="text-align:center;margin:30px 0"><a href="${signupLink}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Create your account</a></p><p>Invitation code:</p><p style="font-family:monospace;word-break:break-all">${invitation.code}</p>`, !!logoPath),
        attachments: logoPath ? [{ filename: 'logo-offical.svg', contentType: 'image/svg+xml', path: logoPath, cid: 'logo' }] : undefined,
      });
    } catch (err: any) {
      console.error(`Failed to resend invitation to ${invitation.email}:`, err.message);
      if (config.NODE_ENV !== 'development' && config.SMTP_HOST !== 'localhost') throw new RpcException({ status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Failed to resend invitation email.' });
    }
    const updated = await this.prisma.organizationInvitation.update({
      where: { id: invitation.id },
      data: { lastSentAt: new Date(), resendCount: { increment: 1 } },
    });
    await this.prisma.organizationInvitationAudit.create({ data: { invitationId: invitation.id, actorId, action: 'RESENT' } });
    return updated;
  }

  async revokeOrganizationInvitation(payload: ManageOrganizationInvitationInput & { actorId: string }) {
    const { actorId, ...input } = payload;
    const parsed = ManageOrganizationInvitationSchema.parse(input);
    const invitation = await this.prisma.organizationInvitation.findFirst({ where: { id: parsed.invitationId, organizationId: parsed.organizationId } });
    if (!invitation) this.invitationError('Invitation was not found.');
    if (invitation.acceptedAt) this.invitationError('An accepted invitation cannot be revoked.');
    if (invitation.revokedAt) return invitation;
    const updated = await this.prisma.organizationInvitation.update({ where: { id: invitation.id }, data: { revokedAt: new Date() } });
    await this.prisma.organizationInvitationAudit.create({ data: { invitationId: invitation.id, actorId, action: 'REVOKED' } });
    return updated;
  }

  async validateOrganizationInvitation(dto: ValidateOrganizationInvitationInput) {
    const parsed = ValidateOrganizationInvitationSchema.parse(dto);
    const invitation = parsed.email
      ? await this.resolveInvitation(parsed.code, parsed.email)
      : await this.prisma.organizationInvitation.findUnique({ where: { code: parsed.code }, include: { organization: { select: { name: true } }, department: { select: { name: true } } } });
    if (!invitation || invitation.revokedAt || invitation.acceptedAt || invitation.expiresAt <= new Date()) this.invitationError('Invitation code is invalid or expired.');
    return { organizationName: invitation.organization.name, departmentName: invitation.department?.name ?? null, role: invitation.role, expiresAt: invitation.expiresAt };
  }

  /**
   * Register a new user, hashes password, generates access token and refresh token.
   * Refresh token is stored in Redis under its SHA-256 hash.
   */
  async register(dto: RegisterUserInput): Promise<{ success: boolean; email: string }> {
    // 1. Validate payload
    const parsed = RegisterUserSchema.parse(dto);
    const email = parsed.email.toLowerCase();
    const assignment = await this.getRegistrationAssignment(email, parsed.invitationCode);

    // 2. Check duplicate email
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      if (existing.isActive) {
        throw new RpcException({
          status: HttpStatus.CONFLICT,
          message: 'Email already exists',
        });
      }
      // If user exists but is not active, update their information
      const passwordHash = await bcrypt.hash(parsed.password, 12);
      const departmentId = assignment.departmentId;
      await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          displayName: parsed.displayName,
          passwordHash,
          role: assignment.role,
          organizationId: assignment.organizationId,
          departmentId,
        },
      });
    } else {
      // 3. Hash password
      const passwordHash = await bcrypt.hash(parsed.password, 12);

      // Find or create a default organization for registered users
      let organization = await this.prisma.organization.findFirst();
      if (!organization) {
        organization = await this.prisma.organization.create({
          data: {
            name: 'Acme Corporation',
            slug: 'acme-corp',
          },
        });
      }

      const departmentId = assignment.departmentId;

      // 4. Create user in database (inactive by default)
      await this.prisma.user.create({
        data: {
          email,
          displayName: parsed.displayName,
          role: assignment.role,
          passwordHash,
          organizationId: assignment.organizationId,
          departmentId,
          isActive: false,
        },
      });
    }

    // 5. Generate 6-digit code
    const code = crypto.randomInt(100000, 1000000).toString();
    console.log(`🔑 [DEVELOPMENT ONLY] Generated Registration OTP code for ${email}: ${code}`);

    // 6. Store code in Redis with 15-min TTL
    const redisKey = `register:${email}`;
    await this.redis.set(redisKey, code, 'EX', 900);
    if (assignment.invitationCode) {
      await this.redis.set(`register-invitation:${email}`, assignment.invitationCode, 'EX', 900);
    } else {
      await this.redis.del(`register-invitation:${email}`);
    }

    // 7. Send verification code via SMTP (nodemailer)
    const host = config.SMTP_HOST;
    const port = config.SMTP_PORT;
    const userAuth = config.SMTP_USER;
    const passAuth = config.SMTP_PASS;
    const from = config.SMTP_FROM;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: userAuth && passAuth ? { user: userAuth, pass: passAuth } : undefined,
    });

    const logoPath = getLogoPath();
    const mailOptions = {
      from: from
        .replace('Works Reruiter', 'Works Recruiter')
        .replace('worksreruiter.com', 'worksrecruiter.com'),
      to: email,
      subject: 'Works Recruiter — Complete your Registration',
      text: `Your registration verification code is: ${code}. This code is valid for 15 minutes.`,
      html: buildAuthHtmlTemplate(
        'Complete your Registration',
        `
        <p>Thank you for signing up for Works Recruiter. Use the following 6-digit verification code to complete your registration:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="font-size: 32px; font-weight: bold; background-color: #f1f5f9; color: #1e293b; padding: 12px 24px; display: inline-block; letter-spacing: 4px; border-radius: 8px; border: 1px solid #e2e8f0; font-family: monospace;">
            ${code}
          </div>
        </div>
        <p>This code is valid for <strong>15 minutes</strong>. If you did not request this, you can ignore this email.</p>
        `,
        !!logoPath,
      ),
      attachments: logoPath
        ? [
            {
              filename: 'logo-offical.svg',
              contentType: 'image/svg+xml',
              path: logoPath,
              cid: 'logo',
            },
          ]
        : undefined,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (err: any) {
      console.error(`Failed to send email to ${email}:`, err.message);
      if (config.NODE_ENV === 'development' || host === 'localhost') {
        console.warn(
          `⚠️ [DEVELOPMENT ONLY] Bypassing SMTP mail failure. You can use the OTP code printed above.`,
        );
      } else {
        throw new RpcException({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to send verification email. Please try again later.',
        });
      }
    }

    return { success: true, email };
  }

  /**
   * Login a user: validates credentials, verifies bcrypt password, issues JWT + refresh tokens.
   */
  async login(dto: LoginInput): Promise<AuthTokenResponse> {
    // 1. Validate payload
    const parsed = LoginSchema.parse(dto);

    // 2. Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: parsed.email },
    });
    if (!user || !user.passwordHash) {
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Invalid email or password',
      });
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(parsed.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Invalid email or password',
      });
    }

    // 4. Find primary organization membership if any
    const organizationId = user.organizationId;

    // 5. Generate Access Token (JWT)
    const payload = {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      organizationId,
    };
    const accessToken = this.jwtService.sign(payload);

    // 6. Generate Refresh Token (64-byte random hex)
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // 7. Store Refresh Token in Redis (30 days TTL = 2592000s)
    await this.storeRefreshToken(tokenHash, user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }

  async loginWithSupabase(dto: SupabaseLoginInput): Promise<AuthTokenResponse> {
    const parsed = SupabaseLoginSchema.parse(dto);
    const identity = await this.getVerifiedSupabaseIdentity(parsed.accessToken);

    const user = await this.prisma.user.findUnique({
      where: { email: identity.email },
    });

    if (!user) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: 'No RMS account is registered for this Google account',
        code: 'RMS_ACCOUNT_NOT_REGISTERED',
        email: identity.email,
      });
    }

    if (!user.isActive) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'This RMS account is not active yet',
      });
    }

    return this.issueRmsTokens(user);
  }

  async registerWithSupabase(dto: SupabaseRegisterInput): Promise<{ success: boolean; email: string }> {
    const parsed = SupabaseRegisterSchema.parse(dto);
    const identity = await this.getVerifiedSupabaseIdentity(parsed.accessToken);

    const existing = await this.prisma.user.findUnique({
      where: { email: identity.email },
    });

    if (existing?.isActive) throw new RpcException({ status: HttpStatus.CONFLICT, message: 'Email already exists' });
    const assignment = await this.getRegistrationAssignment(identity.email, parsed.invitationCode);

    const displayName = parsed.displayName.trim() || identity.displayName;
    const user = existing
      ? await this.prisma.user.update({
          where: { id: existing.id },
          data: {
            displayName,
            role: assignment.role,
            organizationId: assignment.organizationId,
            departmentId: assignment.departmentId,
            passwordHash: null,
            isActive: false,
          },
        })
      : await this.prisma.user.create({
          data: {
            email: identity.email,
            displayName,
            role: assignment.role,
            passwordHash: null,
            organizationId: assignment.organizationId,
            departmentId: assignment.departmentId,
            isActive: false,
          },
        });

    if (assignment.invitationCode) await this.redis.set(`register-invitation:${identity.email}`, assignment.invitationCode, 'EX', 900);
    else await this.redis.del(`register-invitation:${identity.email}`);
    await this.sendRegistrationOtp(identity.email);
    return { success: true, email: user.email };
  }
  /**
   * Refresh an existing refresh token and rotate to a new pair.
   */
  async refresh(dto: { refreshToken: string }): Promise<AuthTokenResponse> {
    const validationResult = RefreshTokenSchema.safeParse(dto);
    if (!validationResult.success) {
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Refresh token is invalid or has expired',
      });
    }

    const parsed = validationResult.data;
    const tokenHash = crypto.createHash('sha256').update(parsed.refreshToken).digest('hex');
    const redisKey = `refresh:${tokenHash}`;

    const userId = await this.redis.get(redisKey);
    if (!userId) {
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Refresh token is invalid or has expired',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      await this.redis.del(redisKey);
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Refresh token is invalid or has expired',
      });
    }

    const organizationId = user.organizationId;

    await this.redis.del(redisKey);

    const accessTokenPayload = {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      organizationId,
    };

    const accessToken = this.jwtService.sign(accessTokenPayload);
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const newTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await this.storeRefreshToken(newTokenHash, user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }

  /**
   * Generates a 6-digit code for password reset, stores it in Redis (15-min TTL), and sends via SMTP.
   * Rates limits: max 5 requests per 15 min per email.
   * If email does not exist, returns success immediately (prevents email harvesting).
   */
  async forgotPassword(dto: ForgotPasswordInput): Promise<{ success: boolean }> {
    // 1. Validate payload
    const parsed = ForgotPasswordSchema.parse(dto);
    const email = parsed.email.toLowerCase();

    // 2. Rate limiting (max 5 requests per 15 min per email)
    const rateLimitKey = `forgot-limit:${email}`;
    const requests = await this.redis.get(rateLimitKey);
    const requestCount = requests ? parseInt(requests, 10) : 0;

    if (requestCount >= 5) {
      throw new RpcException({
        status: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many password reset requests. Please try again later.',
      });
    }

    // Increment request count in Redis
    if (requestCount === 0) {
      await this.redis.set(rateLimitKey, 1, 'EX', 900); // 15 min TTL = 900s
    } else {
      await this.redis.incr(rateLimitKey);
    }

    // 3. Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      // Non-existent email returns success (no email leak)
      return { success: true };
    }

    // 4. Generate random token
    const token = crypto.randomBytes(32).toString('hex');

    // 5. Store token in Redis with 15-min TTL
    const redisKey = `reset:${email}`;
    await this.redis.set(redisKey, token, 'EX', 900);

    // 6. Send verification link via SMTP (nodemailer)
    const host = config.SMTP_HOST;
    const port = config.SMTP_PORT;
    const userAuth = config.SMTP_USER;
    const passAuth = config.SMTP_PASS;
    const from = config.SMTP_FROM;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: userAuth && passAuth ? { user: userAuth, pass: passAuth } : undefined,
    });

    const webappUrl = (config.API_CORS_ORIGIN.split(',')[0] ?? '').trim().replace(/\/$/, '');
    const resetPath = parsed.redirectPath ?? '/reset-password';
    const resetLink = `${webappUrl}${resetPath}?email=${encodeURIComponent(email)}&token=${token}`;

    const logoPath = getLogoPath();
    const mailOptions = {
      from: from
        .replace('Works Reruiter', 'Works Recruiter')
        .replace('worksreruiter.com', 'worksrecruiter.com'),
      to: email,
      subject: 'Works Recruiter — Password Reset Link',
      text: `Please reset your password by opening the following link in your browser: ${resetLink}. This link is valid for 15 minutes.`,
      html: buildAuthHtmlTemplate(
        'Password Reset Request',
        `
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
            Reset Password
          </a>
        </div>
        <p style="font-size: 14px; color: #64748b; margin-top: 24px;">If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="font-size: 13px; color: #4f46e5; word-break: break-all;"><a href="${resetLink}" style="color: #4f46e5; text-decoration: underline;">${resetLink}</a></p>
        <p>This link is valid for <strong>15 minutes</strong>. If you did not request a password reset, please ignore this email.</p>
        `,
        !!logoPath,
      ),
      attachments: logoPath
        ? [
            {
              filename: 'logo-offical.svg',
              contentType: 'image/svg+xml',
              path: logoPath,
              cid: 'logo',
            },
          ]
        : undefined,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (err: any) {
      console.error(`Failed to send email to ${email}:`, err.message);
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to send verification email. Please try again later.',
      });
    }

    return { success: true };
  }

  /**
   * Validate token from Redis, hash new password (bcrypt 12 rounds),
   * update User.passwordHash, and delete ALL refresh tokens for user.
   */
  async resetPassword(dto: ResetPasswordInput): Promise<{ success: boolean }> {
    // 1. Validate payload
    const parsed = ResetPasswordSchema.parse(dto);
    const email = parsed.email.toLowerCase();

    // 2. Retrieve code from Redis
    const redisKey = `reset:${email}`;
    const storedCode = await this.redis.get(redisKey);

    // 3. Validate code (invalid or expired)
    if (!storedCode || storedCode !== parsed.code) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid or expired reset link',
      });
    }

    // 4. Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid or expired reset link',
      });
    }

    // 5. Hash new password with bcrypt (12 rounds)
    const newPasswordHash = await bcrypt.hash(parsed.newPassword, 12);

    // 6. Update user password in database
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // 7. Delete ALL refresh tokens for the user (force re-login)
    // Scan Redis for all refresh tokens belonging to this user and delete them
    const cursor = '0';
    let deletedCount = 0;
    let scanCursor = cursor;

    do {
      const result = await this.redis.scan(scanCursor, 'MATCH', 'refresh:*', 'COUNT', 100);
      scanCursor = result[0];
      const keys = result[1];

      // Check each key to see if it belongs to this user
      for (const key of keys) {
        const storedUserId = await this.redis.get(key);
        if (storedUserId === user.id) {
          await this.redis.del(key);
          deletedCount++;
        }
      }
    } while (scanCursor !== '0');

    // 8. Delete the reset code from Redis
    await this.redis.del(redisKey);

    return { success: true };
  }

  /**
   * Validate registration 6-digit OTP code, update user to active,
   * and generate login tokens.
   */
  async verifyRegister(dto: VerifyRegisterInput): Promise<AuthTokenResponse> {
    // 1. Validate payload
    const parsed = VerifyRegisterSchema.parse(dto);
    const email = parsed.email.toLowerCase();

    // 2. Retrieve code from Redis
    const redisKey = `register:${email}`;
    const storedCode = await this.redis.get(redisKey);

    if (!storedCode || storedCode !== parsed.code) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid or expired verification code',
      });
    }

    // 3. Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: 'User not found',
      });
    }

    const invitationCode = await this.redis.get(`register-invitation:${email}`);
    if (invitationCode) {
      await this.resolveInvitation(invitationCode, email);
    }

    // 4. Update user status in database to active
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isActive: true },
    });

    // 5. Clean up code from Redis
    await this.redis.del(redisKey);
    if (invitationCode) {
      const acceptedInvitation = await this.prisma.organizationInvitation.update({
        where: { code: invitationCode },
        data: { acceptedAt: new Date() },
      });
      await this.prisma.organizationInvitationAudit.create({
        data: { invitationId: acceptedInvitation.id, actorId: user.id, action: 'ACCEPTED' },
      });
      await this.redis.del(`register-invitation:${email}`);
    }

    // 6. Generate Access Token (JWT)
    const payload = {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      organizationId: user.organizationId,
    };
    const accessToken = this.jwtService.sign(payload);

    // 7. Generate Refresh Token (64-byte random hex)
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // 8. Store Refresh Token in Redis (30 days TTL)
    await this.storeRefreshToken(tokenHash, user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }

  /**
   * Resend the registration OTP code via email.
   */
  async resendRegisterOtp(dto: { email: string }): Promise<{ success: boolean }> {
    const email = dto.email.toLowerCase();

    // Verify user exists and is not active
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.isActive) {
      return { success: true };
    }

    // Generate new OTP
    const code = crypto.randomInt(100000, 1000000).toString();
    console.log(`🔑 [DEVELOPMENT ONLY] Resent Registration OTP code for ${email}: ${code}`);

    // Store in Redis
    const redisKey = `register:${email}`;
    await this.redis.set(redisKey, code, 'EX', 900);

    // Send email
    const host = config.SMTP_HOST;
    const port = config.SMTP_PORT;
    const userAuth = config.SMTP_USER;
    const passAuth = config.SMTP_PASS;
    const from = config.SMTP_FROM;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: userAuth && passAuth ? { user: userAuth, pass: passAuth } : undefined,
    });

    const logoPath = getLogoPath();
    const mailOptions = {
      from: from
        .replace('Works Reruiter', 'Works Recruiter')
        .replace('worksreruiter.com', 'worksrecruiter.com'),
      to: email,
      subject: 'Works Recruiter — Complete your Registration (Resend)',
      text: `Your new registration verification code is: ${code}. This code is valid for 15 minutes.`,
      html: buildAuthHtmlTemplate(
        'Complete your Registration',
        `
        <p>Here is your new 6-digit verification code to complete your registration:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="font-size: 32px; font-weight: bold; background-color: #f1f5f9; color: #1e293b; padding: 12px 24px; display: inline-block; letter-spacing: 4px; border-radius: 8px; border: 1px solid #e2e8f0; font-family: monospace;">
            ${code}
          </div>
        </div>
        <p>This code is valid for <strong>15 minutes</strong>. If you did not request this, you can ignore this email.</p>
        `,
        !!logoPath,
      ),
      attachments: logoPath
        ? [
            {
              filename: 'logo-offical.svg',
              contentType: 'image/svg+xml',
              path: logoPath,
              cid: 'logo',
            },
          ]
        : undefined,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (err: any) {
      console.error(`Failed to send email to ${email}:`, err.message);
      if (config.NODE_ENV === 'development' || host === 'localhost') {
        console.warn(
          `⚠️ [DEVELOPMENT ONLY] Bypassing SMTP mail failure. You can use the OTP code printed above.`,
        );
      } else {
        throw new RpcException({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to send verification email. Please try again later.',
        });
      }
    }

    return { success: true };
  }

  /**
   * Logout a user session: revokes the specified refresh token in Redis.
   */
  async logout(dto: { refreshToken: string }): Promise<{ success: boolean }> {
    // 1. Validate payload
    const validationResult = RefreshTokenSchema.safeParse(dto);
    if (!validationResult.success) {
      return { success: true };
    }

    const parsed = validationResult.data;
    const tokenHash = crypto.createHash('sha256').update(parsed.refreshToken).digest('hex');
    const redisKey = `refresh:${tokenHash}`;

    // 2. Delete the refresh token from Redis
    await this.redis.del(redisKey);

    return { success: true };
  }
}
