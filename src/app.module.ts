import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import path from 'node:path';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  I18nValidationPipe,
  QueryResolver,
} from 'nestjs-i18n';
import appConfig from './config/app.config.js';
import jwtConfig from './config/jwt.config.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { HelloModule } from './hello/hello.module.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      load: [appConfig, jwtConfig],
    }),
    // i18n: language resolved in order ?lang=vi -> x-lang header -> Accept-Language
    I18nModule.forRoot({
      fallbackLanguage: process.env.FALLBACK_LANGUAGE ?? 'en',
      loaderOptions: {
        path: path.join(import.meta.dirname, 'i18n'),
        watch: process.env.NODE_ENV === 'development',
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        new HeaderResolver(['x-lang']),
        AcceptLanguageResolver,
      ],
    }),
    // Rate limiting (only applied on routes that use ThrottlerGuard)
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    DatabaseModule,
    HelloModule,
    AuthModule,
    UsersModule,
  ],
  providers: [
    // Register globally via DI (instead of app.useGlobalXxx) so e2e tests get them too
    {
      provide: APP_PIPE,
      useValue: new I18nValidationPipe({
        whitelist: true, // strip fields not declared in the DTO
        transform: true, // cast query/params to DTO types (e.g. "10" -> 10)
      }),
    },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    // Serializer: apply class-transformer @Exclude/@Expose to responses
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
  ],
})
export class AppModule {}
