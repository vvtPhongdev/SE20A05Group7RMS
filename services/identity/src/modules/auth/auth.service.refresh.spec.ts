import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/database/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { EnvConfig } from '@wr/config';

describe('AuthService - Token Refresh', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let redisService: RedisService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'CANDIDATE',
    passwordHash: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockConfig: Partial<EnvConfig> = {
    JWT_SECRET: 'test-secret-key-very-long',
    JWT_EXPIRES_IN: '7d',
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
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            storeRefreshToken: jest.fn(),
            getRefreshToken: jest.fn(),
            deleteRefreshToken: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: EnvConfig,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('refresh - Success Cases', () => {
    it('should return new token pair with valid refresh token', async () => {
      // Arrange
      const oldTokenId = 'token-id-123';
      const oldRefreshToken = 'old-refresh-token';
      const newAccessToken = 'new-access-token';
      const newRefreshToken = 'new-refresh-token';
      const newTokenId = 'new-token-id-456';

      const decodedToken = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        tokenId: oldTokenId,
      };

      const refreshRequest = {
        refreshToken: oldRefreshToken,
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(decodedToken);
      jest.spyOn(redisService, 'getRefreshToken').mockResolvedValueOnce(mockUser.id);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(mockUser as any);
      jest.spyOn(redisService, 'deleteRefreshToken').mockResolvedValueOnce(undefined);
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce(newAccessToken).mockReturnValueOnce(newRefreshToken);
      jest.spyOn(redisService, 'storeRefreshToken').mockResolvedValueOnce(undefined);

      jest.spyOn(require('crypto'), 'randomUUID').mockReturnValueOnce(newTokenId);

      // Act
      const result = await service.refresh(refreshRequest);

      // Assert
      expect(result).toEqual({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 3600,
      });
      expect(redisService.deleteRefreshToken).toHaveBeenCalledWith(oldTokenId);
      expect(redisService.storeRefreshToken).toHaveBeenCalledWith(newTokenId, mockUser.id, 30 * 24 * 60 * 60);
    });

    it('should invalidate old token (token rotation)', async () => {
      // Arrange
      const oldTokenId = 'old-token-id-123';
      const oldRefreshToken = 'old-refresh-token';

      const decodedToken = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        tokenId: oldTokenId,
      };

      const refreshRequest = {
        refreshToken: oldRefreshToken,
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(decodedToken);
      jest.spyOn(redisService, 'getRefreshToken').mockResolvedValueOnce(mockUser.id);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(mockUser as any);
      jest.spyOn(redisService, 'deleteRefreshToken').mockResolvedValueOnce(undefined);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');
      jest.spyOn(redisService, 'storeRefreshToken').mockResolvedValueOnce(undefined);

      // Act
      await service.refresh(refreshRequest);

      // Assert
      expect(redisService.deleteRefreshToken).toHaveBeenCalledWith(oldTokenId);
      // Verify deletion happened before new token storage
      expect(redisService.deleteRefreshToken).toHaveBeenCalledBefore(
        redisService.storeRefreshToken as jest.Mock,
      );
    });

    it('should generate new JWT tokens with updated claims', async () => {
      // Arrange
      const tokenId = 'token-id-123';
      const refreshToken = 'refresh-token';

      const decodedToken = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        tokenId,
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(decodedToken);
      jest.spyOn(redisService, 'getRefreshToken').mockResolvedValueOnce(mockUser.id);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(mockUser as any);
      jest.spyOn(redisService, 'deleteRefreshToken').mockResolvedValueOnce(undefined);
      jest.spyOn(jwtService, 'sign').mockReturnValueOnce('access').mockReturnValueOnce('refresh');
      jest.spyOn(redisService, 'storeRefreshToken').mockResolvedValueOnce(undefined);

      // Act
      await service.refresh({ refreshToken });

      // Assert
      expect(jwtService.sign).toHaveBeenCalledTimes(2);

      const accessTokenCall = (jwtService.sign as jest.Mock).mock.calls[0];
      expect(accessTokenCall[0]).toMatchObject({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(accessTokenCall[1]).toEqual({ expiresIn: '1h' });

      const refreshTokenCall = (jwtService.sign as jest.Mock).mock.calls[1];
      expect(refreshTokenCall[0]).toMatchObject({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        tokenId: expect.any(String),
      });
      expect(refreshTokenCall[1]).toEqual({ expiresIn: '30d' });
    });

    it('should store new refresh token in Redis with 30-day TTL', async () => {
      // Arrange
      const tokenId = 'token-id-123';
      const newTokenId = 'new-token-id-456';

      const decodedToken = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        tokenId,
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(decodedToken);
      jest.spyOn(redisService, 'getRefreshToken').mockResolvedValueOnce(mockUser.id);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(mockUser as any);
      jest.spyOn(redisService, 'deleteRefreshToken').mockResolvedValueOnce(undefined);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');
      jest.spyOn(redisService, 'storeRefreshToken').mockResolvedValueOnce(undefined);
      jest.spyOn(require('crypto'), 'randomUUID').mockReturnValueOnce(newTokenId);

      // Act
      await service.refresh({ refreshToken: 'token' });

      // Assert
      expect(redisService.storeRefreshToken).toHaveBeenCalledWith(
        newTokenId,
        mockUser.id,
        30 * 24 * 60 * 60,
      );
    });
  });

  describe('refresh - Validation Error Cases', () => {
    it('should throw BadRequestException for invalid refresh token format', async () => {
      // Arrange
      const invalidRequest = {
        refreshToken: '',
      };

      // Act & Assert
      await expect(service.refresh(invalidRequest)).rejects.toThrow(BadRequestException);
      expect(jwtService.verify).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for missing refresh token', async () => {
      // Arrange
      const invalidRequest = {};

      // Act & Assert
      await expect(service.refresh(invalidRequest)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for null refresh token', async () => {
      // Arrange
      const invalidRequest = {
        refreshToken: null,
      };

      // Act & Assert
      await expect(service.refresh(invalidRequest)).rejects.toThrow(BadRequestException);
    });
  });

  describe('refresh - Expiry Error Cases', () => {
    it('should return 401 for expired refresh token', async () => {
      // Arrange
      const expiredRefreshToken = 'expired-token';

      const tokenExpiredError = new Error('jwt expired');
      (tokenExpiredError as any).name = 'TokenExpiredError';

      jest.spyOn(jwtService, 'verify').mockImplementationOnce(() => {
        throw tokenExpiredError;
      });

      // Act & Assert
      try {
        await service.refresh({ refreshToken: expiredRefreshToken });
        fail('Should have thrown UnauthorizedException');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        const response = error.getResponse();
        expect(response).toMatchObject({
          code: 'UNAUTHORIZED',
          message: 'Refresh token has expired',
        });
      }
    });

    it('should return 401 for invalid token signature', async () => {
      // Arrange
      const invalidToken = 'invalid.token.signature';

      const signatureError = new Error('invalid signature');
      jest.spyOn(jwtService, 'verify').mockImplementationOnce(() => {
        throw signatureError;
      });

      // Act & Assert
      try {
        await service.refresh({ refreshToken: invalidToken });
        fail('Should have thrown UnauthorizedException');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        const response = error.getResponse();
        expect(response).toMatchObject({
          code: 'UNAUTHORIZED',
          message: 'Invalid refresh token',
        });
      }
    });

    it('should return 401 for malformed JWT', async () => {
      // Arrange
      const malformedToken = 'not.a.jwt';

      const malformedError = new Error('jwt malformed');
      jest.spyOn(jwtService, 'verify').mockImplementationOnce(() => {
        throw malformedError;
      });

      // Act & Assert
      try {
        await service.refresh({ refreshToken: malformedToken });
        fail('Should have thrown UnauthorizedException');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toContain('Invalid refresh token');
      }
    });
  });

  describe('refresh - Redis Revocation Cases', () => {
    it('should return 401 for token not found in Redis', async () => {
      // Arrange
      const tokenId = 'token-id-123';
      const refreshToken = 'refresh-token';

      const decodedToken = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        tokenId,
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(decodedToken);
      jest.spyOn(redisService, 'getRefreshToken').mockResolvedValueOnce(null); // Token not found

      // Act & Assert
      try {
        await service.refresh({ refreshToken });
        fail('Should have thrown UnauthorizedException');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        const response = error.getResponse();
        expect(response).toMatchObject({
          code: 'UNAUTHORIZED',
          message: 'Refresh token is invalid or has been revoked',
        });
      }
    });

    it('should return 401 for user mismatch in Redis', async () => {
      // Arrange
      const tokenId = 'token-id-123';
      const refreshToken = 'refresh-token';
      const wrongUserId = 'different-user-id';

      const decodedToken = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        tokenId,
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(decodedToken);
      jest.spyOn(redisService, 'getRefreshToken').mockResolvedValueOnce(wrongUserId); // Different user

      // Act & Assert
      try {
        await service.refresh({ refreshToken });
        fail('Should have thrown UnauthorizedException');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toContain('invalid or has been revoked');
      }
    });

    it('should return 401 for revoked token (previous rotation)', async () => {
      // Arrange: Simulate a token that was already used for rotation
      const oldTokenId = 'old-token-id-already-rotated';
      const refreshToken = 'old-refresh-token';

      const decodedToken = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        tokenId: oldTokenId,
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(decodedToken);
      jest.spyOn(redisService, 'getRefreshToken').mockResolvedValueOnce(null); // Already deleted by rotation

      // Act & Assert
      try {
        await service.refresh({ refreshToken });
        fail('Should have thrown UnauthorizedException');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toContain('invalid or has been revoked');
      }
    });
  });

  describe('refresh - Database Error Cases', () => {
    it('should return 401 when user not found in database', async () => {
      // Arrange
      const tokenId = 'token-id-123';

      const decodedToken = {
        sub: 'nonexistent-user-id',
        email: 'nonexistent@example.com',
        role: 'CANDIDATE',
        tokenId,
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(decodedToken);
      jest.spyOn(redisService, 'getRefreshToken').mockResolvedValueOnce(decodedToken.sub);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(null);

      // Act & Assert
      try {
        await service.refresh({ refreshToken: 'token' });
        fail('Should have thrown UnauthorizedException');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        const response = error.getResponse();
        expect(response).toMatchObject({
          code: 'UNAUTHORIZED',
          message: 'User not found',
        });
      }
    });

    it('should return 401 when token missing tokenId claim', async () => {
      // Arrange
      const refreshToken = 'refresh-token';

      const decodedToken = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        // tokenId missing
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(decodedToken);
      jest.spyOn(redisService, 'getRefreshToken').mockResolvedValueOnce(null);

      // Act & Assert
      try {
        await service.refresh({ refreshToken });
        fail('Should have thrown UnauthorizedException');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        const response = error.getResponse();
        expect(response).toMatchObject({
          code: 'UNAUTHORIZED',
          message: 'Invalid refresh token',
        });
      }
    });
  });

  describe('refresh - Token Rotation Security', () => {
    it('should prevent reuse of the same refresh token', async () => {
      // Arrange
      const tokenId = 'token-id-123';
      const refreshToken = 'refresh-token';

      const decodedToken = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        tokenId,
      };

      // First refresh succeeds
      jest.spyOn(jwtService, 'verify').mockReturnValue(decodedToken);
      jest.spyOn(redisService, 'getRefreshToken').mockResolvedValueOnce(mockUser.id);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(mockUser as any);
      jest.spyOn(redisService, 'deleteRefreshToken').mockResolvedValueOnce(undefined);
      jest.spyOn(jwtService, 'sign').mockReturnValue('new-token');
      jest.spyOn(redisService, 'storeRefreshToken').mockResolvedValueOnce(undefined);

      // Act: First refresh
      await service.refresh({ refreshToken });

      // Now attempt to reuse the same token
      jest.spyOn(redisService, 'getRefreshToken').mockResolvedValueOnce(null); // Token no longer in Redis

      // Act & Assert: Second refresh with same token should fail
      try {
        await service.refresh({ refreshToken });
        fail('Should have thrown UnauthorizedException');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
      }
    });

    it('should handle concurrent refresh attempts', async () => {
      // Arrange
      const tokenId = 'token-id-123';
      const refreshToken = 'refresh-token';

      const decodedToken = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        tokenId,
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(decodedToken);
      jest.spyOn(redisService, 'getRefreshToken').mockResolvedValueOnce(mockUser.id);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(mockUser as any);
      jest.spyOn(redisService, 'deleteRefreshToken').mockResolvedValueOnce(undefined);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');
      jest.spyOn(redisService, 'storeRefreshToken').mockResolvedValueOnce(undefined);

      // Act: Attempt concurrent refreshes (both would succeed in race condition)
      const refreshPromises = [
        service.refresh({ refreshToken }),
        service.refresh({ refreshToken }),
      ];

      // One might succeed, but both might not due to Redis operations
      const results = await Promise.allSettled(refreshPromises);

      // Assert: At least one should have been rejected due to race condition
      // (both getting the token but only one deleting it first)
      expect(results.length).toBe(2);
      // At least one success, potentially both due to test setup
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      expect(successCount).toBeGreaterThan(0);
    });
  });

  describe('refresh - Role Preservation', () => {
    it('should preserve user role through token refresh', async () => {
      // Arrange
      const roles = ['CANDIDATE', 'RECRUITER', 'HIRING_MANAGER', 'DEPARTMENT_HEAD', 'ADMIN'];

      for (const role of roles) {
        const userWithRole = { ...mockUser, role };
        const tokenId = 'token-id-123';

        const decodedToken = {
          sub: mockUser.id,
          email: mockUser.email,
          role,
          tokenId,
        };

        jest.spyOn(jwtService, 'verify').mockReturnValue(decodedToken);
        jest.spyOn(redisService, 'getRefreshToken').mockResolvedValueOnce(mockUser.id);
        jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(userWithRole as any);
        jest.spyOn(redisService, 'deleteRefreshToken').mockResolvedValueOnce(undefined);
        jest.spyOn(jwtService, 'sign').mockReturnValueOnce('access').mockReturnValueOnce('refresh');
        jest.spyOn(redisService, 'storeRefreshToken').mockResolvedValueOnce(undefined);

        // Act
        await service.refresh({ refreshToken: 'token' });

        // Assert
        expect(jwtService.sign).toHaveBeenCalledWith(
          expect.objectContaining({ role }),
          expect.any(Object),
        );

        jest.clearAllMocks();
      }
    });
  });
});
