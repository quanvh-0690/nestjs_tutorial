import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { User } from '../users/entities/user.entity.js';
import { ArticlesService } from './articles.service.js';
import { CreateArticleRequestDto } from './dto/create-article.dto.js';
import { UpdateArticleRequestDto } from './dto/update-article.dto.js';

@ApiTags('Articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateArticleRequestDto,
  ) {
    const article = await this.articlesService.create(user, dto.article);
    return { article: await this.articlesService.serializeOne(article, user) };
  }

  @Get(':slug')
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(
    @Param('slug') slug: string,
    @CurrentUser() viewer: User | null,
  ) {
    const article = await this.articlesService.findBySlugOrFail(slug);
    return {
      article: await this.articlesService.serializeOne(article, viewer),
    };
  }

  @Put(':slug')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('slug') slug: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateArticleRequestDto,
  ) {
    const article = await this.articlesService.update(slug, user, dto.article);
    return { article: await this.articlesService.serializeOne(article, user) };
  }

  @Delete(':slug')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('slug') slug: string, @CurrentUser() user: User) {
    await this.articlesService.remove(slug, user);
  }
}
