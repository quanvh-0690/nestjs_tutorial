import { Exclude, Expose, Type } from 'class-transformer';
import { ProfileSerializer } from '../../profiles/serializers/profile.serializer.js';

@Exclude()
export class CommentSerializer {
  @Expose() id: number;
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
  @Expose() body: string;

  @Expose()
  @Type(() => ProfileSerializer)
  author: ProfileSerializer;

  constructor(partial: Partial<CommentSerializer>) {
    Object.assign(this, partial);
  }
}
