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
import { ListArticlesQueryDto } from './dto/list-articles-query.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

export interface ArticlesPage {
  articles: Article[];
  articlesCount: number;
}

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

  /** List with filters + search + pagination (QueryBuilder) */
  async findAll(query: ListArticlesQueryDto): Promise<ArticlesPage> {
    const qb = this.baseListQuery();

    if (query.tag) {
      // Filter with EXISTS, NOT with a where on the joined tags table (that would drop the other tags)
      qb.andWhere(
        `EXISTS (SELECT 1 FROM article_tags at INNER JOIN tags t ON t.id = at.tag_id
                 WHERE at.article_id = article.id AND t.name = :tag)`,
        { tag: query.tag },
      );
    }
    if (query.author) {
      qb.andWhere('author.username = :author', { author: query.author });
    }
    if (query.favorited) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM favorites f INNER JOIN users u ON u.id = f.user_id
                 WHERE f.article_id = article.id AND u.username = :favorited)`,
        { favorited: query.favorited },
      );
    }
    if (query.search) {
      qb.andWhere(
        '(article.title ILIKE :q OR article.description ILIKE :q OR article.body ILIKE :q)',
        { q: `%${query.search}%` },
      );
    }

    return this.paginate(qb, query);
  }

  /** Articles by the authors the user follows */
  async feed(user: User, query: PaginationQueryDto): Promise<ArticlesPage> {
    const authorIds = await this.profilesService.getAllFollowingIds(user.id);
    if (!authorIds.length) return { articles: [], articlesCount: 0 };
    const qb = this.baseListQuery().where(
      'article.authorId IN (:...authorIds)',
      {
        authorIds,
      },
    );
    return this.paginate(qb, query);
  }

  private baseListQuery() {
    return this.articlesRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('article.tags', 'tags')
      .orderBy('article.createdAt', 'DESC');
  }

  private async paginate(
    qb: ReturnType<ArticlesService['baseListQuery']>,
    { limit, offset }: PaginationQueryDto,
  ): Promise<ArticlesPage> {
    // skip/take (unlike offset/limit) paginates by article even when the JOIN yields many tag rows
    const [articles, articlesCount] = await qb
      .skip(offset)
      .take(limit)
      .getManyAndCount();
    return { articles, articlesCount };
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
