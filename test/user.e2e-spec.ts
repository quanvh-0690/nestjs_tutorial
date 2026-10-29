import request from 'supertest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { DataSource } from 'typeorm';
import { Attachment } from '../src/attachments/entities/attachment.entity.js';
import { createTestApp, resetState, TestApp } from './utils/test-app.js';
import {
  DEFAULT_PASSWORD,
  Factory,
  UserWithToken,
} from './factories/factory.js';

const FIXTURES = path.join(import.meta.dirname, 'fixtures');
const AVATAR = readFileSync(path.join(FIXTURES, 'avatar.png'));
const STORAGE = path.resolve('storage/test');

describe('UserController (e2e): get / update current user', () => {
  let app: TestApp;
  let factory: Factory;
  let me: UserWithToken;

  beforeAll(async () => {
    app = await createTestApp();
    factory = new Factory(app);
  });
  // Fake data before each test case
  beforeEach(async () => {
    me = await factory.user({
      username: 'me',
      email: 'me@test.com',
      bio: 'old bio',
    });
  });
  afterEach(() => resetState(app));
  afterAll(() => app.close());

  const attachments = () => app.get(DataSource).getRepository(Attachment);

  describe('GET /api/user', () => {
    it('with token => 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/user')
        .set('Authorization', me.auth)
        .expect(200);
      expect(res.body.user).toMatchObject({
        username: 'me',
        email: 'me@test.com',
      });
    });

    it('no token => 401', () => {
      return request(app.getHttpServer()).get('/api/user').expect(401);
    });

    it('token with bad signature => 401', () => {
      return request(app.getHttpServer())
        .get('/api/user')
        .set('Authorization', `Token ${me.token}x`)
        .expect(401);
    });
  });

  describe('PUT /api/user (JSON)', () => {
    it('updates only the fields sent, keeps the others', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/user')
        .set('Authorization', me.auth)
        .send({ user: { bio: 'new bio' } })
        .expect(200);
      expect(res.body.user).toMatchObject({
        username: 'me',
        email: 'me@test.com',
        bio: 'new bio',
      });
    });

    it('change password => can log in with the new password', async () => {
      await request(app.getHttpServer())
        .put('/api/user')
        .set('Authorization', me.auth)
        .send({ user: { password: 'new-password' } })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/users/login')
        .send({ user: { email: 'me@test.com', password: 'new-password' } })
        .expect(200);
      await request(app.getHttpServer())
        .post('/api/users/login')
        .send({ user: { email: 'me@test.com', password: DEFAULT_PASSWORD } })
        .expect(401);
    });

    it('username taken by someone else => 422; same as own => 200', async () => {
      await factory.user({ username: 'taken' });
      await request(app.getHttpServer())
        .put('/api/user')
        .set('Authorization', me.auth)
        .send({ user: { username: 'taken' } })
        .expect(422)
        .expect({ errors: { username: ['has already been taken'] } });

      await request(app.getHttpServer())
        .put('/api/user')
        .set('Authorization', me.auth)
        .send({ user: { username: 'me' } })
        .expect(200);
    });

    it('malformed email => 422', () => {
      return request(app.getHttpServer())
        .put('/api/user')
        .set('Authorization', me.auth)
        .send({ user: { email: 'not-an-email' } })
        .expect(422);
    });
  });

  describe('PUT /api/user (multipart + avatar)', () => {
    it('upload avatar => private file stored + polymorphic attachment created', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/user')
        .set('Authorization', me.auth)
        .field('user[bio]', 'from multipart')
        .attach('image', AVATAR, 'my-avatar.png')
        .expect(200);

      expect(res.body.user.bio).toBe('from multipart');
      const image: string = res.body.user.image;
      expect(image).toMatch(
        /\/api\/attachments\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );

      const attachment = await attachments().findOneByOrFail({
        id: image.split('/').pop(),
      });
      expect(attachment).toMatchObject({
        attachableType: 'User',
        attachableId: String(me.user.id),
        collection: 'avatar',
        fileName: 'my-avatar.png',
        fileType: 'image/png',
        fileSize: AVATAR.length,
        url: image,
        uploadedBy: me.user.id,
      });
      expect(existsSync(path.join(STORAGE, attachment.path))).toBe(true);
    });

    it('upload a new avatar => old avatar removed (record and file)', async () => {
      const upload = () =>
        request(app.getHttpServer())
          .put('/api/user')
          .set('Authorization', me.auth)
          .attach('image', AVATAR, 'a.png')
          .expect(200);

      await upload();
      const [first] = await attachments().find();
      await upload();

      const all = await attachments().find();
      expect(all).toHaveLength(1);
      expect(all[0].id).not.toBe(first.id);
      expect(existsSync(path.join(STORAGE, first.path))).toBe(false);
    });

    it('non-image file => 422, no attachment created', async () => {
      await request(app.getHttpServer())
        .put('/api/user')
        .set('Authorization', me.auth)
        .attach('image', path.join(FIXTURES, 'not-image.txt'))
        .expect(422)
        .expect((res) => expect(res.body.errors.image).toHaveLength(1));
      expect(await attachments().count()).toBe(0);
    });

    it('file larger than 2MB => 413', async () => {
      const big = Buffer.concat([AVATAR, Buffer.alloc(2 * 1024 * 1024)]);
      await request(app.getHttpServer())
        .put('/api/user')
        .set('Authorization', me.auth)
        .attach('image', big, 'big.png')
        .expect(413);
    });
  });
});
