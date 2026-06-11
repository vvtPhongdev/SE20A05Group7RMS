import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthTokenResponse } from '@wr/contracts';

describe('AuthController - Refresh Message Pattern', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthTokenResponse: AuthTokenResponse = {
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
    expiresIn: 3600,
    user: {
      id: 'uuid-1234',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'CANDIDATE',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            refresh: jest.fn().mockResolvedValue(mockAuthTokenResponse),
            findAll: jest.fn().mockReturnValue({ message: 'Auth endpoint — not yet implemented' }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('refresh - Message Pattern Handler', () => {
    it('should handle identity.auth.refresh message pattern', async () => {
      // Arrange
      const payload = {
        refreshToken: 'valid-refresh-token',
      };

      // Act
      const result = await controller.refresh(payload);

      // Assert
      expect(result).toEqual(mockAuthTokenResponse);
      expect(authService.refresh).toHaveBeenCalledWith(payload);
    });

    it('should return new token pair from refresh endpoint', async () => {
      // Arrange
      const payload = {
        refreshToken: 'refresh-token-abc123',
      };

      // Act
      const result = await controller.refresh(payload);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
      expect(result.expiresIn).toBe(3600);
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should propagate service errors to caller', async () => {
      // Arrange
      const payload = { refreshToken: 'invalid-token' };
      const error = new Error('Token validation failed');

      jest.spyOn(authService, 'refresh').mockRejectedValueOnce(error);

      // Act & Assert
      await expect(controller.refresh(payload)).rejects.toThrow('Token validation failed');
    });

    it('should propagate UnauthorizedException from service', async () => {
      // Arrange
      const payload = { refreshToken: 'expired-token' };
      const unauthorizedError = new Error('Refresh token has expired');

      jest.spyOn(authService, 'refresh').mockRejectedValueOnce(unauthorizedError);

      // Act & Assert
      await expect(controller.refresh(payload)).rejects.toThrow('Refresh token has expired');
    });
  });

  describe('refresh - Payload Handling', () => {
    it('should handle payload with additional properties', async () => {
      // Arrange
      const payload = {
        refreshToken: 'valid-refresh-token',
        extraProperty: 'should be ignored',
        anotherExtra: 123,
      };

      // Act
      const result = await controller.refresh(payload);

      // Assert
      expect(result).toEqual(mockAuthTokenResponse);
      expect(authService.refresh).toHaveBeenCalledWith(payload);
    });

    it('should handle null payload gracefully', async () => {
      // Arrange
      const payload = null;

      jest.spyOn(authService, 'refresh').mockImplementationOnce((p) => {
        if (p === null) {
          return Promise.reject(new Error('Invalid payload'));
        }
        return Promise.resolve(mockAuthTokenResponse);
      });

      // Act & Assert
      await expect(controller.refresh(payload)).rejects.toThrow('Invalid payload');
    });

    it('should handle undefined payload gracefully', async () => {
      // Arrange
      const payload = undefined;

      jest.spyOn(authService, 'refresh').mockImplementationOnce((p) => {
        if (p === undefined) {
          return Promise.reject(new Error('Invalid payload'));
        }
        return Promise.resolve(mockAuthTokenResponse);
      });

      // Act & Assert
      await expect(controller.refresh(payload)).rejects.toThrow('Invalid payload');
    });
  });

  describe('refresh - Concurrent Requests', () => {
    it('should handle multiple concurrent refresh requests', async () => {
      // Arrange
      const payloads = [
        { refreshToken: 'token-1' },
        { refreshToken: 'token-2' },
        { refreshToken: 'token-3' },
      ];

      jest.spyOn(authService, 'refresh').mockResolvedValue(mockAuthTokenResponse);

      // Act
      const results = await Promise.all(payloads.map((p) => controller.refresh(p)));

      // Assert
      expect(results).toHaveLength(3);
      results.forEach((result: any) => {
        expect(result).toEqual(mockAuthTokenResponse);
      });
      expect(authService.refresh).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failure in concurrent requests', async () => {
      // Arrange
      const payloads = [
        { refreshToken: 'valid-token' },
        { refreshToken: 'invalid-token' },
        { refreshToken: 'another-valid-token' },
      ];

      jest
        .spyOn(authService, 'refresh')
        .mockResolvedValueOnce(mockAuthTokenResponse)
        .mockRejectedValueOnce(new Error('Invalid token'))
        .mockResolvedValueOnce(mockAuthTokenResponse);

      // Act
      const results = await Promise.allSettled(payloads.map((p) => controller.refresh(p)));

      // Assert
      const [res1, res2, res3] = results as [
        PromiseFulfilledResult<any>,
        PromiseRejectedResult,
        PromiseFulfilledResult<any>,
      ];
      expect(res1.status).toBe('fulfilled');
      expect(res2.status).toBe('rejected');
      expect(res3.status).toBe('fulfilled');
    });
  });

  describe('refresh - Different Token Scenarios', () => {
    it('should handle short refresh tokens', async () => {
      // Arrange
      const payload = {
        refreshToken: 'short',
      };

      // Act
      const result = await controller.refresh(payload);

      // Assert
      expect(result).toEqual(mockAuthTokenResponse);
      expect(authService.refresh).toHaveBeenCalledWith(payload);
    });

    it('should handle very long refresh tokens', async () => {
      // Arrange
      const longToken = 'a'.repeat(5000);
      const payload = {
        refreshToken: longToken,
      };

      // Act
      const result = await controller.refresh(payload);

      // Assert
      expect(result).toEqual(mockAuthTokenResponse);
      expect(authService.refresh).toHaveBeenCalledWith(payload);
    });

    it('should handle refresh tokens with special characters', async () => {
      // Arrange
      const payload = {
        refreshToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      };

      // Act
      const result = await controller.refresh(payload);

      // Assert
      expect(result).toEqual(mockAuthTokenResponse);
    });
  });

  describe('refresh - Response Format Validation', () => {
    it('should always return tokens with expiresIn', async () => {
      // Arrange
      const payload = {
        refreshToken: 'valid-token',
      };

      // Act
      const result = await controller.refresh(payload);

      // Assert
      expect(result).toHaveProperty('accessToken', 'new-access-token');
      expect(result).toHaveProperty('refreshToken', 'new-refresh-token');
      expect(result).toHaveProperty('expiresIn', 3600);
      expect(typeof result.accessToken).toBe('string');
      expect(typeof result.refreshToken).toBe('string');
      expect(typeof result.expiresIn).toBe('number');
    });

    it('should return different tokens on each refresh', async () => {
      // Arrange
      const payload = {
        refreshToken: 'valid-token',
      };

      const firstResponse: AuthTokenResponse = {
        accessToken: 'first-access-token',
        refreshToken: 'first-refresh-token',
        expiresIn: 3600,
        user: { id: 'uuid-1', email: 'user1@test.com', displayName: 'User One', role: 'CANDIDATE' },
      };

      const secondResponse: AuthTokenResponse = {
        accessToken: 'second-access-token',
        refreshToken: 'second-refresh-token',
        expiresIn: 3600,
        user: { id: 'uuid-2', email: 'user2@test.com', displayName: 'User Two', role: 'CANDIDATE' },
      };

      jest
        .spyOn(authService, 'refresh')
        .mockResolvedValueOnce(firstResponse)
        .mockResolvedValueOnce(secondResponse);

      // Act
      const result1 = await controller.refresh(payload);
      const result2 = await controller.refresh(payload);

      // Assert
      expect(result1).toEqual(firstResponse);
      expect(result2).toEqual(secondResponse);
      expect(result1.accessToken).not.toEqual(result2.accessToken);
      expect(result1.refreshToken).not.toEqual(result2.refreshToken);
    });
  });

  describe('refresh - Integration with Login', () => {
    it('should ensure refresh and login return same response type', async () => {
      // Arrange
      const loginPayload = {
        email: 'test@example.com',
        password: 'password123',
      };

      const refreshPayload = {
        refreshToken: 'refresh-token',
      };

      jest.spyOn(authService, 'login').mockResolvedValueOnce(mockAuthTokenResponse);
      jest.spyOn(authService, 'refresh').mockResolvedValueOnce(mockAuthTokenResponse);

      // Act
      const loginResult = await controller.login(loginPayload);
      const refreshResult = await controller.refresh(refreshPayload);

      // Assert
      expect(loginResult).toHaveProperty('accessToken');
      expect(loginResult).toHaveProperty('refreshToken');
      expect(loginResult).toHaveProperty('expiresIn');
      expect(refreshResult).toHaveProperty('accessToken');
      expect(refreshResult).toHaveProperty('refreshToken');
      expect(refreshResult).toHaveProperty('expiresIn');
    });
  });
});
