import { slugify } from './slugify.js';

describe('slugify', () => {
  it('strips diacritics and special characters', () => {
    expect(slugify('Học NestJS cơ bản: Đường đến Backend!', false)).toBe(
      'hoc-nestjs-co-ban-duong-den-backend',
    );
  });

  it('appends a random 6-char suffix', () => {
    expect(slugify('Hello World')).toMatch(/^hello-world-[0-9a-f]{6}$/);
  });
});
