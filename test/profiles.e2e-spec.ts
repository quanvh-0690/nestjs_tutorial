import request from 'supertest';
import { DataSource } from 'typeorm';
import { Follow } from '../src/profiles/entities/follow.entity.js';
import { createTestApp, resetState, TestApp } from './utils/test-app.js';
import { Factory, UserWithToken } from './factories/factory.js';

describe('ProfilesController (e2e): profile, follow, unfollow', () => {
  let app: TestApp;
  let factory: Factory;
  let alice: UserWithToken;
  let bob: UserWithToken;

  beforeAll(async () => {
    app = await createTestApp();
    factory = new Factory(app);
  });
  beforeEach(async () => {
    alice = await factory.user({ username: 'alice' });
    bob = await factory.user({ username: 'bob', bio: 'Bob bio' });
  });
  afterEach(() => resetState(app));
  afterAll(() => app.close());

  const followCount = () => app.get(DataSource).getRepository(Follow).count();

  describe('GET /api/profiles/:username', () => {
    it('not logged in => following=false', () => {
      return request(app.getHttpServer())
        .get('/api/profiles/bob')
        .expect(200)
        .expect({
          profile: {
            username: 'bob',
            bio: 'Bob bio',
            image: null,
            following: false,
          },
        });
    });

    it('logged in and following => following=true', async () => {
      await factory.follow(alice.user, bob.user);
      const res = await request(app.getHttpServer())
        .get('/api/profiles/bob')
        .set('Authorization', alice.auth)
        .expect(200);
      expect(res.body.profile.following).toBe(true);
    });

    it('unknown username => 404', () => {
      return request(app.getHttpServer())
        .get('/api/profiles/nobody')
        .expect(404)
        .expect({ errors: { body: ['Profile not found'] } });
    });
  });

  describe('POST /api/profiles/:username/follow', () => {
    it('follow => 200, following=true, saved in DB', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/profiles/bob/follow')
        .set('Authorization', alice.auth)
        .expect(200);
      expect(res.body.profile).toMatchObject({
        username: 'bob',
        following: true,
      });
      expect(await followCount()).toBe(1);
    });

    it('following twice is not an error, only 1 row', async () => {
      await factory.follow(alice.user, bob.user);
      await request(app.getHttpServer())
        .post('/api/profiles/bob/follow')
        .set('Authorization', alice.auth)
        .expect(200);
      expect(await followCount()).toBe(1);
    });

    it('following yourself => 422', () => {
      return request(app.getHttpServer())
        .post('/api/profiles/alice/follow')
        .set('Authorization', alice.auth)
        .expect(422);
    });

    it('not logged in => 401', () => {
      return request(app.getHttpServer())
        .post('/api/profiles/bob/follow')
        .expect(401);
    });

    it('unknown user => 404', () => {
      return request(app.getHttpServer())
        .post('/api/profiles/nobody/follow')
        .set('Authorization', alice.auth)
        .expect(404);
    });
  });

  describe('DELETE /api/profiles/:username/follow', () => {
    it('unfollow => following=false, row deleted', async () => {
      await factory.follow(alice.user, bob.user);
      const res = await request(app.getHttpServer())
        .delete('/api/profiles/bob/follow')
        .set('Authorization', alice.auth)
        .expect(200);
      expect(res.body.profile.following).toBe(false);
      expect(await followCount()).toBe(0);
    });

    it('unfollow when not following => still 200', () => {
      return request(app.getHttpServer())
        .delete('/api/profiles/bob/follow')
        .set('Authorization', alice.auth)
        .expect(200);
    });
  });
});
