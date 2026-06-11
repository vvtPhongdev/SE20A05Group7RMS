import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('crypto');
jest.mock('ioredis');

// Mock IORedis module
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    scan: jest.fn(),
    quit: jest.fn(),
  }));
});

describe('AuthService - resetPassword', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let redisMock: any;

  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'CANDIDATE',
    passwordHash: '$2b$12$old_hash',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockResetPayload = {
    email: 'test@example.com',
    code: '123456',
    newPassword: 'NewPassword123!',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            organization: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);

    // Get Redis mock from AuthService
    redisMock = (service as any).redis;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Valid code + new password resets successfully', () => {
    it('should reset password with valid code', async () => {
      // Setup mocks
      (redisMock.get as jest.Mock).mockResolvedValue('123456'); // Code matches
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$new_hash');
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: '$2b$12$new_hash',
      });
      (redisMock.scan as jest.Mock).mockResolvedValue(['0', []]); // No refresh tokens
      (redisMock.del as jest.Mock).mockResolvedValue(1);

      const result = await service.resetPassword(mockResetPayload);

      expect(result).toEqual({ success: true });
    });

    it('should hash password with bcrypt 12 rounds', async () => {
      (redisMock.get as jest.Mock).mockResolvedValue('123456');
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$new_hash');
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: '$2b$12$new_hash',
      });
      (redisMock.scan as jest.Mock).mockResolvedValue(['0', []]);
      (redisMock.del as jest.Mock).mockResolvedValue(1);

      await service.resetPassword(mockResetPayload);

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', 12);
    });

    it('should update User.passwordHash in database', async () => {
      (redisMock.get as jest.Mock).mockResolvedValue('123456');
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$new_hash');
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: '$2b$12$new_hash',
      });
      (redisMock.scan as jest.Mock).mockResolvedValue(['0', []]);
      (redisMock.del as jest.Mock).mockResolvedValue(1);

      await service.resetPassword(mockResetPayload);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { passwordHash: '$2b$12$new_hash' },
      });
    });

    it('should normalize email to lowercase', async () => {
      const payloadWithUppercase = {
        email: 'Test@Example.COM',
        code: '123456',
        newPassword: 'NewPassword123!',
      };

      (redisMock.get as jest.Mock).mockResolvedValue('123456');
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$new_hash');
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: '$2b$12$new_hash',
      });
      (redisMock.scan as jest.Mock).mockResolvedValue(['0', []]);
      (redisMock.del as jest.Mock).mockResolvedValue(1);

      await service.resetPassword(payloadWithUppercase);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('Delete ALL refresh tokens for user', () => {
    it('should delete all refresh tokens for the user', async () => {
      (redisMock.get as jest.Mock)
        .mockResolvedValueOnce('123456') // Reset code
        .mockResolvedValueOnce(mockUser.id) // First refresh token
        .mockResolvedValueOnce(mockUser.id); // Second refresh token

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$new_hash');
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: '$2b$12$new_hash',
      });

      // Mock SCAN to return refresh tokens
      (redisMock.scan as jest.Mock).mockResolvedValueOnce([
        '0', // No more pages
        ['refresh:token_hash_1', 'refresh:token_hash_2'],
      ]);

      (redisMock.del as jest.Mock).mockResolvedValue(1);

      await service.resetPassword(mockResetPayload);

      // Should delete 2 refresh tokens + 1 reset code = 3 deletes
      expect(redisMock.del).toHaveBeenCalledTimes(3);
    });

    it('should handle pagination when scanning Redis for refresh tokens', async () => {
      (redisMock.get as jest.Mock)
        .mockResolvedValueOnce('123456') // Reset code
        .mockResolvedValueOnce(mockUser.id) // First page token
        .mockResolvedValueOnce(mockUser.id); // Second page token

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$new_hash');
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: '$2b$12$new_hash',
      });

      // Mock SCAN with pagination
      (redisMock.scan as jest.Mock)
        .mockResolvedValueOnce(['1', ['refresh:token_hash_1']]) // Page 1 with cursor
        .mockResolvedValueOnce(['0', ['refresh:token_hash_2']]); // Page 2, end of scan

      (redisMock.del as jest.Mock).mockResolvedValue(1);

      await service.resetPassword(mockResetPayload);

      expect(redisMock.scan).toHaveBeenCalledTimes(2);
    });

    it('should not delete refresh tokens for other users', async () => {
      const otherUserId = '550e8400-e29b-41d4-a716-446655440001';

      (redisMock.get as jest.Mock)
        .mockResolvedValueOnce('123456') // Reset code
        .mockResolvedValueOnce(otherUserId); // Belongs to different user

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$new_hash');
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: '$2b$12$new_hash',
      });

      (redisMock.scan as jest.Mock).mockResolvedValueOnce(['0', ['refresh:token_hash_other']]);

      (redisMock.del as jest.Mock).mockResolvedValue(1);

      await service.resetPassword(mockResetPayload);

      // Should only delete reset code, not the other user's refresh token
      expect(redisMock.del).toHaveBeenCalledTimes(1);
      expect(redisMock.del).toHaveBeenCalledWith(`reset:test@example.com`);
    });

    it('should delete reset code from Redis after password reset', async () => {
      (redisMock.get as jest.Mock).mockResolvedValue('123456');
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$new_hash');
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: '$2b$12$new_hash',
      });
      (redisMock.scan as jest.Mock).mockResolvedValue(['0', []]);
      (redisMock.del as jest.Mock).mockResolvedValue(1);

      await service.resetPassword(mockResetPayload);

      expect(redisMock.del).toHaveBeenCalledWith(`reset:test@example.com`);
    });
  });

  describe('Invalid/expired code returns 400', () => {
    it('should return 400 for invalid code', async () => {
      (redisMock.get as jest.Mock).mockResolvedValue('654321'); // Different code

      await expect(service.resetPassword(mockResetPayload)).rejects.toThrow(
        new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid or expired reset link',
        }),
      );
    });

    it('should return 400 for expired code (not in Redis)', async () => {
      (redisMock.get as jest.Mock).mockResolvedValue(null); // Code expired

      await expect(service.resetPassword(mockResetPayload)).rejects.toThrow(
        new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid or expired reset link',
        }),
      );
    });

    it('should return 400 if code is empty string', async () => {
      (redisMock.get as jest.Mock).mockResolvedValue('');

      await expect(service.resetPassword(mockResetPayload)).rejects.toThrow(
        new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid or expired reset link',
        }),
      );
    });

    it('should not leak information about non-existent users', async () => {
      (redisMock.get as jest.Mock).mockResolvedValue('123456');
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // User doesn't exist

      await expect(service.resetPassword(mockResetPayload)).rejects.toThrow(
        new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid or expired reset link',
        }),
      );
    });
  });

  describe('Validation errors', () => {
    it('should reject invalid email format', async () => {
      const invalidPayload = {
        email: 'invalid-email',
        code: '123456',
        newPassword: 'NewPassword123!',
      };

      await expect(service.resetPassword(invalidPayload as any)).rejects.toThrow();
    });

    it('should reject code with wrong length', async () => {
      const invalidPayload = {
        email: 'test@example.com',
        code: '12345', // 5 digits instead of 6
        newPassword: 'NewPassword123!',
      };

      await expect(service.resetPassword(invalidPayload as any)).rejects.toThrow();
    });

    it('should reject password shorter than 8 characters', async () => {
      const invalidPayload = {
        email: 'test@example.com',
        code: '123456',
        newPassword: 'Short1!', // 7 characters
      };

      await expect(service.resetPassword(invalidPayload as any)).rejects.toThrow();
    });

    it('should reject password longer than 128 characters', async () => {
      const invalidPayload = {
        email: 'test@example.com',
        code: '123456',
        newPassword: 'a'.repeat(129),
      };

      await expect(service.resetPassword(invalidPayload as any)).rejects.toThrow();
    });

    it('should reject missing email field', async () => {
      const invalidPayload = {
        code: '123456',
        newPassword: 'NewPassword123!',
      };

      await expect(service.resetPassword(invalidPayload as any)).rejects.toThrow();
    });

    it('should reject missing code field', async () => {
      const invalidPayload = {
        email: 'test@example.com',
        newPassword: 'NewPassword123!',
      };

      await expect(service.resetPassword(invalidPayload as any)).rejects.toThrow();
    });

    it('should reject missing newPassword field', async () => {
      const invalidPayload = {
        email: 'test@example.com',
        code: '123456',
      };

      await expect(service.resetPassword(invalidPayload as any)).rejects.toThrow();
    });

    it('should reject null values', async () => {
      const invalidPayload = {
        email: null,
        code: '123456',
        newPassword: 'NewPassword123!',
      };

      await expect(service.resetPassword(invalidPayload as any)).rejects.toThrow();
    });
  });

  describe('Force re-login behavior', () => {
    it('should delete all refresh tokens to force re-login', async () => {
      (redisMock.get as jest.Mock)
        .mockResolvedValueOnce('123456') // Reset code
        .mockResolvedValueOnce(mockUser.id); // Refresh token

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$new_hash');
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: '$2b$12$new_hash',
      });

      (redisMock.scan as jest.Mock).mockResolvedValueOnce(['0', ['refresh:token_hash_1']]);

      (redisMock.del as jest.Mock).mockResolvedValue(1);

      await service.resetPassword(mockResetPayload);

      // Verify all refresh tokens were invalidated
      expect(redisMock.scan).toHaveBeenCalledWith('0', 'MATCH', 'refresh:*', 'COUNT', 100);
    });

    it('should handle case with no existing refresh tokens', async () => {
      (redisMock.get as jest.Mock).mockResolvedValue('123456');
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$new_hash');
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: '$2b$12$new_hash',
      });
      (redisMock.scan as jest.Mock).mockResolvedValue(['0', []]);
      (redisMock.del as jest.Mock).mockResolvedValue(1);

      const result = await service.resetPassword(mockResetPayload);

      expect(result.success).toBe(true);
      // Should still call scan even if no tokens found
      expect(redisMock.scan).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle multiple reset attempts with different codes', async () => {
      (redisMock.get as jest.Mock)
        .mockResolvedValueOnce('654321') // First code attempt
        .mockResolvedValueOnce('123456'); // Second code attempt

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$new_hash');
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: '$2b$12$new_hash',
      });
      (redisMock.scan as jest.Mock).mockResolvedValue(['0', []]);
      (redisMock.del as jest.Mock).mockResolvedValue(1);

      // First attempt should fail
      await expect(service.resetPassword(mockResetPayload)).rejects.toThrow(
        new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid or expired reset link',
        }),
      );

      // Second attempt should succeed
      const result = await service.resetPassword(mockResetPayload);
      expect(result.success).toBe(true);
    });

    it('should handle code with leading zeros', async () => {
      const payloadWithLeadingZeros = {
        email: 'test@example.com',
        code: '000123',
        newPassword: 'NewPassword123!',
      };

      (redisMock.get as jest.Mock).mockResolvedValue('000123');
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$new_hash');
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: '$2b$12$new_hash',
      });
      (redisMock.scan as jest.Mock).mockResolvedValue(['0', []]);
      (redisMock.del as jest.Mock).mockResolvedValue(1);

      const result = await service.resetPassword(payloadWithLeadingZeros);
      expect(result.success).toBe(true);
    });

    it('should handle password with special characters', async () => {
      const payloadWithSpecialChars = {
        email: 'test@example.com',
        code: '123456',
        newPassword: 'P@ssw0rd!#$%^&*()',
      };

      (redisMock.get as jest.Mock).mockResolvedValue('123456');
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$new_hash');
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: '$2b$12$new_hash',
      });
      (redisMock.scan as jest.Mock).mockResolvedValue(['0', []]);
      (redisMock.del as jest.Mock).mockResolvedValue(1);

      const result = await service.resetPassword(payloadWithSpecialChars);
      expect(result.success).toBe(true);
    });

    it('should be case-sensitive for codes', async () => {
      const payloadWithLetters = {
        email: 'test@example.com',
        code: '123456',
        newPassword: 'NewPassword123!',
      };

      // Mock returns code with different case (should be numeric, but testing strictness)
      (redisMock.get as jest.Mock).mockResolvedValue('123456');

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$new_hash');
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: '$2b$12$new_hash',
      });
      (redisMock.scan as jest.Mock).mockResolvedValue(['0', []]);
      (redisMock.del as jest.Mock).mockResolvedValue(1);

      const result = await service.resetPassword(payloadWithLetters);
      expect(result.success).toBe(true);
    });
  });
});
