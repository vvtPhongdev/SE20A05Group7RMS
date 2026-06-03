import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    list(data: {
        page?: number;
        limit?: number;
        role?: string;
    }): Promise<{
        data: {
            id: string;
            email: string;
            displayName: string;
            role: string;
            organizationId: string;
            departmentId: string | null;
            phone: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    get(data: {
        id: string;
    }): Promise<{
        id: string;
        email: string;
        displayName: string;
        role: string;
        organizationId: string;
        departmentId: string | null;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(data: any): Promise<{
        id: string;
        email: string;
        displayName: string;
        role: string;
        organizationId: string;
        departmentId: string | null;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(data: any): Promise<{
        id: string;
        email: string;
        displayName: string;
        role: string;
        organizationId: string;
        departmentId: string | null;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    delete(data: {
        id: string;
    }): Promise<{
        success: boolean;
    }>;
    updateRole(data: {
        id: string;
        role: string;
    }): Promise<{
        id: string;
        email: string;
        displayName: string;
        role: string;
        organizationId: string;
        departmentId: string | null;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateStatus(data: {
        id: string;
        isActive: boolean;
    }): Promise<{
        id: string;
        email: string;
        displayName: string;
        role: string;
        organizationId: string;
        departmentId: string | null;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
//# sourceMappingURL=users.controller.d.ts.map