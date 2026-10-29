import { Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/entities/user.entity.js';
import { ReportsService } from './reports.service.js';

/** Admin API: view / send the report right away (handy for testing instead of waiting for midnight) */
@ApiTags('Admin reports')
@ApiBearerAuth()
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('top-articles')
  async topArticles() {
    return { articles: await this.reportsService.getTopFavoritedArticles(5) };
  }

  @Post('top-articles/send')
  @HttpCode(202)
  async sendNow() {
    await this.reportsService.sendDailyTopArticlesReport();
    return { queued: true };
  }
}
