import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from '../articles/entities/article.entity.js';
import { User } from '../users/entities/user.entity.js';
import { ReportsService } from './reports.service.js';
import { ReportsController } from './reports.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Article, User])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
