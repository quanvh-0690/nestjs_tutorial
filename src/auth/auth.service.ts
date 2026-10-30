import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import { UserSerializer } from '../users/serializers/user.serializer.js';
import { LoginDto } from './dto/login.dto.js';
import { TokenBlacklistService } from './token-blacklist.service.js';
import { MailService } from '../mail/mail.service.js';
import type { JwtPayload } from './auth.types.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly blacklist: TokenBlacklistService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: CreateUserDto): Promise<User> {
    const user = await this.usersService.create(dto);
    // Push the welcome-mail job onto the queue; the API returns immediately without waiting for delivery
    await this.mailService.sendWelcome({
      email: user.email,
      username: user.username,
    });
    return user;
  }

  async login(dto: LoginDto): Promise<User> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    const valid =
      user &&
      (await this.usersService.comparePassword(dto.password, user.password));
    if (!user || !valid) {
      throw new UnauthorizedException({
        errors: { 'email or password': ['auth.INVALID_CREDENTIALS'] },
      });
    }
    return user;
  }

  async logout(payload: JwtPayload): Promise<void> {
    await this.blacklist.revoke(payload.jti, payload.exp);
  }

  generateToken(user: User): string {
    // jwtid => "jti" claim: each token gets its own id so it can be revoked (logout)
    return this.jwtService.sign(
      { sub: user.id, username: user.username },
      { jwtid: randomUUID() },
    );
  }

  buildUserResponse(user: User): UserSerializer {
    return new UserSerializer({ ...user, token: this.generateToken(user) });
  }
}
