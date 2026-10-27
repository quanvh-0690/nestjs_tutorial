import type { NestExpressApplication } from '@nestjs/platform-express';

/**
 * Shared app configuration for main.ts and e2e tests,
 * so the test environment matches the real one.
 */
export function setupApp(app: NestExpressApplication): NestExpressApplication {
  app.setGlobalPrefix('api');
  app.enableCors();
  app.enableShutdownHooks(); // call onModuleDestroy (close DB, Redis) on shutdown
  return app;
}
