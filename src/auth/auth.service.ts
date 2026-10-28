import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import { UserSerializer } from '../users/serializers/user.serializer.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  register(dto: CreateUserDto): Promise<User> {
    return this.usersService.create(dto);
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

  generateToken(user: User): string {
    return this.jwtService.sign({ sub: user.id, username: user.username });
  }

  buildUserResponse(user: User): UserSerializer {
    return new UserSerializer({ ...user, token: this.generateToken(user) });
  }
}
