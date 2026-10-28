import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module.js';
import { Follow } from './entities/follow.entity.js';
import { ProfilesService } from './profiles.service.js';
import { ProfilesController } from './profiles.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Follow]), UsersModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
