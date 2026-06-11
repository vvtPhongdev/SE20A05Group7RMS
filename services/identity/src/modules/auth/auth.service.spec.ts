import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/database/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { UserRole } from '@wr/contracts';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

// Mock nodemailer
jest.mock('nodemailer', () => {
  const sendMail = jest.fn().mockResolvedValue({ messageId: 'mock-message-id' });
  return {
    createTransport: jest.fn().mockReturnValue({
      sendMail,
    }),
  };
});

// Mock IORedis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
      quit: jest.fn().mockResolvedValue('OK'),
    };
  });
});

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organization: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-access-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  describe('register', () => {
    const dto = {
      email: 'test@example.com',
      displayName: 'Test User',
      password: 'Password123!',
      role: UserRole.CANDIDATE,
    };

    it('should successfully register a new user and return success status', async () => {
      // Setup mock returns
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.organization.findFirst.mockResolvedValue({
        id: 'org-uuid-1234',
        name: 'Acme Corporation',
        slug: 'acme-corp',
      });

      const createdUser = {
        id: 'uuid-1234',
        email: dto.email,
        displayName: dto.displayName,
        role: dto.role,
        passwordHash: 'hashed-password',
        organizationId: 'org-uuid-1234',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.register(dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        email: dto.email,
      });
    });

    it('should throw Conflict RpcException if email already exists', async () => {
      const existingUser = {
        id: 'uuid-existing',
        email: dto.email,
        isActive: true,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

      await expect(service.register(dto)).rejects.toThrow(
        new RpcException({
          status: HttpStatus.CONFLICT,
          message: 'Email already exists',
        }),
      );

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const dto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should successfully login and return token response', async () => {
      const user = {
        id: 'uuid-1234',
        email: dto.email,
        displayName: 'Test User',
        role: 'CANDIDATE',
        passwordHash: 'hashed-password',
        organizationId: 'org-123',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(dto.password, user.passwordHash);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        organizationId: 'org-123',
      });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.expiresIn).toBe(3600);
      expect(result.user).toEqual({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      });
    });

    it('should throw Unauthorized RpcException if email does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(
        new RpcException({
          status: HttpStatus.UNAUTHORIZED,
          message: 'Invalid email or password',
        }),
      );

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
    });

    it('should throw Unauthorized RpcException if password is wrong', async () => {
      const user = {
        id: 'uuid-1234',
        email: dto.email,
        passwordHash: 'hashed-password',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(
        new RpcException({
          status: HttpStatus.UNAUTHORIZED,
          message: 'Invalid email or password',
        }),
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(dto.password, user.passwordHash);
    });
  });
  describe('refresh', () => {
    const refreshToken = 'refresh-token-123';
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const redisKey = `refresh:${tokenHash}`;

    it('should rotate refresh token and return new auth response', async () => {
      const user = {
        id: 'uuid-1234',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'CANDIDATE',
        passwordHash: 'hashed-password',
        organizationId: null as any,
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(user);
      const redisInstance = (service as any).redis;
      redisInstance.get.mockResolvedValueOnce(user.id);
      redisInstance.del.mockResolvedValueOnce(1);
      redisInstance.set.mockResolvedValueOnce('OK');
      mockJwtService.sign.mockReturnValueOnce('new-access-token');

      const result = await service.refresh({ refreshToken });

      expect(redisInstance.get).toHaveBeenCalledWith(redisKey);
      expect(redisInstance.del).toHaveBeenCalledWith(redisKey);
      expect(redisInstance.set).toHaveBeenCalledWith(expect.stringMatching(/^refresh:[a-f0-9]{64}$/), user.id, 'EX', 2592000);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        organizationId: null,
      });
      expect(result).toHaveProperty('accessToken', 'new-access-token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.expiresIn).toBe(3600);
      expect(result.user).toEqual({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      });
    });

    it('should return 401 if refresh token has expired or been revoked', async () => {
      const redisInstance = (service as any).redis;
      redisInstance.get.mockResolvedValueOnce(null);

      await expect(service.refresh({ refreshToken })).rejects.toThrow(
        new RpcException({
          status: HttpStatus.UNAUTHORIZED,
          message: 'Refresh token is invalid or has expired',
        }),
      );

      expect(redisInstance.get).toHaveBeenCalledWith(redisKey);
    });

    it('should return 401 if user no longer exists and delete redis entry', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      const redisInstance = (service as any).redis;
      redisInstance.get.mockResolvedValueOnce('uuid-1234');
      redisInstance.del.mockResolvedValueOnce(1);

      await expect(service.refresh({ refreshToken })).rejects.toThrow(
        new RpcException({
          status: HttpStatus.UNAUTHORIZED,
          message: 'Refresh token is invalid or has expired',
        }),
      );

      expect(redisInstance.del).toHaveBeenCalledWith(redisKey);
    });
  });

  describe('forgotPassword', () => {
    const email = 'test@example.com';
    const rateLimitKey = `forgot-limit:${email}`;
    const redisKey = `reset:${email}`;

    it('should successfully generate code, store in Redis, and send email', async () => {
      const user = {
        id: 'uuid-1234',
        email,
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(user);
      const redisInstance = (service as any).redis;
      redisInstance.get.mockResolvedValueOnce(null); // No previous attempts
      redisInstance.set.mockResolvedValueOnce('OK'); // Rate limit set
      redisInstance.set.mockResolvedValueOnce('OK'); // Reset code set

      const mockSendMail = (nodemailer.createTransport() as any).sendMail;
      mockSendMail.mockClear();

      const result = await service.forgotPassword({ email });

      expect(result).toEqual({ success: true });
      expect(redisInstance.get).toHaveBeenCalledWith(rateLimitKey);
      expect(redisInstance.set).toHaveBeenCalledWith(rateLimitKey, 1, 'EX', 900);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email } });
      expect(redisInstance.set).toHaveBeenCalledWith(
        redisKey,
        expect.stringMatching(/^[a-f0-9]{64}$/),
        'EX',
        900,
      );
      expect(mockSendMail).toHaveBeenCalled();
    });

    it('should return success immediately without generating code or email if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      const redisInstance = (service as any).redis;
      redisInstance.get.mockResolvedValueOnce(null);
      redisInstance.set.mockResolvedValueOnce('OK');

      const mockSendMail = (nodemailer.createTransport() as any).sendMail;
      mockSendMail.mockClear();

      const result = await service.forgotPassword({ email });

      expect(result).toEqual({ success: true });
      expect(redisInstance.set).toHaveBeenCalledWith(rateLimitKey, 1, 'EX', 900);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email } });
      expect(redisInstance.set).not.toHaveBeenCalledWith(redisKey, expect.any(String), 'EX', 900);
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should throw TooManyRequests RpcException if email has reached the rate limit', async () => {
      const redisInstance = (service as any).redis;
      redisInstance.get.mockResolvedValueOnce('5'); // 5 attempts already made

      await expect(service.forgotPassword({ email })).rejects.toThrow(
        new RpcException({
          status: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many password reset requests. Please try again later.',
        }),
      );

      expect(redisInstance.get).toHaveBeenCalledWith(rateLimitKey);
    });
  });

  describe('logout', () => {
    const refreshToken = 'refresh-token-123';
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const redisKey = `refresh:${tokenHash}`;

    it('should successfully delete refresh token from Redis and return success', async () => {
      const redisInstance = (service as any).redis;
      redisInstance.del.mockResolvedValueOnce(1);

      const result = await service.logout({ refreshToken });

      expect(result).toEqual({ success: true });
      expect(redisInstance.del).toHaveBeenCalledWith(redisKey);
    });

    it('should return success even if the token does not exist in Redis', async () => {
      const redisInstance = (service as any).redis;
      redisInstance.del.mockResolvedValueOnce(0);

      const result = await service.logout({ refreshToken });

      expect(result).toEqual({ success: true });
      expect(redisInstance.del).toHaveBeenCalledWith(redisKey);
    });

    it('should return success immediately if the token is invalid format', async () => {
      const redisInstance = (service as any).redis;
      redisInstance.del.mockClear();

      const result = await service.logout({ refreshToken: '' });

      expect(result).toEqual({ success: true });
      expect(redisInstance.del).not.toHaveBeenCalled();
    });
  });
});
