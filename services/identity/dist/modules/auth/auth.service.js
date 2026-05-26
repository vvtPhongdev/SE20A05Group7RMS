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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../common/database/prisma.service");
const contracts_1 = require("@wr/contracts");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const ioredis_1 = __importDefault(require("ioredis"));
let AuthService = class AuthService {
    prisma;
    jwtService;
    redis;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.redis = new ioredis_1.default({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            maxRetriesPerRequest: null,
        });
    }
    async onModuleDestroy() {
        await this.redis.quit();
    }
    /**
     * Register a new user, hashes password, generates access token and refresh token.
     * Refresh token is stored in Redis under its SHA-256 hash.
     */
    async register(dto) {
        // 1. Validate payload
        const parsed = contracts_1.RegisterUserSchema.parse(dto);
        // 2. Check duplicate email
        const existing = await this.prisma.user.findUnique({
            where: { email: parsed.email },
        });
        if (existing) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.CONFLICT,
                message: 'Email already exists',
            });
        }
        // 3. Hash password
        const passwordHash = await bcrypt.hash(parsed.password, 12);
        // 4. Create user in database
        const user = await this.prisma.user.create({
            data: {
                email: parsed.email,
                displayName: parsed.displayName,
                role: parsed.role,
                passwordHash,
            },
        });
        // 5. Generate Access Token (JWT)
        const payload = {
            sub: user.id,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            organizationId: null, // Initial registration doesn't assign an org
        };
        const accessToken = this.jwtService.sign(payload);
        // 6. Generate Refresh Token (64-byte random hex)
        const refreshToken = crypto.randomBytes(64).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        // 7. Store Refresh Token in Redis (30 days TTL = 2592000s)
        await this.redis.set(`refresh:${tokenHash}`, user.id, 'EX', 2592000);
        return {
            accessToken,
            refreshToken,
            expiresIn: 3600,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map