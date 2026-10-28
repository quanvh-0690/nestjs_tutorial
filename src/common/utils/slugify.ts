import { randomBytes } from 'node:crypto';

/**
 * "Học NestJS cơ bản!" => "hoc-nestjs-co-ban-a1b2c3"
 * (random suffix appended so slugs never collide)
 */
export function slugify(text: string, withSuffix = true): string {
  const base = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritical marks
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const suffix = randomBytes(3).toString('hex');
  return withSuffix ? `${base || 'article'}-${suffix}` : base;
}
