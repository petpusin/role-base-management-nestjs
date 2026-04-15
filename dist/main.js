"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function createApp() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('Role-Based Access Control API')
        .setDescription('NestJS RBAC system with Users, Roles, and Permissions management')
        .setVersion('1.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
        .addTag('auth', 'Authentication endpoints')
        .addTag('users', 'User management')
        .addTag('roles', 'Role management')
        .addTag('permissions', 'Permission management')
        .build();
    swagger_1.SwaggerModule.setup('api/docs', app, swagger_1.SwaggerModule.createDocument(app, swaggerConfig), { swaggerOptions: { persistAuthorization: true } });
    return app;
}
let cachedExpressInstance;
async function getOrCreateExpressInstance() {
    if (cachedExpressInstance)
        return cachedExpressInstance;
    const app = await createApp();
    await app.init();
    cachedExpressInstance = app.getHttpAdapter().getInstance();
    return cachedExpressInstance;
}
async function handler(req, res) {
    const instance = await getOrCreateExpressInstance();
    instance(req, res);
}
async function bootstrap() {
    const app = await createApp();
    await app.listen(process.env.PORT ?? 3000);
}
if (!process.env.VERCEL) {
    void bootstrap();
}
//# sourceMappingURL=main.js.map