import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfilesModule } from '../profiles/profiles.module.js';
import { TagsModule } from '../tags/tags.module.js';
import { Article } from './entities/article.entity.js';
import { Favorite } from './entities/favorite.entity.js';
import { ArticlesService } from './articles.service.js';
import { ArticlesController } from './articles.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, Favorite]),
    ProfilesModule,
    TagsModule,
  ],
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
