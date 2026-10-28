/**
 * DataSource for the TypeORM CLI (migration commands).
 * The CLI runs against the build output: dist/database/data-source.js
 */
import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './typeorm.config.js';

dotenv.config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
  quiet: true,
});

export default new DataSource({
  ...buildDataSourceOptions(),
  migrations: ['dist/database/migrations/*.js'],
  migrationsTableName: 'migrations',
});
