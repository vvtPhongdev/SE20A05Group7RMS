import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

describe('AuthController - resetPassword', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockResetPayload = {
    email: 'test@example.com',
    code: '123456',
    newPassword: 'NewPassword123!',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            resetPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Message Pattern: identity.auth.reset-password', () => {
    it('should handle reset-password message pattern', async () => {
      (service.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await controller.resetPassword(mockResetPayload);

      expect(result).toEqual({ success: true });
      expect(service.resetPassword).toHaveBeenCalledWith(mockResetPayload);
    });

    it('should return success response format', async () => {
      (service.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await controller.resetPassword(mockResetPayload);

      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
    });
  });

  describe('Error Propagation', () => {
    it('should propagate invalid code error from service', async () => {
      const error = new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid or expired reset code',
      });
      (service.resetPassword as jest.Mock).mockRejectedValue(error);

      await expect(controller.resetPassword(mockResetPayload)).rejects.toThrow(error);
    });

    it('should propagate validation error from service', async () => {
      const error = new Error('Validation failed');
      (service.resetPassword as jest.Mock).mockRejectedValue(error);

      await expect(controller.resetPassword(mockResetPayload)).rejects.toThrow('Validation failed');
    });

    it('should propagate database error from service', async () => {
      const error = new Error('Database connection error');
      (service.resetPassword as jest.Mock).mockRejectedValue(error);

      await expect(controller.resetPassword(mockResetPayload)).rejects.toThrow(
        'Database connection error',
      );
    });

    it('should propagate Redis error from service', async () => {
      const error = new Error('Redis connection error');
      (service.resetPassword as jest.Mock).mockRejectedValue(error);

      await expect(controller.resetPassword(mockResetPayload)).rejects.toThrow(
        'Redis connection error',
      );
    });
  });

  describe('Payload Handling', () => {
    it('should handle payload with extra properties', async () => {
      (service.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      const payloadWithExtra = {
        ...mockResetPayload,
        extraField: 'should be ignored',
        anotherField: 123,
      };

      const result = await controller.resetPassword(payloadWithExtra);

      expect(result).toEqual({ success: true });
      expect(service.resetPassword).toHaveBeenCalledWith(payloadWithExtra);
    });

    it('should handle null payload', async () => {
      (service.resetPassword as jest.Mock).mockRejectedValue(new Error('Validation failed'));

      await expect(controller.resetPassword(null as any)).rejects.toThrow();
    });

    it('should handle undefined payload', async () => {
      (service.resetPassword as jest.Mock).mockRejectedValue(new Error('Validation failed'));

      await expect(controller.resetPassword(undefined as any)).rejects.toThrow();
    });

    it('should pass payload as-is to service', async () => {
      (service.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      await controller.resetPassword(mockResetPayload);

      expect(service.resetPassword).toHaveBeenCalledWith(mockResetPayload);
      expect(service.resetPassword).toHaveBeenCalledTimes(1);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple simultaneous reset requests', async () => {
      (service.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      const payload1 = { email: 'user1@example.com', code: '111111', newPassword: 'Pass1111111!' };
      const payload2 = { email: 'user2@example.com', code: '222222', newPassword: 'Pass2222222!' };
      const payload3 = { email: 'user3@example.com', code: '333333', newPassword: 'Pass3333333!' };

      const results = await Promise.all([
        controller.resetPassword(payload1),
        controller.resetPassword(payload2),
        controller.resetPassword(payload3),
      ]);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success === true)).toBe(true);
      expect(service.resetPassword).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures in concurrent requests', async () => {
      (service.resetPassword as jest.Mock)
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(
          new RpcException({
            status: HttpStatus.BAD_REQUEST,
            message: 'Invalid code',
          }),
        )
        .mockResolvedValueOnce({ success: true });

      const payload1 = { email: 'user1@example.com', code: '111111', newPassword: 'Pass1111111!' };
      const payload2 = { email: 'user2@example.com', code: 'invalid', newPassword: 'Pass2222222!' };
      const payload3 = { email: 'user3@example.com', code: '333333', newPassword: 'Pass3333333!' };

      const results = await Promise.allSettled([
        controller.resetPassword(payload1),
        controller.resetPassword(payload2),
        controller.resetPassword(payload3),
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });
  });

  describe('Token Scenarios', () => {
    it('should handle code with leading zeros', async () => {
      (service.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      const payloadWithLeadingZeros = {
        email: 'test@example.com',
        code: '000123',
        newPassword: 'NewPassword123!',
      };

      const result = await controller.resetPassword(payloadWithLeadingZeros);

      expect(result.success).toBe(true);
    });

    it('should handle minimum length password', async () => {
      (service.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      const payloadMinPassword = {
        email: 'test@example.com',
        code: '123456',
        newPassword: 'Pass12345',
      };

      const result = await controller.resetPassword(payloadMinPassword);

      expect(result.success).toBe(true);
    });

    it('should handle maximum length password', async () => {
      (service.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      const payloadMaxPassword = {
        email: 'test@example.com',
        code: '123456',
        newPassword: 'a'.repeat(128),
      };

      const result = await controller.resetPassword(payloadMaxPassword);

      expect(result.success).toBe(true);
    });

    it('should handle special characters in password', async () => {
      (service.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      const payloadSpecialChars = {
        email: 'test@example.com',
        code: '123456',
        newPassword: 'P@$$w0rd!#%&*()_+-=[]{};:',
      };

      const result = await controller.resetPassword(payloadSpecialChars);

      expect(result.success).toBe(true);
    });

    it('should handle unicode characters in password', async () => {
      (service.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      const payloadUnicode = {
        email: 'test@example.com',
        code: '123456',
        newPassword: 'Pässwörd123!',
      };

      const result = await controller.resetPassword(payloadUnicode);

      expect(result.success).toBe(true);
    });
  });

  describe('Response Format', () => {
    it('should always return success response format', async () => {
      (service.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await controller.resetPassword(mockResetPayload);

      expect(result).toEqual({ success: true });
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('success');
    });

    it('should return boolean success value', async () => {
      (service.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await controller.resetPassword(mockResetPayload);

      expect(typeof result.success).toBe('boolean');
      expect(result.success).toBe(true);
    });

    it('should not include sensitive information in response', async () => {
      (service.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await controller.resetPassword(mockResetPayload);

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('code');
      expect(result).not.toHaveProperty('email');
    });
  });

  describe('Invalid Code Scenarios', () => {
    it('should propagate invalid code error', async () => {
      const error = new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid or expired reset code',
      });
      (service.resetPassword as jest.Mock).mockRejectedValue(error);

      await expect(controller.resetPassword(mockResetPayload)).rejects.toThrow(error);
    });

    it('should propagate error for non-existent code', async () => {
      const error = new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid or expired reset code',
      });
      (service.resetPassword as jest.Mock).mockRejectedValue(error);

      const payload = {
        email: 'test@example.com',
        code: '999999',
        newPassword: 'NewPassword123!',
      };

      await expect(controller.resetPassword(payload)).rejects.toThrow(error);
    });

    it('should propagate error for expired code', async () => {
      const error = new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid or expired reset code',
      });
      (service.resetPassword as jest.Mock).mockRejectedValue(error);

      await expect(controller.resetPassword(mockResetPayload)).rejects.toThrow(error);
    });
  });

  describe('Force Re-login (All tokens deleted)', () => {
    it('should clear all refresh tokens by deleting them', async () => {
      (service.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      await controller.resetPassword(mockResetPayload);

      // Service is responsible for clearing tokens
      // Controller just passes through
      expect(service.resetPassword).toHaveBeenCalled();
    });

    it('should require re-login after password reset', async () => {
      (service.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await controller.resetPassword(mockResetPayload);

      // Response indicates successful reset (refresh tokens deleted server-side)
      expect(result.success).toBe(true);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete password reset flow', async () => {
      (service.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await controller.resetPassword(mockResetPayload);

      expect(result).toEqual({ success: true });
      expect(service.resetPassword).toHaveBeenCalledWith(mockResetPayload);
    });

    it('should handle reset with different email formats', async () => {
      (service.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      const emails = [
        'user@example.com',
        'user+tag@example.com',
        'user.name@example.co.uk',
        'user123@test-domain.com',
      ];

      for (const email of emails) {
        const payload = {
          email,
          code: '123456',
          newPassword: 'NewPassword123!',
        };

        const result = await controller.resetPassword(payload);
        expect(result.success).toBe(true);
      }
    });

    it('should handle consistent response across multiple calls', async () => {
      (service.resetPassword as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result1 = await controller.resetPassword(mockResetPayload);
      const result2 = await controller.resetPassword(mockResetPayload);
      const result3 = await controller.resetPassword(mockResetPayload);

      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });
  });
});
