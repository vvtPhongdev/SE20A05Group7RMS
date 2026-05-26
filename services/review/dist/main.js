"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const microservices_1 = require("@nestjs/microservices");
const review_module_1 = require("./review.module");
const PORT = parseInt(process.env.REVIEW_PORT || '3013', 10);
async function bootstrap() {
    const app = await core_1.NestFactory.createMicroservice(review_module_1.ReviewModule, {
        transport: microservices_1.Transport.TCP,
        options: { host: '127.0.0.1', port: PORT },
    });
    await app.listen();
    console.log(`📝 Review service listening on TCP :${PORT}`);
}
bootstrap().catch((err) => {
    console.error('❌ Review service failed to start:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map