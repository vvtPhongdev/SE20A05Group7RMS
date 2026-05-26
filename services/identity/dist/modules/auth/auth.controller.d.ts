import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly service;
    constructor(service: AuthService);
    register(data: any): Promise<{
        user: {
            id: string;
            email: string;
            displayName: string;
            role: string;
        };
        refreshToken: string;
        accessToken: string;
        expiresIn: number;
    }>;
}
//# sourceMappingURL=auth.controller.d.ts.map