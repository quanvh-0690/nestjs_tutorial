import { Exclude, Expose } from 'class-transformer';

/**
 * Serializer for the "user" response (the authenticated user).
 * @Exclude() on the class => everything hidden by default, only @Expose() fields are returned
 * (safer: a new entity column is never exposed by accident).
 * The global ClassSerializerInterceptor applies these decorators.
 */
@Exclude()
export class UserSerializer {
  @Expose() email: string;
  @Expose() token: string;
  @Expose() username: string;
  @Expose() bio: string | null;
  @Expose() image: string | null;

  constructor(partial: Partial<UserSerializer>) {
    Object.assign(this, partial);
  }
}
