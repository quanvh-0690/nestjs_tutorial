import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { slugify } from '../common/utils/slugify.js';
import { omitUndefined } from '../common/utils/omit-undefined.js';
import { User } from '../users/entities/user.entity.js';
import { ProfilesService } from '../profiles/profiles.service.js';
import { TagsService } from '../tags/tags.service.js';
import { Article } from './entities/article.entity.js';
import { Favorite } from './entities/favorite.entity.js';
import { CreateArticleDto } from './dto/create-article.dto.js';
import { UpdateArticleDto } from './dto/update-article.dto.js';
import { ArticleSerializer } from './serializers/article.serializer.js';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articlesRepository: Repository<Article>,
    @InjectRepository(Favorite)
    private readonly favoritesRepository: Repository<Favorite>,
    private readonly tagsService: TagsService,
    private readonly profilesService: ProfilesService,
  ) {}

  async create(author: User, dto: CreateArticleDto): Promise<Article> {
    const article = this.articlesRepository.create({
      title: dto.title,
      description: dto.description ?? '',
      body: dto.body,
      slug: slugify(dto.title),
      authorId: author.id,
      tags: await this.tagsService.findOrCreate(dto.tagList ?? []),
    });
    const saved = await this.articlesRepository.save(article);
    return this.findBySlugOrFail(saved.slug);
  }

  async findBySlugOrFail(slug: string): Promise<Article> {
    const article = await this.articlesRepository.findOne({
      where: { slug },
      relations: { author: true, tags: true },
    });
    if (!article) throw new NotFoundException('article.NOT_FOUND');
    return article;
  }

  async update(
    slug: string,
    user: User,
    dto: UpdateArticleDto,
  ): Promise<Article> {
    const article = await this.findBySlugOrFail(slug);
    this.ensureOwner(article, user);

    const { tagList, ...fields } = dto;
    if (fields.title && fields.title !== article.title) {
      article.slug = slugify(fields.title);
    }
    Object.assign(article, omitUndefined(fields));
    if (tagList) {
      article.tags = await this.tagsService.findOrCreate(tagList);
    }
    await this.articlesRepository.save(article);
    return this.findBySlugOrFail(article.slug);
  }

  async remove(slug: string, user: User): Promise<void> {
    const article = await this.findBySlugOrFail(slug);
    this.ensureOwner(article, user);
    await this.articlesRepository.remove(article);
  }

  /** Only the author can update/delete */
  private ensureOwner(article: Article, user: User): void {
    if (article.authorId !== user.id) {
      throw new ForbiddenException('article.FORBIDDEN');
    }
  }

  /**
   * Map entities -> responses. Computes "favorited" and "author.following"
   * for the whole list with just 2 queries (avoids N+1).
   */
  async serialize(
    articles: Article[],
    viewer: User | null,
    options: { withBody?: boolean } = {},
  ): Promise<ArticleSerializer[]> {
    const { withBody = true } = options;
    let favoritedIds = new Set<number>();
    let followingIds = new Set<number>();

    if (viewer && articles.length) {
      const favorites = await this.favoritesRepository.findBy({
        userId: viewer.id,
        articleId: In(articles.map((a) => a.id)),
      });
      favoritedIds = new Set(favorites.map((f) => f.articleId));
      followingIds = await this.profilesService.getFollowingIds(
        viewer.id,
        articles.map((a) => a.authorId),
      );
    }

    return articles.map(
      (article) =>
        new ArticleSerializer({
          slug: article.slug,
          title: article.title,
          description: article.description,
          body: withBody ? article.body : undefined,
          tagList: (article.tags ?? []).map((tag) => tag.name).sort(),
          createdAt: article.createdAt,
          updatedAt: article.updatedAt,
          favorited: favoritedIds.has(article.id),
          favoritesCount: article.favoritesCount,
          author: this.profilesService.buildProfile(
            article.author,
            followingIds.has(article.authorId),
          ),
        }),
    );
  }

  async serializeOne(
    article: Article,
    viewer: User | null,
  ): Promise<ArticleSerializer> {
    const [result] = await this.serialize([article], viewer);
    return result;
  }
}
