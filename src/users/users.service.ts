import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { User } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    // Repository: data access for the users table
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  /** Includes the password column (select: false) to verify it on login */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async create(dto: CreateUserDto): Promise<User> {
    await this.ensureUnique(dto.email, dto.username);
    const user = this.usersRepository.create({
      ...dto,
      password: await this.hashPassword(dto.password),
    });
    return this.usersRepository.save(user);
  }

  hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }

  comparePassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }

  /** Rejects a duplicate email/username with 422 */
  async ensureUnique(
    email?: string,
    username?: string,
    exceptId?: number,
  ): Promise<void> {
    const errors: Record<string, string[]> = {};
    const idFilter = exceptId ? { id: Not(exceptId) } : {};
    if (
      email &&
      (await this.usersRepository.existsBy({ email, ...idFilter }))
    ) {
      errors.email = ['user.EMAIL_TAKEN'];
    }
    if (
      username &&
      (await this.usersRepository.existsBy({ username, ...idFilter }))
    ) {
      errors.username = ['user.USERNAME_TAKEN'];
    }
    if (Object.keys(errors).length) {
      throw new UnprocessableEntityException({ errors });
    }
  }
}
