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
  ResetPasswordSchema,
  ResetPasswordInput,
  VerifyRegisterSchema,
  VerifyRegisterInput,
} from '@wr/contracts';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import IORedis from 'ioredis';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';

function getLogoPath(): string | null {
  const logoPath = path.join(__dirname, '../../../../../assets/logo.png');
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
      email: supabaseUser.email.toLowerCase(),
      displayName,
    };
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

  /**
   * Register a new user, hashes password, generates access token and refresh token.
   * Refresh token is stored in Redis under its SHA-256 hash.
   */
  async register(dto: RegisterUserInput): Promise<{ success: boolean; email: string }> {
    // 1. Validate payload
    const parsed = RegisterUserSchema.parse(dto);
    const email = parsed.email.toLowerCase();

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
      let departmentId = existing.departmentId;
      if (!departmentId && parsed.role === 'DEPARTMENT_HEAD') {
        const defaultDept = await this.prisma.department.findFirst();
        if (defaultDept) {
          departmentId = defaultDept.id;
        }
      }
      await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          displayName: parsed.displayName,
          passwordHash,
          role: parsed.role,
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

      // Find a default department for the new Department Head
      let departmentId: string | undefined;
      if (parsed.role === 'DEPARTMENT_HEAD') {
        const defaultDept = await this.prisma.department.findFirst({
          where: { organizationId: organization.id },
        });
        if (defaultDept) {
          departmentId = defaultDept.id;
        }
      }

      // 4. Create user in database (inactive by default)
      await this.prisma.user.create({
        data: {
          email,
          displayName: parsed.displayName,
          role: parsed.role,
          passwordHash,
          organizationId: organization.id,
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
              filename: 'logo.png',
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

  async registerWithSupabase(dto: SupabaseRegisterInput): Promise<AuthTokenResponse> {
    const parsed = SupabaseRegisterSchema.parse(dto);
    const identity = await this.getVerifiedSupabaseIdentity(parsed.accessToken);

    const existing = await this.prisma.user.findUnique({
      where: { email: identity.email },
    });

    if (existing?.isActive) {
      return this.issueRmsTokens(existing);
    }

    const organization = await this.getOrCreateDefaultOrganization();
    let departmentId = existing?.departmentId ?? undefined;
    if (!departmentId && parsed.role === 'DEPARTMENT_HEAD') {
      const defaultDept = await this.prisma.department.findFirst({
        where: { organizationId: organization.id },
      });
      departmentId = defaultDept?.id;
    }

    const displayName = parsed.displayName.trim() || identity.displayName;
    const user = existing
      ? await this.prisma.user.update({
          where: { id: existing.id },
          data: {
            displayName,
            role: parsed.role,
            departmentId,
            passwordHash: null,
            isActive: true,
          },
        })
      : await this.prisma.user.create({
          data: {
            email: identity.email,
            displayName,
            role: parsed.role,
            passwordHash: null,
            organizationId: organization.id,
            departmentId,
            isActive: true,
          },
        });

    return this.issueRmsTokens(user);
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
  async forgotPassword(dto: { email: string }): Promise<{ success: boolean }> {
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

    const webappUrl = config.API_CORS_ORIGIN;
    const resetLink = `${webappUrl}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;

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
              filename: 'logo.png',
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

    // 4. Update user status in database to active
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isActive: true },
    });

    // 5. Clean up code from Redis
    await this.redis.del(redisKey);

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
              filename: 'logo.png',
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
