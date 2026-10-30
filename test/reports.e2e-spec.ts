import request from 'supertest';
import { MailJob } from '../src/mail/mail.constants.js';
import { UserRole } from '../src/users/entities/user.entity.js';
import { ReportsService } from '../src/reports/reports.service.js';
import {
  createTestApp,
  mailQueueMock,
  resetState,
  TestApp,
} from './utils/test-app.js';
import { Factory, UserWithToken } from './factories/factory.js';

describe('Daily report - @nestjs/schedule (e2e)', () => {
  let app: TestApp;
  let factory: Factory;
  let admin: UserWithToken;
  let writer: UserWithToken;

  beforeAll(async () => {
    app = await createTestApp();
    factory = new Factory(app);
  });
  // Fake data: 6 articles, article "Post i" has i favorites
  beforeEach(async () => {
    admin = await factory.user({
      email: 'boss@test.com',
      role: UserRole.ADMIN,
    });
    writer = await factory.user({ username: 'writer' });
    const readers = [];
    for (let i = 0; i < 6; i++) readers.push((await factory.user()).user);
    for (let i = 1; i <= 6; i++) {
      const article = await factory.article(writer.user, {
        title: `Post ${i}`,
      });
      for (const reader of readers.slice(0, i)) {
        await factory.favorite(reader, article);
      }
    }
  });
  afterEach(() => resetState(app));
  afterAll(() => app.close());

  it('midnight cron: pushes the top-5 most favorited articles mail for admins', async () => {
    // Call the @Cron-decorated method directly instead of waiting for midnight
    await app.get(ReportsService).sendDailyTopArticlesReport();

    const [jobName, data] = mailQueueMock.add.mock.calls[0];
    expect(jobName).toBe(MailJob.DAILY_REPORT);
    expect(data.to).toEqual(['boss@test.com']);
    expect(data.articles.map((a: { title: string }) => a.title)).toEqual([
      'Post 6',
      'Post 5',
      'Post 4',
      'Post 3',
      'Post 2',
    ]);
  });

  it('admin previews the report through the API', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/reports/top-articles')
      .set('Authorization', admin.auth)
      .expect(200);
    expect(res.body.articles).toHaveLength(5);
    expect(res.body.articles[0]).toMatchObject({
      title: 'Post 6',
      favoritesCount: 6,
    });
  });

  it('regular user calls the admin API => 403', () => {
    return request(app.getHttpServer())
      .get('/api/admin/reports/top-articles')
      .set('Authorization', writer.auth)
      .expect(403);
  });
});
