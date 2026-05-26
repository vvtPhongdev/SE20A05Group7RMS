"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const microservices_1 = require("@nestjs/microservices");
const identity_module_1 = require("./identity.module");
const PORT = parseInt(process.env.IDENTITY_PORT || '3010', 10);
async function bootstrap() {
    const app = await core_1.NestFactory.createMicroservice(identity_module_1.IdentityModule, {
        transport: microservices_1.Transport.TCP,
        options: { host: '127.0.0.1', port: PORT },
    });
    await app.listen();
    console.log(`🔐 Identity service listening on TCP :${PORT}`);
}
bootstrap().catch((err) => {
    console.error('❌ Identity service failed to start:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map