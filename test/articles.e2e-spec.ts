/**
 * C2-level (condition coverage) e2e tests for ArticlesController.
 * Every atomic condition in the controller + the services it calls
 * is tested with both TRUE and FALSE values. Condition matrix: test/C2-articles.md
 * Test names carry [Cx-T] / [Cx-F] codes to cross-reference the matrix.
 */
import request from 'supertest';
import { DataSource } from 'typeorm';
import { Article } from '../src/articles/entities/article.entity.js';
import { createTestApp, resetState, TestApp } from './utils/test-app.js';
import { Factory, UserWithToken } from './factories/factory.js';

describe('ArticlesController (e2e, C2)', () => {
  let app: TestApp;
  let factory: Factory;
  let author: UserWithToken;
  let reader: UserWithToken;

  beforeAll(async () => {
    app = await createTestApp();
    factory = new Factory(app);
  });
  // Shared fake data, recreated before EACH test case
  beforeEach(async () => {
    author = await factory.user({ username: 'author' });
    reader = await factory.user({ username: 'reader' });
  });
  afterEach(() => resetState(app));
  afterAll(() => app.close());

  const http = () => request(app.getHttpServer());
  const findArticle = (id: number) =>
    app.get(DataSource).getRepository(Article).findOneByOrFail({ id });

  // ------------------------- POST /api/articles -------------------------
  describe('POST /api/articles (create)', () => {
    it('[C1-T][C2-T][C3-F][C18-T] all fields; duplicate/empty tagList entries are filtered', async () => {
      const res = await http()
        .post('/api/articles')
        .set('Authorization', author.auth)
        .send({
          article: {
            title: 'How to train your dragon',
            description: 'Ever wonder how?',
            body: 'You have to believe',
            tagList: ['dragons', 'dragons', '   ', 'angularjs'],
          },
        })
        .expect(201);

      expect(res.body.article).toEqual({
        slug: expect.stringMatching(/^how-to-train-your-dragon-[0-9a-f]{6}$/),
        title: 'How to train your dragon',
        description: 'Ever wonder how?',
        body: 'You have to believe',
        tagList: ['angularjs', 'dragons'],
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        favorited: false,
        favoritesCount: 0,
        author: {
          username: 'author',
          bio: null,
          image: null,
          following: false,
        },
      });
    });

    it('[C1-F][C2-F][C3-T] no description, tagList => defaults "" and []', async () => {
      const res = await http()
        .post('/api/articles')
        .set('Authorization', author.auth)
        .send({ article: { title: 'Minimal', body: 'Body' } })
        .expect(201);
      expect(res.body.article).toMatchObject({ description: '', tagList: [] });
    });

    it('[C3-T] tagList of blank strings only => []', async () => {
      const res = await http()
        .post('/api/articles')
        .set('Authorization', author.auth)
        .send({ article: { title: 'T', body: 'B', tagList: ['  ', ''] } })
        .expect(201);
      expect(res.body.article.tagList).toEqual([]);
    });

    it('[V-T] missing title, body => 422', async () => {
      const res = await http()
        .post('/api/articles')
        .set('Authorization', author.auth)
        .send({ article: { description: 'x' } })
        .expect(422);
      expect(Object.keys(res.body.errors).sort()).toEqual(['body', 'title']);
    });

    it.each([
      ['title > 255 chars', { title: 'a'.repeat(256), body: 'b' }, 'title'],
      [
        'tagList is not an array',
        { title: 't', body: 'b', tagList: 'x' },
        'tagList',
      ],
      [
        'tagList has a non-string element',
        { title: 't', body: 'b', tagList: [1] },
        'tagList',
      ],
      [
        'description is not a string',
        { title: 't', body: 'b', description: 1 },
        'description',
      ],
    ])('[V-T] %s => 422', async (_name, article, field) => {
      const res = await http()
        .post('/api/articles')
        .set('Authorization', author.auth)
        .send({ article })
        .expect(422);
      expect(res.body.errors[field]).toBeDefined();
    });

    it('[C21-F] no token => 401', () => {
      return http()
        .post('/api/articles')
        .send({ article: { title: 't', body: 'b' } })
        .expect(401);
    });

    it('[C21-F] logged-out token => 401', async () => {
      await http()
        .post('/api/users/logout')
        .set('Authorization', author.auth)
        .expect(204);
      await http()
        .post('/api/articles')
        .set('Authorization', author.auth)
        .send({ article: { title: 't', body: 'b' } })
        .expect(401);
    });
  });

  // ------------------------- GET /api/articles/:slug -------------------------
  describe('GET /api/articles/:slug', () => {
    it('[C9-F][C16-F][C22-F] not logged in => favorited/following = false', async () => {
      const article = await factory.article(author.user, {
        tagList: ['b', 'a'],
      });
      await factory.favorite(reader.user, article);

      const res = await http().get(`/api/articles/${article.slug}`).expect(200);
      expect(res.body.article).toMatchObject({
        slug: article.slug,
        body: article.body,
        tagList: ['a', 'b'],
        favorited: false,
        favoritesCount: 1,
        author: { username: 'author', following: false },
      });
    });

    it('[C16-T][C17-T][C19-T][C20-T][C22-T] viewer has favorited + follows the author', async () => {
      const article = await factory.article(author.user);
      await factory.favorite(reader.user, article);
      await factory.follow(reader.user, author.user);

      const res = await http()
        .get(`/api/articles/${article.slug}`)
        .set('Authorization', reader.auth)
        .expect(200);
      expect(res.body.article).toMatchObject({
        favorited: true,
        author: { following: true },
      });
    });

    it('[C22-F] bad token on an optional-auth route => treated as guest, still 200', async () => {
      const article = await factory.article(author.user);
      await http()
        .get(`/api/articles/${article.slug}`)
        .set('Authorization', 'Token invalid.token.here')
        .expect(200);
    });

    it('[C9-T] unknown slug => 404', () => {
      return http()
        .get('/api/articles/khong-ton-tai')
        .expect(404)
        .expect({ errors: { body: ['Article not found'] } });
    });
  });

  // ------------------------- PUT /api/articles/:slug -------------------------
  describe('PUT /api/articles/:slug (update)', () => {
    let article: Article;
    beforeEach(async () => {
      article = await factory.article(author.user, {
        title: 'Original title',
        tagList: ['old'],
      });
    });

    const update = (body: object, auth = author.auth, slug = article.slug) =>
      http()
        .put(`/api/articles/${slug}`)
        .set('Authorization', auth)
        .send({ article: body });

    it('[C15-F][C10-F][C12-F] change body only => slug, title, tags kept', async () => {
      const res = await update({ body: 'New body' }).expect(200);
      expect(res.body.article).toMatchObject({
        slug: article.slug,
        title: 'Original title',
        body: 'New body',
        tagList: ['old'],
      });
    });

    it('[C10-T][C11-F] same title => slug NOT changed', async () => {
      const res = await update({ title: 'Original title' }).expect(200);
      expect(res.body.article.slug).toBe(article.slug);
    });

    it('[C10-T][C11-T] new title => new slug, old slug 404', async () => {
      const res = await update({ title: 'Brand new title' }).expect(200);
      expect(res.body.article.slug).toMatch(/^brand-new-title-[0-9a-f]{6}$/);
      await http().get(`/api/articles/${article.slug}`).expect(404);
    });

    it('[C12-T][C3-F] send tagList => replaces all tags', async () => {
      const res = await update({ tagList: ['new', 'tags'] }).expect(200);
      expect(res.body.article.tagList).toEqual(['new', 'tags']);
    });

    it('[C12-T][C3-T] empty tagList => removes all tags', async () => {
      const res = await update({ tagList: [] }).expect(200);
      expect(res.body.article.tagList).toEqual([]);
    });

    it('[C15-T] not the author => 403, data unchanged', async () => {
      await update({ body: 'hacked' }, reader.auth)
        .expect(403)
        .expect({
          errors: { body: ['You are not the author of this article'] },
        });
      expect((await findArticle(article.id)).body).toBe(article.body);
    });

    it('[C9-T] unknown slug => 404', () => {
      return update({ body: 'x' }, author.auth, 'khong-ton-tai').expect(404);
    });

    it('[V-T] title too long => 422', () => {
      return update({ title: 'a'.repeat(256) }).expect(422);
    });

    it('[C21-F] no token => 401', () => {
      return http()
        .put(`/api/articles/${article.slug}`)
        .send({ article: { body: 'x' } })
        .expect(401);
    });
  });

  // ------------------------- DELETE /api/articles/:slug -------------------------
  describe('DELETE /api/articles/:slug', () => {
    it('[C15-F] author deletes => 204, then 404', async () => {
      const article = await factory.article(author.user);
      await http()
        .delete(`/api/articles/${article.slug}`)
        .set('Authorization', author.auth)
        .expect(204);
      await http().get(`/api/articles/${article.slug}`).expect(404);
    });

    it('[C15-T] another user deletes => 403', async () => {
      const article = await factory.article(author.user);
      await http()
        .delete(`/api/articles/${article.slug}`)
        .set('Authorization', reader.auth)
        .expect(403);
    });

    it('[C9-T] unknown slug => 404', () => {
      return http()
        .delete('/api/articles/khong-ton-tai')
        .set('Authorization', author.auth)
        .expect(404);
    });

    it('[C21-F] no token => 401', () => {
      return http().delete('/api/articles/any').expect(401);
    });
  });

  // ------------------------- GET /api/articles -------------------------
  describe('GET /api/articles (list, filter, search, pagination)', () => {
    /** 3 articles created in chronological order: oldest -> newest */
    beforeEach(async () => {
      const nestjs = await factory.article(author.user, {
        title: 'Learning NestJS',
        description: 'framework',
        body: 'decorators everywhere',
        tagList: ['nestjs', 'node'],
      });
      await factory.article(reader.user, {
        title: 'Laravel tips',
        description: 'php framework',
        body: 'eloquent',
        tagList: ['php'],
      });
      await factory.article(author.user, {
        title: 'TypeORM',
        description: 'orm',
        body: 'QueryBuilder is powerful',
        tagList: ['node'],
      });
      await factory.favorite(reader.user, nestjs);
    });

    const titles = (body: { articles: { title: string }[] }) =>
      body.articles.map((a) => a.title);

    it('[C4-F][C5-F][C6-F][C7-F][C16-F][C18-F] default: newest first, no body', async () => {
      const res = await http().get('/api/articles').expect(200);
      expect(res.body.articlesCount).toBe(3);
      expect(titles(res.body)).toEqual([
        'TypeORM',
        'Laravel tips',
        'Learning NestJS',
      ]);
      expect(res.body.articles[0].body).toBeUndefined();
    });

    it('[C4-T] filter by tag, still returns the full tagList of the article', async () => {
      const res = await http().get('/api/articles?tag=nestjs').expect(200);
      expect(res.body.articlesCount).toBe(1);
      expect(res.body.articles[0].tagList).toEqual(['nestjs', 'node']);
    });

    it('[C5-T] filter by author', async () => {
      const res = await http().get('/api/articles?author=reader').expect(200);
      expect(titles(res.body)).toEqual(['Laravel tips']);
    });

    it('[C6-T] filter by who favorited', async () => {
      const res = await http()
        .get('/api/articles?favorited=reader')
        .expect(200);
      expect(titles(res.body)).toEqual(['Learning NestJS']);
    });

    it.each([
      ['title', 'typeorm', ['TypeORM']],
      ['description', 'PHP FRAMEWORK', ['Laravel tips']],
      ['body', 'decorators', ['Learning NestJS']],
      ['multiple articles', 'framework', ['Laravel tips', 'Learning NestJS']],
    ])(
      '[C7-T] search by %s (case-insensitive)',
      async (_f, q, expected) => {
        const res = await http()
          .get(`/api/articles?search=${encodeURIComponent(q)}`)
          .expect(200);
        expect(titles(res.body)).toEqual(expected);
      },
    );

    it('[C4-T][C5-T][C6-T][C7-T] all filters combined', async () => {
      const res = await http()
        .get(
          '/api/articles?tag=node&author=author&favorited=reader&search=nest',
        )
        .expect(200);
      expect(titles(res.body)).toEqual(['Learning NestJS']);
    });

    it('[C16-T][C17-T][C19-T/F][C20-T/F] with a viewer: favorited/following per article', async () => {
      await factory.follow(reader.user, author.user);
      const res = await http()
        .get('/api/articles')
        .set('Authorization', reader.auth)
        .expect(200);
      const byTitle = Object.fromEntries(
        res.body.articles.map((a: { title: string }) => [a.title, a]),
      );
      expect(byTitle['Learning NestJS']).toMatchObject({
        favorited: true,
        favoritesCount: 1,
        author: { following: true },
      });
      expect(byTitle['Laravel tips']).toMatchObject({
        favorited: false,
        author: { following: false },
      });
    });

    it('[C16-T][C17-F] with a viewer but no results', async () => {
      const res = await http()
        .get('/api/articles?tag=khong-co')
        .set('Authorization', reader.auth)
        .expect(200);
      expect(res.body).toEqual({ articles: [], articlesCount: 0 });
    });

    it('limit/offset pagination; articlesCount is the total (independent of page)', async () => {
      const res = await http()
        .get('/api/articles?limit=1&offset=1')
        .expect(200);
      expect(res.body.articlesCount).toBe(3);
      expect(titles(res.body)).toEqual(['Laravel tips']);

      const empty = await http().get('/api/articles?offset=10').expect(200);
      expect(empty.body).toEqual({ articles: [], articlesCount: 3 });
    });

    it('default limit 20', async () => {
      for (let i = 0; i < 20; i++) await factory.article(author.user);
      const res = await http().get('/api/articles').expect(200);
      expect(res.body.articlesCount).toBe(23);
      expect(res.body.articles).toHaveLength(20);
    });

    it.each(['limit=1', 'limit=100', 'offset=0'])(
      '[V-F] valid boundary %s => 200',
      (q) => {
        return http().get(`/api/articles?${q}`).expect(200);
      },
    );

    it.each(['limit=0', 'limit=101', 'limit=abc', 'limit=1.5', 'offset=-1'])(
      '[V-T] %s => 422',
      (q) => http().get(`/api/articles?${q}`).expect(422),
    );
  });

  // ------------------------- GET /api/articles/feed -------------------------
  describe('GET /api/articles/feed', () => {
    it('[C8-T] not following anyone => empty', async () => {
      await factory.article(author.user);
      const res = await http()
        .get('/api/articles/feed')
        .set('Authorization', reader.auth)
        .expect(200);
      expect(res.body).toEqual({ articles: [], articlesCount: 0 });
    });

    it('[C8-F] only articles of followed authors, paginated', async () => {
      const stranger = await factory.user();
      await factory.article(author.user, { title: 'A1' });
      await factory.article(stranger.user, { title: 'S1' });
      await factory.article(author.user, { title: 'A2' });
      await factory.follow(reader.user, author.user);

      const res = await http()
        .get('/api/articles/feed?limit=1')
        .set('Authorization', reader.auth)
        .expect(200);
      expect(res.body.articlesCount).toBe(2);
      expect(res.body.articles).toHaveLength(1);
      expect(res.body.articles[0]).toMatchObject({
        title: 'A2',
        author: { username: 'author', following: true },
      });
    });

    it('[C21-F] no token => 401', () => {
      return http().get('/api/articles/feed').expect(401);
    });
  });

  // ------------------------- Favorite / Unfavorite -------------------------
  describe('POST/DELETE /api/articles/:slug/favorite', () => {
    let article: Article;
    beforeEach(async () => {
      article = await factory.article(author.user);
    });

    const favorite = (auth = reader.auth) =>
      http()
        .post(`/api/articles/${article.slug}/favorite`)
        .set('Authorization', auth);
    const unfavorite = (auth = reader.auth) =>
      http()
        .delete(`/api/articles/${article.slug}/favorite`)
        .set('Authorization', auth);

    it('[C13-T] first favorite => favorited, count +1', async () => {
      const res = await favorite().expect(200);
      expect(res.body.article).toMatchObject({
        favorited: true,
        favoritesCount: 1,
      });
    });

    it('[C13-F] already favorited => count unchanged', async () => {
      await factory.favorite(reader.user, article);
      const res = await favorite().expect(200);
      expect(res.body.article.favoritesCount).toBe(1);
      expect((await findArticle(article.id)).favoritesCount).toBe(1);
    });

    it('[C14-T] unfavorite => favorited=false, count -1', async () => {
      await factory.favorite(reader.user, article);
      const res = await unfavorite().expect(200);
      expect(res.body.article).toMatchObject({
        favorited: false,
        favoritesCount: 0,
      });
    });

    it('[C14-F] unfavorite when not favorited => count unchanged', async () => {
      await factory.favorite(author.user, article);
      const res = await unfavorite().expect(200);
      expect(res.body.article.favoritesCount).toBe(1);
    });

    it('[C9-T] unknown slug => 404', () => {
      return http()
        .post('/api/articles/khong-ton-tai/favorite')
        .set('Authorization', reader.auth)
        .expect(404);
    });

    it('[C21-F] no token => 401', () => {
      return http().post(`/api/articles/${article.slug}/favorite`).expect(401);
    });
  });

  // ------------------------- GET /api/tags -------------------------
  describe('GET /api/tags', () => {
    it('no tags yet => []', () => {
      return http().get('/api/tags').expect(200).expect({ tags: [] });
    });

    it('returns tags in alphabetical order', async () => {
      await factory.article(author.user, { tagList: ['zeta', 'alpha'] });
      await http()
        .get('/api/tags')
        .expect(200)
        .expect({ tags: ['alpha', 'zeta'] });
    });
  });
});
