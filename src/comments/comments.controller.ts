import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { User } from '../users/entities/user.entity.js';
import { CommentsService } from './comments.service.js';
import { CreateCommentRequestDto } from './dto/create-comment.dto.js';

/** Nested resource: /api/articles/:slug/comments */
@ApiTags('Comments')
@Controller('articles/:slug/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('slug') slug: string,
    @CurrentUser() user: User,
    @Body() dto: CreateCommentRequestDto,
  ) {
    const comment = await this.commentsService.create(slug, user, dto.comment);
    const [result] = await this.commentsService.serialize([comment], user);
    return { comment: result };
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(
    @Param('slug') slug: string,
    @CurrentUser() viewer: User | null,
  ) {
    const comments = await this.commentsService.findByArticle(slug);
    return { comments: await this.commentsService.serialize(comments, viewer) };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('slug') slug: string,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    await this.commentsService.remove(slug, id, user);
  }
}
