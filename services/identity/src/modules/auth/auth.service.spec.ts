import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/database/prisma.service';

// Mock IORedis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      set: jest.fn().mockResolvedValue('OK'),
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
});
