import request from 'supertest';
import { Article } from '../src/articles/entities/article.entity.js';
import { createTestApp, resetState, TestApp } from './utils/test-app.js';
import { Factory, UserWithToken } from './factories/factory.js';

describe('CommentsController (e2e)', () => {
  let app: TestApp;
  let factory: Factory;
  let author: UserWithToken;
  let reader: UserWithToken;
  let article: Article;

  beforeAll(async () => {
    app = await createTestApp();
    factory = new Factory(app);
  });
  beforeEach(async () => {
    author = await factory.user({ username: 'author' });
    reader = await factory.user({ username: 'reader' });
    article = await factory.article(author.user);
  });
  afterEach(() => resetState(app));
  afterAll(() => app.close());

  const url = (slug = article.slug) => `/api/articles/${slug}/comments`;

  describe('POST (add comment)', () => {
    it('create comment => 201', async () => {
      const res = await request(app.getHttpServer())
        .post(url())
        .set('Authorization', reader.auth)
        .send({ comment: { body: 'Thank you so much!' } })
        .expect(201);
      expect(res.body.comment).toEqual({
        id: expect.any(Number),
        body: 'Thank you so much!',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        author: {
          username: 'reader',
          bio: null,
          image: null,
          following: false,
        },
      });
    });

    it('empty body => 422', () => {
      return request(app.getHttpServer())
        .post(url())
        .set('Authorization', reader.auth)
        .send({ comment: { body: '' } })
        .expect(422);
    });

    it('article does not exist => 404', () => {
      return request(app.getHttpServer())
        .post(url('khong-ton-tai'))
        .set('Authorization', reader.auth)
        .send({ comment: { body: 'x' } })
        .expect(404);
    });

    it('not logged in => 401', () => {
      return request(app.getHttpServer())
        .post(url())
        .send({ comment: { body: 'x' } })
        .expect(401);
    });
  });

  describe('GET (list comments)', () => {
    it('newest first; following computed for the viewer', async () => {
      await factory.comment(reader.user, article, 'first');
      await factory.comment(author.user, article, 'second');
      await factory.follow(reader.user, author.user);

      const res = await request(app.getHttpServer())
        .get(url())
        .set('Authorization', reader.auth)
        .expect(200);

      expect(res.body.comments.map((c: { body: string }) => c.body)).toEqual([
        'second',
        'first',
      ]);
      expect(res.body.comments[0].author.following).toBe(true);
    });

    it('viewable without login', async () => {
      await factory.comment(reader.user, article);
      const res = await request(app.getHttpServer()).get(url()).expect(200);
      expect(res.body.comments).toHaveLength(1);
    });
  });

  describe('DELETE (delete comment)', () => {
    it('author deletes => 204', async () => {
      const comment = await factory.comment(reader.user, article);
      await request(app.getHttpServer())
        .delete(`${url()}/${comment.id}`)
        .set('Authorization', reader.auth)
        .expect(204);
      const res = await request(app.getHttpServer()).get(url()).expect(200);
      expect(res.body.comments).toHaveLength(0);
    });

    it('another user deletes => 403', async () => {
      const comment = await factory.comment(reader.user, article);
      await request(app.getHttpServer())
        .delete(`${url()}/${comment.id}`)
        .set('Authorization', author.auth)
        .expect(403);
    });

    it('comment belongs to another article => 404', async () => {
      const otherArticle = await factory.article(author.user);
      const comment = await factory.comment(reader.user, otherArticle);
      await request(app.getHttpServer())
        .delete(`${url()}/${comment.id}`)
        .set('Authorization', reader.auth)
        .expect(404);
    });

    it('id is not a number => 400', () => {
      return request(app.getHttpServer())
        .delete(`${url()}/abc`)
        .set('Authorization', reader.auth)
        .expect(400);
    });
  });
});
