/**
 * Seeds sample data: npm run seed
 *  - admin@medium.local / password123 (admin role, receives the daily report)
 */
import bcrypt from 'bcryptjs';
import dataSource from '../data-source.js';
import { User, UserRole } from '../../users/entities/user.entity.js';

async function seed() {
  await dataSource.initialize();
  const users = dataSource.getRepository(User);

  const email = process.env.ADMIN_EMAIL ?? 'admin@medium.local';
  if (!(await users.existsBy({ email }))) {
    await users.save(
      users.create({
        email,
        username: 'admin',
        password: await bcrypt.hash('password123', 10),
        role: UserRole.ADMIN,
      }),
    );
    console.log(
      'Created admin account (email = ADMIN_EMAIL, password = password123)',
    );
  } else {
    console.log('Admin account already exists');
  }

  await dataSource.destroy();
}

await seed();
