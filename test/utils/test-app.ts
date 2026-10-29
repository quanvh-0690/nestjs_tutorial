import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { getStorageToken, ThrottlerStorageService } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import type { Redis } from 'ioredis';
import { DataSource } from 'typeorm';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module.js';
import { setupApp } from '../../src/setup-app.js';
import { REDIS_CLIENT } from '../../src/redis/redis.constants.js';

export type TestApp = INestApplication<App>;

/** Boot the app exactly as in production (same AppModule + setupApp) */
export async function createTestApp(): Promise<TestApp> {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('E2E tests must run with NODE_ENV=test (npm run test:e2e)');
  }
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = setupApp(
    moduleRef.createNestApplication<NestExpressApplication>(),
  ) as unknown as TestApp;
  await app.init();
  return app;
}

/**
 * Reset state AFTER EACH test case:
 *  - TRUNCATE every table + reset auto-increment ids
 *  - Flush the test Redis db (token blacklist)
 *  - Delete uploaded files in the test storage directory
 *  - Clear the rate-limit counters
 * => every test case is independent of execution order.
 */
export async function resetState(app: TestApp): Promise<void> {
  const dataSource = app.get(DataSource);
  const tables = dataSource.entityMetadatas
    .map((m) => `"${m.tableName}"`)
    .join(', ');
  await dataSource.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);

  await app.get<Redis>(REDIS_CLIENT).flushdb();

  const storagePath = app
    .get(ConfigService)
    .getOrThrow<string>('storage.privatePath');
  await rm(path.resolve(storagePath), { recursive: true, force: true });

  // The in-memory rate-limit store consists of 2 internal Maps
  const throttler = app.get<ThrottlerStorageService>(getStorageToken());
  throttler.storage.clear();
  (
    throttler as unknown as { hitExpirations: Map<string, unknown> }
  ).hitExpirations.clear();
}
