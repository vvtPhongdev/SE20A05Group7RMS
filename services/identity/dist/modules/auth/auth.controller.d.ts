import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly service;
    constructor(service: AuthService);
    register(data: any): Promise<{
        refreshToken: string;
        accessToken: string;
        expiresIn: number;
        user: {
            email: string;
            displayName: string;
            role: string;
            id: string;
        };
    }>;
    login(data: any): Promise<{
        refreshToken: string;
        accessToken: string;
        expiresIn: number;
        user: {
            email: string;
            displayName: string;
            role: string;
            id: string;
        };
    }>;
    refresh(data: any): Promise<{
        refreshToken: string;
        accessToken: string;
        expiresIn: number;
        user: {
            email: string;
            displayName: string;
            role: string;
            id: string;
        };
    }>;
    forgotPassword(data: any): Promise<{
        success: boolean;
    }>;
    resetPassword(data: any): Promise<{
        success: boolean;
    }>;
    logout(data: any): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=auth.controller.d.ts.map