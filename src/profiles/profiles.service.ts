import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { Follow } from './entities/follow.entity.js';
import { ProfileSerializer } from './serializers/profile.serializer.js';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Follow)
    private readonly followsRepository: Repository<Follow>,
    private readonly usersService: UsersService,
  ) {}

  async getProfile(
    username: string,
    viewer: User | null,
  ): Promise<ProfileSerializer> {
    const user = await this.findUserOrFail(username);
    const following = viewer
      ? await this.isFollowing(viewer.id, user.id)
      : false;
    return this.buildProfile(user, following);
  }

  async follow(username: string, follower: User): Promise<ProfileSerializer> {
    const user = await this.findUserOrFail(username);
    if (user.id === follower.id) {
      throw new UnprocessableEntityException('profile.CANNOT_FOLLOW_SELF');
    }
    // orIgnore: following twice is not an error (idempotent)
    await this.followsRepository
      .createQueryBuilder()
      .insert()
      .values({ followerId: follower.id, followingId: user.id })
      .orIgnore()
      .execute();
    return this.buildProfile(user, true);
  }

  async unfollow(username: string, follower: User): Promise<ProfileSerializer> {
    const user = await this.findUserOrFail(username);
    await this.followsRepository.delete({
      followerId: follower.id,
      followingId: user.id,
    });
    return this.buildProfile(user, false);
  }

  isFollowing(followerId: number, followingId: number): Promise<boolean> {
    return this.followsRepository.existsBy({ followerId, followingId });
  }

  /** Returns the set of ids (within the given list) that the viewer follows, avoiding N+1 queries */
  async getFollowingIds(
    viewerId: number,
    userIds: number[],
  ): Promise<Set<number>> {
    if (!userIds.length) return new Set();
    const follows = await this.followsRepository.findBy({
      followerId: viewerId,
      followingId: In(userIds),
    });
    return new Set(follows.map((f) => f.followingId));
  }

  /** Ids of the users the viewer follows (used by the feed) */
  async getAllFollowingIds(viewerId: number): Promise<number[]> {
    const follows = await this.followsRepository.findBy({
      followerId: viewerId,
    });
    return follows.map((f) => f.followingId);
  }

  buildProfile(user: User, following: boolean): ProfileSerializer {
    return new ProfileSerializer({ ...user, following });
  }

  private async findUserOrFail(username: string): Promise<User> {
    const user = await this.usersService.findByUsername(username);
    if (!user) throw new NotFoundException('profile.NOT_FOUND');
    return user;
  }
}
