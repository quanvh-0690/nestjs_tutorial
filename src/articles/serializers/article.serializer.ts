import { Exclude, Expose, Type } from 'class-transformer';
import { ProfileSerializer } from '../../profiles/serializers/profile.serializer.js';

@Exclude()
export class ArticleSerializer {
  @Expose() slug: string;
  @Expose() title: string;
  @Expose() description: string;
  @Expose() body?: string; // article lists do not return the body (per the updated spec)
  @Expose() tagList: string[];
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
  @Expose() favorited: boolean;
  @Expose() favoritesCount: number;

  @Expose()
  @Type(() => ProfileSerializer)
  author: ProfileSerializer;

  constructor(partial: Partial<ArticleSerializer>) {
    Object.assign(this, partial);
  }
}
