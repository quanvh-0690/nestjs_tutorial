import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './typeorm.config.js';

@Module({
  imports: [
    // forRootAsync: wait for ConfigModule to load .env before reading process.env
    TypeOrmModule.forRootAsync({
      useFactory: () => buildDataSourceOptions(),
    }),
  ],
})
export class DatabaseModule {}
