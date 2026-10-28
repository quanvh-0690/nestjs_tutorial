import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ProfileSerializer {
  @Expose() username: string;
  @Expose() bio: string | null;
  @Expose() image: string | null;
  @Expose() following: boolean;

  constructor(partial: Partial<ProfileSerializer>) {
    Object.assign(this, partial);
  }
}
