import request from 'supertest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { AttachmentsService } from '../src/attachments/attachments.service.js';
import {
  AttachableType,
  AttachmentCollection,
} from '../src/attachments/attachable-type.js';
import { UserRole } from '../src/users/entities/user.entity.js';
import { createTestApp, resetState, TestApp } from './utils/test-app.js';
import { Factory, UserWithToken } from './factories/factory.js';

const AVATAR = readFileSync(
  path.join(import.meta.dirname, 'fixtures', 'avatar.png'),
);

function fakeUpload(): Express.Multer.File {
  return {
    buffer: AVATAR,
    originalname: 'doc.png',
    mimetype: 'image/png',
    size: AVATAR.length,
  } as Express.Multer.File;
}

describe('AttachmentsController (e2e): GET /api/attachments/:id (private file)', () => {
  let app: TestApp;
  let factory: Factory;
  let owner: UserWithToken;
  let other: UserWithToken;

  beforeAll(async () => {
    app = await createTestApp();
    factory = new Factory(app);
  });
  beforeEach(async () => {
    owner = await factory.user();
    other = await factory.user();
  });
  afterEach(() => resetState(app));
  afterAll(() => app.close());

  /** Create an attachment through the real service (writes file + record) */
  const attach = (collection: string) =>
    app.get(AttachmentsService).create({
      attachableType: AttachableType.USER,
      attachableId: owner.user.id,
      collection: collection as AttachmentCollection,
      file: fakeUpload(),
      uploadedBy: owner.user.id,
    });

  it('avatar: another logged-in user can view it, correct content + content-type', async () => {
    const avatar = await attach(AttachmentCollection.AVATAR);

    const res = await request(app.getHttpServer())
      .get(`/api/attachments/${avatar.id}`)
      .set('Authorization', other.auth)
      .expect(200);

    expect(res.headers['content-type']).toBe('image/png');
    expect(res.headers['content-disposition']).toBe(
      'inline; filename="doc.png"',
    );
    expect(Buffer.compare(res.body as Buffer, AVATAR)).toBe(0);
  });

  it('not logged in => 401', async () => {
    const avatar = await attach(AttachmentCollection.AVATAR);
    await request(app.getHttpServer())
      .get(`/api/attachments/${avatar.id}`)
      .expect(401);
  });

  it('id is not a UUID => 400 (prevents sequential id scanning)', () => {
    return request(app.getHttpServer())
      .get('/api/attachments/1')
      .set('Authorization', other.auth)
      .expect(400);
  });

  it('unknown UUID => 404', () => {
    return request(app.getHttpServer())
      .get(`/api/attachments/${randomUUID()}`)
      .set('Authorization', other.auth)
      .expect(404)
      .expect({ errors: { body: ['File not found'] } });
  });

  describe('private file (not an avatar)', () => {
    it('another user => 403', async () => {
      const doc = await attach('private-document');
      await request(app.getHttpServer())
        .get(`/api/attachments/${doc.id}`)
        .set('Authorization', other.auth)
        .expect(403);
    });

    it('owner => 200', async () => {
      const doc = await attach('private-document');
      await request(app.getHttpServer())
        .get(`/api/attachments/${doc.id}`)
        .set('Authorization', owner.auth)
        .expect(200);
    });

    it('admin => 200', async () => {
      const doc = await attach('private-document');
      const admin = await factory.user({ role: UserRole.ADMIN });
      await request(app.getHttpServer())
        .get(`/api/attachments/${doc.id}`)
        .set('Authorization', admin.auth)
        .expect(200);
    });
  });
});
