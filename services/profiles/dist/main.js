"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const microservices_1 = require("@nestjs/microservices");
const profiles_module_1 = require("./profiles.module");
const PORT = parseInt(process.env.PROFILES_PORT || '3012', 10);
async function bootstrap() {
    const app = await core_1.NestFactory.createMicroservice(profiles_module_1.ProfilesModule, {
        transport: microservices_1.Transport.TCP,
        options: { host: '127.0.0.1', port: PORT },
    });
    await app.listen();
    console.log(`👤 Profiles service listening on TCP :${PORT}`);
}
bootstrap().catch((err) => {
    console.error('❌ Profiles service failed to start:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map