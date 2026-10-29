import { faker } from '@faker-js/faker';
import { DataSource, Repository } from 'typeorm';
import { User, UserRole } from '../../src/users/entities/user.entity.js';
import { Article } from '../../src/articles/entities/article.entity.js';
import { Favorite } from '../../src/articles/entities/favorite.entity.js';
import { Tag } from '../../src/tags/entities/tag.entity.js';
import { Comment } from '../../src/comments/entities/comment.entity.js';
import { Follow } from '../../src/profiles/entities/follow.entity.js';
import { AuthService } from '../../src/auth/auth.service.js';
import { UsersService } from '../../src/users/users.service.js';
import type { TestApp } from '../utils/test-app.js';

export const DEFAULT_PASSWORD = 'password123';

export interface UserWithToken {
  user: User;
  token: string;
  /** Ready-made Authorization header for .set('Authorization', auth) */
  auth: string;
}

/**
 * Factory that writes fake data straight into the test database.
 * Each test case creates the data it needs in its "Arrange" step.
 */
export class Factory {
  private readonly users: Repository<User>;
  private readonly articles: Repository<Article>;
  private readonly tags: Repository<Tag>;
  private readonly favorites: Repository<Favorite>;
  private readonly comments: Repository<Comment>;
  private readonly follows: Repository<Follow>;
  private readonly authService: AuthService;
  private readonly usersService: UsersService;
  private passwordHash?: string;

  constructor(app: TestApp) {
    const ds = app.get(DataSource);
    this.users = ds.getRepository(User);
    this.articles = ds.getRepository(Article);
    this.tags = ds.getRepository(Tag);
    this.favorites = ds.getRepository(Favorite);
    this.comments = ds.getRepository(Comment);
    this.follows = ds.getRepository(Follow);
    this.authService = app.get(AuthService);
    this.usersService = app.get(UsersService);
  }

  async user(overrides: Partial<User> = {}): Promise<UserWithToken> {
    // Hash once and reuse for speed (bcrypt is slow by design)
    this.passwordHash ??=
      await this.usersService.hashPassword(DEFAULT_PASSWORD);
    const user = await this.users.save(
      this.users.create({
        email: faker.internet.email().toLowerCase(),
        username:
          faker.internet.username().replace(/\W/g, '_').slice(0, 40) +
          faker.string.alphanumeric(4),
        password: this.passwordHash,
        bio: null,
        image: null,
        role: UserRole.USER,
        ...overrides,
      }),
    );
    const token = this.authService.generateToken(user);
    return { user, token, auth: `Token ${token}` };
  }

  async article(
    author: User,
    overrides: Partial<Omit<Article, 'tags'>> & { tagList?: string[] } = {},
  ): Promise<Article> {
    const { tagList = [], ...fields } = overrides;
    const title = fields.title ?? faker.lorem.sentence({ min: 3, max: 6 });
    return this.articles.save(
      this.articles.create({
        title,
        slug: `${faker.helpers.slugify(title).toLowerCase()}-${faker.string.alphanumeric(6).toLowerCase()}`,
        description: faker.lorem.sentence(),
        body: faker.lorem.paragraphs(2),
        authorId: author.id,
        tags: await this.tagsByName(tagList),
        ...fields,
      }),
    );
  }

  /** user favorites an article (also updates favorites_count like the real code) */
  async favorite(user: User, article: Article): Promise<void> {
    await this.favorites.save({ userId: user.id, articleId: article.id });
    await this.articles.increment({ id: article.id }, 'favoritesCount', 1);
  }

  async follow(follower: User, following: User): Promise<void> {
    await this.follows.save({
      followerId: follower.id,
      followingId: following.id,
    });
  }

  async comment(
    author: User,
    article: Article,
    body = faker.lorem.sentence(),
  ): Promise<Comment> {
    return this.comments.save({
      body,
      authorId: author.id,
      articleId: article.id,
    });
  }

  private async tagsByName(names: string[]): Promise<Tag[]> {
    const tags: Tag[] = [];
    for (const name of names) {
      tags.push(
        (await this.tags.findOneBy({ name })) ??
          (await this.tags.save({ name })),
      );
    }
    return tags;
  }
}
