import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/database/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

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
    },
    organizationMember: {
      findFirst: jest.fn(),
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
      role: 'CANDIDATE' as const,
    };

    it('should successfully register a new user and return token response', async () => {
      // Setup mock returns
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const createdUser = {
        id: 'uuid-1234',
        email: dto.email,
        displayName: dto.displayName,
        role: dto.role,
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.register(dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(prisma.user.create).toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: createdUser.id,
        email: createdUser.email,
        displayName: createdUser.displayName,
        role: createdUser.role,
        organizationId: null,
      });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.expiresIn).toBe(3600);
      expect(result.user).toEqual({
        id: createdUser.id,
        email: createdUser.email,
        displayName: createdUser.displayName,
        role: createdUser.role,
      });
    });

    it('should throw Conflict RpcException if email already exists', async () => {
      const existingUser = {
        id: 'uuid-existing',
        email: dto.email,
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
      };
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.organizationMember.findFirst.mockResolvedValue({
        organizationId: 'org-123',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(dto.password, user.passwordHash);
      expect(prisma.organizationMember.findFirst).toHaveBeenCalledWith({
        where: { userId: user.id },
      });
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
});
