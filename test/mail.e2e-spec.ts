import request from 'supertest';
import { MailJob } from '../src/mail/mail.constants.js';
import {
  createTestApp,
  mailQueueMock,
  resetState,
  TestApp,
} from './utils/test-app.js';
import { Factory } from './factories/factory.js';

describe('Mail queue (e2e)', () => {
  let app: TestApp;
  let factory: Factory;

  beforeAll(async () => {
    app = await createTestApp();
    factory = new Factory(app);
  });
  afterEach(() => resetState(app));
  afterAll(() => app.close());

  it('successful register => pushes a "welcome" job', async () => {
    await request(app.getHttpServer())
      .post('/api/users')
      .send({
        user: {
          username: 'newbie',
          email: 'newbie@test.com',
          password: 'password123',
        },
      })
      .expect(201);

    expect(mailQueueMock.add).toHaveBeenCalledWith(
      MailJob.WELCOME,
      { email: 'newbie@test.com', username: 'newbie' },
      expect.objectContaining({ attempts: 3 }),
    );
  });

  it('failed register => no mail', async () => {
    await request(app.getHttpServer())
      .post('/api/users')
      .send({ user: { username: '', email: 'x', password: '1' } })
      .expect(422);
    expect(mailQueueMock.add).not.toHaveBeenCalled();
  });

  it('new follower => mail to the author, following again sends nothing', async () => {
    const writer = await factory.user({
      username: 'writer',
      email: 'writer@test.com',
    });
    const reader = await factory.user({ username: 'reader' });

    for (let i = 0; i < 2; i++) {
      await request(app.getHttpServer())
        .post(`/api/profiles/${writer.user.username}/follow`)
        .set('Authorization', reader.auth)
        .expect(200);
    }

    expect(mailQueueMock.add).toHaveBeenCalledTimes(1);
    expect(mailQueueMock.add).toHaveBeenCalledWith(
      MailJob.NEW_FOLLOWER,
      {
        email: 'writer@test.com',
        username: 'writer',
        followerUsername: 'reader',
      },
      expect.any(Object),
    );
  });
});
