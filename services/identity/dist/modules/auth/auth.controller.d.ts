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
    login(data: any): Promise<{
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
    refresh(data: any): Promise<{
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