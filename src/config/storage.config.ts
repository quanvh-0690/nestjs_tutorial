import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  // Directory for private files (not served publicly)
  privatePath: process.env.STORAGE_PRIVATE_PATH ?? 'storage/private',
}));
