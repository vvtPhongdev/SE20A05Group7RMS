import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthTokenResponse } from '@wr/contracts';

describe('AuthController - Login Message Pattern', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthTokenResponse: AuthTokenResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,
    user: {
      id: 'uuid-1234',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'CANDIDATE',
      organizationId: '00000000-0000-4000-8000-000000000001',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue(mockAuthTokenResponse),
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

  describe('login - Message Pattern Handler', () => {
    it('should handle identity.auth.login message pattern', async () => {
      // Arrange
      const payload = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      // Act
      const result = await controller.login(payload);

      // Assert
      expect(result).toEqual(mockAuthTokenResponse);
      expect(authService.login).toHaveBeenCalledWith(payload);
    });

    it('should return token pair from login endpoint', async () => {
      // Arrange
      const payload = {
        email: 'user@test.com',
        password: 'SecurePass123!',
      };

      // Act
      const result = await controller.login(payload);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
      expect(result.expiresIn).toBe(3600);
    });

    it('should propagate service errors to caller', async () => {
      // Arrange
      const payload = { email: 'test@example.com', password: 'Password123!' };
      const error = new Error('Authentication failed');

      jest.spyOn(authService, 'login').mockRejectedValueOnce(error);

      // Act & Assert
      await expect(controller.login(payload)).rejects.toThrow('Authentication failed');
    });
  });

  describe('login - Edge Cases', () => {
    it('should handle payload with additional properties', async () => {
      // Arrange
      const payload = {
        email: 'test@example.com',
        password: 'Password123!',
        extraProperty: 'should be ignored',
      };

      // Act
      const result = await controller.login(payload);

      // Assert
      expect(result).toEqual(mockAuthTokenResponse);
    });

    it('should handle null payload gracefully', async () => {
      // Arrange
      const payload = null;

      jest.spyOn(authService, 'login').mockImplementationOnce((p) => {
        if (p === null) {
          return Promise.reject(new Error('Invalid payload'));
        }
        return Promise.resolve(mockAuthTokenResponse);
      });

      // Act & Assert
      await expect(controller.login(payload)).rejects.toThrow('Invalid payload');
    });

    it('should handle undefined payload gracefully', async () => {
      // Arrange
      const payload = undefined;

      jest.spyOn(authService, 'login').mockImplementationOnce((p) => {
        if (p === undefined) {
          return Promise.reject(new Error('Invalid payload'));
        }
        return Promise.resolve(mockAuthTokenResponse);
      });

      // Act & Assert
      await expect(controller.login(payload)).rejects.toThrow('Invalid payload');
    });
  });

  describe('login - Concurrent Requests', () => {
    it('should handle multiple concurrent login requests', async () => {
      // Arrange
      const payloads = [
        { email: 'user1@test.com', password: 'Pass123!' },
        { email: 'user2@test.com', password: 'Pass456!' },
        { email: 'user3@test.com', password: 'Pass789!' },
      ];

      jest.spyOn(authService, 'login').mockResolvedValue(mockAuthTokenResponse);

      // Act
      const results = await Promise.all(payloads.map((p) => controller.login(p)));

      // Assert
      expect(results).toHaveLength(3);
      results.forEach((result: any) => {
        expect(result).toEqual(mockAuthTokenResponse);
      });
      expect(authService.login).toHaveBeenCalledTimes(3);
    });
  });
});
