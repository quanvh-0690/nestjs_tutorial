import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { LoginRequestDto } from './dto/login.dto.js';
import { RegisterRequestDto } from '../users/dto/create-user.dto.js';

@ApiTags('Auth')
@Controller('users')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Register: POST /api/users */
  @Post()
  @Header('Cache-Control', 'no-store') // response contains a token => must not be cached
  async register(@Body() dto: RegisterRequestDto) {
    const user = await this.authService.register(dto.user);
    return { user: this.authService.buildUserResponse(user) };
  }

  /** Login: POST /api/users/login */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  // Brute-force protection: max 5 attempts per minute per IP, beyond that => 429
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() dto: LoginRequestDto) {
    const user = await this.authService.login(dto.user);
    return { user: this.authService.buildUserResponse(user) };
  }
}
