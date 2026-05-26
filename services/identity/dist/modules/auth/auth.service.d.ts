import { OnModuleDestroy } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/database/prisma.service';
import { RegisterUserInput, AuthTokenResponse } from '@wr/contracts';
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
}
//# sourceMappingURL=auth.service.d.ts.map