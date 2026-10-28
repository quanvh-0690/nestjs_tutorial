import type { DataSourceOptions } from 'typeorm';
import { entities } from './entities.js';

/**
 * Shared connection options for:
 *  - the NestJS app (TypeOrmModule.forRootAsync)
 *  - the TypeORM CLI (data-source.ts) for running migrations
 */
export function buildDataSourceOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_DATABASE ?? 'medium',
    entities,
    // NEVER use synchronize: true. Every schema change goes through a migration (like Laravel).
    synchronize: false,
    logging: process.env.DB_LOGGING === 'true',
  };
}
