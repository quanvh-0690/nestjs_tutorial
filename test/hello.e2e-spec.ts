import request from 'supertest';
import { createTestApp, resetState, TestApp } from './utils/test-app.js';

describe('HelloController (e2e)', () => {
  let app: TestApp;

  beforeAll(async () => {
    app = await createTestApp();
  });
  afterEach(() => resetState(app));
  afterAll(() => app.close());

  it('GET /api/hello: defaults to English', () => {
    return request(app.getHttpServer())
      .get('/api/hello')
      .expect(200)
      .expect({ message: 'Hello World! Welcome to Medium API' });
  });

  it('GET /api/hello?name=Quan&lang=vi: i18n by query', () => {
    return request(app.getHttpServer())
      .get('/api/hello?name=Quan&lang=vi')
      .expect(200)
      .expect({ message: 'Xin chào Quan! Chào mừng đến với Medium API' });
  });

  it('Accept-Language: vi + name over 50 chars => 422 in Vietnamese', () => {
    return request(app.getHttpServer())
      .get(`/api/hello?name=${'a'.repeat(51)}`)
      .set('Accept-Language', 'vi')
      .expect(422)
      .expect({ errors: { name: ['name quá dài (tối đa 50 ký tự)'] } });
  });
});
