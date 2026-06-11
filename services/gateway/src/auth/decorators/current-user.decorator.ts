import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * JwtPayload interface represents the decoded JWT payload
 * sent by the passport-jwt strategy after successful authentication
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string; // User email
  role: string; // User role (ADMIN, RECRUITER, CANDIDATE, etc.)
  organizationId?: string; // Organization ID (may be optional for certain roles)
  displayName?: string; // User's display name
  iat?: number; // Issued at
  exp?: number; // Expiration time
}

/**
 * @CurrentUser() — Extracts the authenticated user from the JWT payload
 *
 * Usage:
 *   @CurrentUser() user: JwtPayload
 *   @CurrentUser('sub') userId: string
 *   @CurrentUser('email') email: string
 *
 * Returns full JWT payload by default, or specific field if provided.
 */
export const CurrentUser = createParamDecorator(
  (field: keyof JwtPayload, ctx: ExecutionContext): JwtPayload | any => {
    const request = ctx.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) {
      return null;
    }

    // If a specific field is requested, return only that field
    if (field) {
      return user[field];
    }

    // Otherwise return the entire user payload
    return user;
  },
);
