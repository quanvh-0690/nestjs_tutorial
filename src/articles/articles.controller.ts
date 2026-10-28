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
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { User } from '../users/entities/user.entity.js';
import { ArticlesService } from './articles.service.js';
import { CreateArticleRequestDto } from './dto/create-article.dto.js';
import { UpdateArticleRequestDto } from './dto/update-article.dto.js';
import { ListArticlesQueryDto } from './dto/list-articles-query.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

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

  @Get()
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(
    @Query() query: ListArticlesQueryDto,
    @CurrentUser() viewer: User | null,
  ) {
    const { articles, articlesCount } =
      await this.articlesService.findAll(query);
    return {
      articles: await this.articlesService.serialize(articles, viewer, {
        withBody: false,
      }),
      articlesCount,
    };
  }

  // Must be declared BEFORE ':slug', otherwise "feed" would be treated as a slug
  @Get('feed')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async feed(@Query() query: PaginationQueryDto, @CurrentUser() user: User) {
    const { articles, articlesCount } = await this.articlesService.feed(
      user,
      query,
    );
    return {
      articles: await this.articlesService.serialize(articles, user, {
        withBody: false,
      }),
      articlesCount,
    };
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

  @Post(':slug/favorite')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async favorite(@Param('slug') slug: string, @CurrentUser() user: User) {
    const article = await this.articlesService.favorite(slug, user);
    return { article: await this.articlesService.serializeOne(article, user) };
  }

  @Delete(':slug/favorite')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async unfavorite(@Param('slug') slug: string, @CurrentUser() user: User) {
    const article = await this.articlesService.unfavorite(slug, user);
    return { article: await this.articlesService.serializeOne(article, user) };
  }
}
