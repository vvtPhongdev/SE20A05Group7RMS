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
const nodemailer = __importStar(require("nodemailer"));
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
    /**
     * Login a user: validates credentials, verifies bcrypt password, issues JWT + refresh tokens.
     */
    async login(dto) {
        // 1. Validate payload
        const parsed = contracts_1.LoginSchema.parse(dto);
        // 2. Find user by email
        const user = await this.prisma.user.findUnique({
            where: { email: parsed.email },
        });
        if (!user || !user.passwordHash) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.UNAUTHORIZED,
                message: 'Invalid email or password',
            });
        }
        // 3. Verify password
        const isPasswordValid = await bcrypt.compare(parsed.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.UNAUTHORIZED,
                message: 'Invalid email or password',
            });
        }
        // 4. Find primary organization membership if any
        const membership = await this.prisma.organizationMember.findFirst({
            where: { userId: user.id },
        });
        const organizationId = membership?.organizationId || null;
        // 5. Generate Access Token (JWT)
        const payload = {
            sub: user.id,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            organizationId,
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
    /**
     * Refresh an existing refresh token and rotate to a new pair.
     */
    async refresh(dto) {
        const validationResult = contracts_1.RefreshTokenSchema.safeParse(dto);
        if (!validationResult.success) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.UNAUTHORIZED,
                message: 'Refresh token is invalid or has expired',
            });
        }
        const parsed = validationResult.data;
        const tokenHash = crypto.createHash('sha256').update(parsed.refreshToken).digest('hex');
        const redisKey = `refresh:${tokenHash}`;
        const userId = await this.redis.get(redisKey);
        if (!userId) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.UNAUTHORIZED,
                message: 'Refresh token is invalid or has expired',
            });
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            await this.redis.del(redisKey);
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.UNAUTHORIZED,
                message: 'Refresh token is invalid or has expired',
            });
        }
        const membership = await this.prisma.organizationMember.findFirst({
            where: { userId: user.id },
        });
        const organizationId = membership?.organizationId || null;
        await this.redis.del(redisKey);
        const accessTokenPayload = {
            sub: user.id,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            organizationId,
        };
        const accessToken = this.jwtService.sign(accessTokenPayload);
        const refreshToken = crypto.randomBytes(64).toString('hex');
        const newTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const newRedisKey = `refresh:${newTokenHash}`;
        await this.redis.set(newRedisKey, user.id, 'EX', 2592000);
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
    /**
     * Generates a 6-digit code for password reset, stores it in Redis (15-min TTL), and sends via SMTP.
     * Rates limits: max 5 requests per 15 min per email.
     * If email does not exist, returns success immediately (prevents email harvesting).
     */
    async forgotPassword(dto) {
        // 1. Validate payload
        const parsed = contracts_1.ForgotPasswordSchema.parse(dto);
        const email = parsed.email.toLowerCase();
        // 2. Rate limiting (max 5 requests per 15 min per email)
        const rateLimitKey = `forgot-limit:${email}`;
        const requests = await this.redis.get(rateLimitKey);
        const requestCount = requests ? parseInt(requests, 10) : 0;
        if (requestCount >= 5) {
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.TOO_MANY_REQUESTS,
                message: 'Too many password reset requests. Please try again later.',
            });
        }
        // Increment request count in Redis
        if (requestCount === 0) {
            await this.redis.set(rateLimitKey, 1, 'EX', 900); // 15 min TTL = 900s
        }
        else {
            await this.redis.incr(rateLimitKey);
        }
        // 3. Verify user exists
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            // Non-existent email returns success (no email leak)
            return { success: true };
        }
        // 4. Generate 6-digit code
        const code = crypto.randomInt(100000, 1000000).toString();
        // 5. Store code in Redis with 15-min TTL
        const redisKey = `reset:${email}`;
        await this.redis.set(redisKey, code, 'EX', 900);
        // 6. Send verification code via SMTP (nodemailer)
        const host = process.env.SMTP_HOST || 'localhost';
        const port = parseInt(process.env.SMTP_PORT || '1025', 10);
        const userAuth = process.env.SMTP_USER || '';
        const passAuth = process.env.SMTP_PASS || '';
        const from = process.env.SMTP_FROM || '"Works Reruiter" <noreply@worksreruiter.com>';
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: userAuth && passAuth ? { user: userAuth, pass: passAuth } : undefined,
        });
        const mailOptions = {
            from,
            to: email,
            subject: 'Works Reruiter — Password Reset Verification Code',
            text: `Your password reset verification code is: ${code}. This code is valid for 15 minutes.`,
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password. Use the following 6-digit verification code to proceed:</p>
          <div style="font-size: 24px; font-weight: bold; background-color: #f3f4f6; padding: 10px 20px; display: inline-block; letter-spacing: 2px; margin: 10px 0;">
            ${code}
          </div>
          <p>This code is valid for <strong>15 minutes</strong>. If you did not request a password reset, please ignore this email.</p>
        </div>
      `,
        };
        try {
            await transporter.sendMail(mailOptions);
        }
        catch (err) {
            console.error(`Failed to send email to ${email}:`, err.message);
            throw new microservices_1.RpcException({
                status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to send verification email. Please try again later.',
            });
        }
        return { success: true };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map