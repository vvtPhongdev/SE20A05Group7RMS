"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const prisma_service_1 = require("../../common/database/prisma.service");
const contracts_1 = require("@wr/contracts");
const bcrypt = __importStar(require("bcryptjs"));
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    get userSelect() {
        return {
            id: true,
            email: true,
            displayName: true,
            role: true,
            organizationId: true,
            departmentId: true,
            phone: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
        };
    }
    async list(query) {
        const page = Math.max(1, query.page || 1);
        const limit = Math.max(1, Math.min(100, query.limit || 10));
        const skip = (page - 1) * limit;
        const where = {};
        if (query.role) {
            where.role = query.role;
        }
        const [total, data] = await Promise.all([
            this.prisma.user.count({ where }),
            this.prisma.user.findMany({
                where,
                select: this.userSelect,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
        ]);
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async get(payload) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.id },
            select: this.userSelect,
        });
        if (!user) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.NOT_FOUND,
                message: `User with ID ${payload.id} not found`,
            });
        }
        return user;
    }
    async create(dto) {
        // 1. Zod runtime validation for the core user payload
        const parsed = contracts_1.CreateUserSchema.parse(dto);
        // 2. Check email uniqueness
        const existing = await this.prisma.user.findUnique({
            where: { email: parsed.email },
        });
        if (existing) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.CONFLICT,
                message: 'Email already exists',
            });
        }
        // 3. Verify organization exists
        const organization = await this.prisma.organization.findUnique({
            where: { id: parsed.organizationId },
        });
        if (!organization) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.BAD_REQUEST,
                message: 'Organization does not exist',
            });
        }
        // 4. Verify department exists if provided
        if (parsed.departmentId) {
            const department = await this.prisma.department.findUnique({
                where: { id: parsed.departmentId },
            });
            if (!department) {
                throw new microservices_1.RpcException({
                    status: common_1.HttpStatus.BAD_REQUEST,
                    message: 'Department does not exist',
                });
            }
        }
        // 5. Password hashing (if provided)
        let passwordHash = null;
        if (dto.password) {
            passwordHash = await bcrypt.hash(dto.password, 12);
        }
        // 6. DB creation
        const user = await this.prisma.user.create({
            data: {
                email: parsed.email,
                displayName: parsed.displayName,
                role: parsed.role,
                organizationId: parsed.organizationId,
                departmentId: parsed.departmentId || null,
                phone: parsed.phone || null,
                passwordHash,
                isActive: true,
            },
            select: this.userSelect,
        });
        return user;
    }
    async update(payload) {
        const { id, ...updateData } = payload;
        // 1. Verify user exists
        const existing = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.NOT_FOUND,
                message: `User with ID ${id} not found`,
            });
        }
        // 2. Validate input schema
        const parsed = contracts_1.UpdateUserSchema.parse(updateData);
        // 3. Verify department if changing
        if (parsed.departmentId) {
            const department = await this.prisma.department.findUnique({
                where: { id: parsed.departmentId },
            });
            if (!department) {
                throw new microservices_1.RpcException({
                    status: common_1.HttpStatus.BAD_REQUEST,
                    message: 'Department does not exist',
                });
            }
        }
        // 4. DB update
        const updated = await this.prisma.user.update({
            where: { id },
            data: {
                displayName: parsed.displayName !== undefined ? parsed.displayName : undefined,
                phone: parsed.phone !== undefined ? parsed.phone : undefined,
                isActive: parsed.isActive !== undefined ? parsed.isActive : undefined,
                departmentId: parsed.departmentId !== undefined ? parsed.departmentId : undefined,
            },
            select: this.userSelect,
        });
        return updated;
    }
    async delete(payload) {
        // 1. Verify user exists
        const existing = await this.prisma.user.findUnique({
            where: { id: payload.id },
        });
        if (!existing) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.NOT_FOUND,
                message: `User with ID ${payload.id} not found`,
            });
        }
        // 2. DB delete
        await this.prisma.user.delete({
            where: { id: payload.id },
        });
        return { success: true };
    }
    async updateRole(payload) {
        // 1. Verify user exists
        const existing = await this.prisma.user.findUnique({
            where: { id: payload.id },
        });
        if (!existing) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.NOT_FOUND,
                message: `User with ID ${payload.id} not found`,
            });
        }
        // 2. Validate against UserRole enum values
        const roleValues = Object.values(contracts_1.UserRole);
        if (!roleValues.includes(payload.role)) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.BAD_REQUEST,
                message: `Invalid role: ${payload.role}. Must be one of ${roleValues.join(', ')}`,
            });
        }
        // 3. DB update
        const updated = await this.prisma.user.update({
            where: { id: payload.id },
            data: { role: payload.role },
            select: this.userSelect,
        });
        return updated;
    }
    async updateStatus(payload) {
        // 1. Verify user exists
        const existing = await this.prisma.user.findUnique({
            where: { id: payload.id },
        });
        if (!existing) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.NOT_FOUND,
                message: `User with ID ${payload.id} not found`,
            });
        }
        // 2. DB update
        const updated = await this.prisma.user.update({
            where: { id: payload.id },
            data: { isActive: payload.isActive },
            select: this.userSelect,
        });
        return updated;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map