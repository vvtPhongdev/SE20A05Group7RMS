import { PrismaService } from '../../common/database/prisma.service';
import { CreateUserInput, UpdateUserInput } from '@wr/contracts';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private get userSelect();
    list(query: {
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
    get(payload: {
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
    create(dto: CreateUserInput & {
        password?: string;
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
    update(payload: {
        id: string;
    } & UpdateUserInput): Promise<{
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
    delete(payload: {
        id: string;
    }): Promise<{
        success: boolean;
    }>;
    updateRole(payload: {
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
    updateStatus(payload: {
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
//# sourceMappingURL=users.service.d.ts.map