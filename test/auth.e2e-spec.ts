import request from 'supertest';
import { createTestApp, resetState, TestApp } from './utils/test-app.js';
import {
  DEFAULT_PASSWORD,
  Factory,
  UserWithToken,
} from './factories/factory.js';

describe('AuthController (e2e): register, login, logout', () => {
  let app: TestApp;
  let factory: Factory;

  beforeAll(async () => {
    app = await createTestApp();
    factory = new Factory(app);
  });
  afterEach(() => resetState(app));
  afterAll(() => app.close());

  describe('POST /api/users (register)', () => {
    const payload = {
      user: { username: 'jake', email: 'jake@jake.jake', password: 'jakejake' },
    };

    it('registers successfully, no password/id in response, has token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/users')
        .send(payload)
        .expect(201);

      expect(res.headers['cache-control']).toBe('no-store');
      expect(res.body.user).toEqual({
        email: 'jake@jake.jake',
        username: 'jake',
        bio: null,
        image: null,
        token: expect.any(String),
      });
    });

    it('email and username already taken => 422', async () => {
      await factory.user({ email: 'jake@jake.jake', username: 'jake' });

      const res = await request(app.getHttpServer())
        .post('/api/users')
        .send(payload)
        .expect(422);

      expect(res.body.errors).toEqual({
        email: ['has already been taken'],
        username: ['has already been taken'],
      });
    });

    it('invalid data => 422, Vietnamese messages', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/users?lang=vi')
        .send({ user: { username: '', email: 'abc', password: '123' } })
        .expect(422);

      expect(res.body.errors).toEqual({
        username: ['username không được để trống'],
        email: ['email không hợp lệ'],
        password: ['password quá ngắn (tối thiểu 8 ký tự)'],
      });
    });

    it('missing "user" object => 422', () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .send({})
        .expect(422)
        .expect({ errors: { user: ["user can't be empty"] } });
    });
  });

  describe('POST /api/users/login', () => {
    let existing: UserWithToken;

    beforeEach(async () => {
      existing = await factory.user({ email: 'login@test.com' });
    });

    const login = (email: string, password: string) =>
      request(app.getHttpServer())
        .post('/api/users/login')
        .send({ user: { email, password } });

    it('correct email + password => 200 + usable token', async () => {
      const res = await login('login@test.com', DEFAULT_PASSWORD).expect(200);
      expect(res.body.user.username).toBe(existing.user.username);

      await request(app.getHttpServer())
        .get('/api/user')
        .set('Authorization', `Token ${res.body.user.token}`)
        .expect(200);
    });

    it('wrong password => 401', () => {
      return login('login@test.com', 'wrong-password')
        .expect(401)
        .expect({ errors: { 'email or password': ['is invalid'] } });
    });

    it('unknown email => 401', () => {
      return login('nobody@test.com', DEFAULT_PASSWORD).expect(401);
    });

    it('brute-force protection: 6th attempt within 1 minute => 429', async () => {
      for (let i = 0; i < 5; i++) {
        await login('login@test.com', 'wrong-password').expect(401);
      }
      await login('login@test.com', 'wrong-password')
        .expect(429)
        .expect({
          errors: { body: ['Too many requests, please try again later'] },
        });
    });
  });

  describe('POST /api/users/logout', () => {
    it('logout => token is blacklisted, calling the API again => 401', async () => {
      const { auth } = await factory.user();
      const server = app.getHttpServer();

      await request(server)
        .get('/api/user')
        .set('Authorization', auth)
        .expect(200);
      await request(server)
        .post('/api/users/logout')
        .set('Authorization', auth)
        .expect(204);
      await request(server)
        .get('/api/user')
        .set('Authorization', auth)
        .expect(401);
    });

    it('logging out one token does not affect other tokens of the same user', async () => {
      const { user, auth } = await factory.user();
      const res = await request(app.getHttpServer())
        .post('/api/users/login')
        .send({ user: { email: user.email, password: DEFAULT_PASSWORD } })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/users/logout')
        .set('Authorization', auth)
        .expect(204);
      await request(app.getHttpServer())
        .get('/api/user')
        .set('Authorization', `Token ${res.body.user.token}`)
        .expect(200);
    });

    it('not logged in => 401', () => {
      return request(app.getHttpServer()).post('/api/users/logout').expect(401);
    });
  });
});
