import { OnModuleDestroy } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/database/prisma.service';
import { RegisterUserInput, AuthTokenResponse, LoginInput } from '@wr/contracts';
export declare class AuthService implements OnModuleDestroy {
    private readonly prisma;
    private readonly jwtService;
    private readonly redis;
    constructor(prisma: PrismaService, jwtService: JwtService);
    onModuleDestroy(): Promise<void>;
    /**
     * Register a new user, hashes password, generates access token and refresh token.
     * Refresh token is stored in Redis under its SHA-256 hash.
     */
    register(dto: RegisterUserInput): Promise<AuthTokenResponse>;
    /**
     * Login a user: validates credentials, verifies bcrypt password, issues JWT + refresh tokens.
     */
    login(dto: LoginInput): Promise<AuthTokenResponse>;
    /**
     * Refresh an existing refresh token and rotate to a new pair.
     */
    refresh(dto: {
        refreshToken: string;
    }): Promise<AuthTokenResponse>;
    /**
     * Generates a 6-digit code for password reset, stores it in Redis (15-min TTL), and sends via SMTP.
     * Rates limits: max 5 requests per 15 min per email.
     * If email does not exist, returns success immediately (prevents email harvesting).
     */
    forgotPassword(dto: {
        email: string;
    }): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=auth.service.d.ts.map