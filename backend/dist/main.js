"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT', 3000);
    const apiPrefix = configService.get('API_PREFIX', 'api');
    const frontendUrl = configService.get('FRONTEND_URL', 'http://localhost:3001');
    app.setGlobalPrefix(apiPrefix);
    app.use((req, res, next) => {
        res.setHeader('X-Disclaimer', 'Les données sont fournies à titre informatif uniquement. Pas un conseil en investissement. Source : brvm.org');
        next();
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableCors({
        origin: [frontendUrl, 'http://localhost:3001'],
        credentials: true,
    });
    await app.listen(port);
    console.log(`🚀 BRVM-OS API running on http://localhost:${port}/${apiPrefix}`);
}
bootstrap();
//# sourceMappingURL=main.js.map