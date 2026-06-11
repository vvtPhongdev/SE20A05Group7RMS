import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new JwtAuthGuard(reflector as any);
  });

  const mockContext = (): ExecutionContext =>
    ({
      getHandler: jest.fn().mockReturnValue({}),
      getClass: jest.fn().mockReturnValue({}),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ headers: {} }),
      }),
    }) as unknown as ExecutionContext;

  // ── @Public() bypass ────────────────────────────────────────────────

  describe('@Public() endpoints — skip JWT validation', () => {
    it('should return true for @Public() endpoints without a token', () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      expect(guard.canActivate(mockContext())).toBe(true);
    });

    it('should read IS_PUBLIC_KEY from handler and class', () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const ctx = mockContext();
      guard.canActivate(ctx);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]);
    });
  });

  // ── handleRequest — 401 enforcement ────────────────────────────────

  describe('handleRequest — unauthenticated request returns 401', () => {
    it('should throw UnauthorizedException (401) when no user in request', () => {
      expect(() => guard.handleRequest(null, null, null)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException (401) when JWT error occurs', () => {
      expect(() =>
        guard.handleRequest(new UnauthorizedException('Token expired'), null, null),
      ).toThrow(UnauthorizedException);
    });
  });

  // ── handleRequest — authenticated pass-through ──────────────────────

  describe('handleRequest — authenticated request passes to controller', () => {
    it('should return user payload when JWT is valid', () => {
      const user = {
        sub: 'user-1',
        email: 'test@example.com',
        role: 'CANDIDATE',
        organizationId: 'org-1',
        displayName: 'Test User',
      };
      expect(guard.handleRequest(null, user, null)).toEqual(user);
    });

    it('should return user payload with all JwtPayload fields intact', () => {
      const user = {
        sub: 'admin-1',
        email: 'admin@example.com',
        role: 'ADMIN',
        organizationId: undefined,
        displayName: 'Admin User',
      };
      const result = guard.handleRequest(null, user, null);
      expect(result).toHaveProperty('sub', 'admin-1');
      expect(result).toHaveProperty('email', 'admin@example.com');
      expect(result).toHaveProperty('role', 'ADMIN');
    });
  });
});
