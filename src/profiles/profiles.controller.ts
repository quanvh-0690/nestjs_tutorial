import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { User } from '../users/entities/user.entity.js';
import { ProfilesService } from './profiles.service.js';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get(':username')
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  async getProfile(
    @Param('username') username: string,
    @CurrentUser() viewer: User | null,
  ) {
    return { profile: await this.profilesService.getProfile(username, viewer) };
  }

  @Post(':username/follow')
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async follow(@Param('username') username: string, @CurrentUser() user: User) {
    return { profile: await this.profilesService.follow(username, user) };
  }

  @Delete(':username/follow')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async unfollow(
    @Param('username') username: string,
    @CurrentUser() user: User,
  ) {
    return { profile: await this.profilesService.unfollow(username, user) };
  }
}
