import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AuthService } from '../auth/auth.service.js';
import { User } from './entities/user.entity.js';

/** Current user: /api/user */
@ApiTags('User')
@ApiBearerAuth()
@Controller('user')
@UseGuards(JwtAuthGuard) // every route in this controller requires login
export class UserController {
  constructor(private readonly authService: AuthService) {}

  /** Get Current User */
  @Get()
  getCurrentUser(@CurrentUser() user: User) {
    return { user: this.authService.buildUserResponse(user) };
  }
}
