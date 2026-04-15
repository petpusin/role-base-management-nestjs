import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Express } from 'express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppModule } from './app.module';

// ── Shared app configuration ──────────────────────────────────────────────────
//
// Single source of truth for pipes, Swagger, and any future global middleware.
// Called by both the local dev server and the Vercel serverless handler.

async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Role-Based Access Control API')
    .setDescription(
      'NestJS RBAC system with Users, Roles, and Permissions management',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('roles', 'Role management')
    .addTag('permissions', 'Permission management')
    .build();

  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
    { swaggerOptions: { persistAuthorization: true } },
  );

  return app;
}

// ── Vercel Serverless Handler ─────────────────────────────────────────────────
//
// Vercel's @vercel/node runtime calls the default export once per request.
// The Express instance is cached at module scope so that warm Lambda invocations
// skip the NestJS bootstrap entirely — only cold starts pay the initialisation cost.

let cachedExpressInstance: Express | undefined;

async function getOrCreateExpressInstance(): Promise<Express> {
  if (cachedExpressInstance) return cachedExpressInstance;
  const app = await createApp();
  await app.init(); // init() wires DI without starting an HTTP server
  cachedExpressInstance = app.getHttpAdapter().getInstance();
  return cachedExpressInstance;
}

/**
 * Default export consumed by Vercel's Node.js serverless runtime.
 * Each request is routed here by vercel.json → dist/main.js.
 *
 * Uses `app.init()` (not `app.listen()`) — Vercel owns the transport layer.
 */
export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const instance = await getOrCreateExpressInstance();
  instance(req, res);
}

// ── Local Development ─────────────────────────────────────────────────────────
//
// Vercel automatically sets VERCEL=1 in its runtime environment.
// Outside that environment, start a standard HTTP server for local dev.

async function bootstrap(): Promise<void> {
  const app = await createApp();
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on port ${String(port)}`);
}
bootstrap().catch((err: unknown) => {
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
