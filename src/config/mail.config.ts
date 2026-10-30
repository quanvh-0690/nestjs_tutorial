import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  host: process.env.MAIL_HOST ?? 'localhost',
  port: parseInt(process.env.MAIL_PORT ?? '1025', 10),
  user: process.env.MAIL_USER ?? '',
  password: process.env.MAIL_PASSWORD ?? '',
  from: process.env.MAIL_FROM ?? 'Medium Clone <no-reply@medium.local>',
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@medium.local',
}));
