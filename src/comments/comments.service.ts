import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { ArticlesService } from '../articles/articles.service.js';
import { ProfilesService } from '../profiles/profiles.service.js';
import { Comment } from './entities/comment.entity.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { CommentSerializer } from './serializers/comment.serializer.js';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    private readonly articlesService: ArticlesService,
    private readonly profilesService: ProfilesService,
  ) {}

  async create(
    slug: string,
    author: User,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    const article = await this.articlesService.findBySlugOrFail(slug);
    const comment = await this.commentsRepository.save(
      this.commentsRepository.create({
        body: dto.body,
        articleId: article.id,
        authorId: author.id,
      }),
    );
    comment.author = author;
    return comment;
  }

  async findByArticle(slug: string): Promise<Comment[]> {
    const article = await this.articlesService.findBySlugOrFail(slug);
    return this.commentsRepository.find({
      where: { articleId: article.id },
      relations: { author: true },
      order: { createdAt: 'DESC' },
    });
  }

  async remove(slug: string, id: number, user: User): Promise<void> {
    const article = await this.articlesService.findBySlugOrFail(slug);
    const comment = await this.commentsRepository.findOneBy({
      id,
      articleId: article.id,
    });
    if (!comment) throw new NotFoundException('comment.NOT_FOUND');
    if (comment.authorId !== user.id) {
      throw new ForbiddenException('comment.FORBIDDEN');
    }
    await this.commentsRepository.remove(comment);
  }

  async serialize(
    comments: Comment[],
    viewer: User | null,
  ): Promise<CommentSerializer[]> {
    const followingIds = viewer
      ? await this.profilesService.getFollowingIds(
          viewer.id,
          comments.map((c) => c.authorId),
        )
      : new Set<number>();
    return comments.map(
      (comment) =>
        new CommentSerializer({
          id: comment.id,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          body: comment.body,
          author: this.profilesService.buildProfile(
            comment.author,
            followingIds.has(comment.authorId),
          ),
        }),
    );
  }
}
