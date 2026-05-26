import { Injectable, HttpStatus, OnModuleDestroy } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/database/prisma.service';
<<<<<<< HEAD
import { RegisterUserSchema, RegisterUserInput, AuthTokenResponse, LoginSchema, LoginInput, RefreshTokenSchema } from '@wr/contracts';
=======
import { RegisterUserSchema, RegisterUserInput, AuthTokenResponse, LoginSchema, LoginInput } from '@wr/contracts';
>>>>>>> 6b3ef18c554ad388ebedb3c2b539448949d26d68
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import IORedis from 'ioredis';

@Injectable()
export class AuthService implements OnModuleDestroy {
  private readonly redis: IORedis;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    this.redis = new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      maxRetriesPerRequest: null,
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  /**
   * Register a new user, hashes password, generates access token and refresh token.
   * Refresh token is stored in Redis under its SHA-256 hash.
   */
  async register(dto: RegisterUserInput): Promise<AuthTokenResponse> {
    // 1. Validate payload
    const parsed = RegisterUserSchema.parse(dto);

    // 2. Check duplicate email
    const existing = await this.prisma.user.findUnique({
      where: { email: parsed.email },
    });
    if (existing) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: 'Email already exists',
      });
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(parsed.password, 12);

    // 4. Create user in database
    const user = await this.prisma.user.create({
      data: {
        email: parsed.email,
        displayName: parsed.displayName,
        role: parsed.role,
        passwordHash,
      },
    });

    // 5. Generate Access Token (JWT)
    const payload = {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      organizationId: null, // Initial registration doesn't assign an org
    };
    const accessToken = this.jwtService.sign(payload);

    // 6. Generate Refresh Token (64-byte random hex)
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // 7. Store Refresh Token in Redis (30 days TTL = 2592000s)
    await this.redis.set(`refresh:${tokenHash}`, user.id, 'EX', 2592000);

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
    const membership = await this.prisma.organizationMember.findFirst({
      where: { userId: user.id },
    });
    const organizationId = membership?.organizationId || null;

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
    await this.redis.set(`refresh:${tokenHash}`, user.id, 'EX', 2592000);

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
<<<<<<< HEAD

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

    const membership = await this.prisma.organizationMember.findFirst({
      where: { userId: user.id },
    });
    const organizationId = membership?.organizationId || null;

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
    const newRedisKey = `refresh:${newTokenHash}`;

    await this.redis.set(newRedisKey, user.id, 'EX', 2592000);

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
=======
>>>>>>> 6b3ef18c554ad388ebedb3c2b539448949d26d68
}
