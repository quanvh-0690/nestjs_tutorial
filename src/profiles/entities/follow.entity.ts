import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  Column,
  type Relation,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

/** follower (the one who follows) -> following (the one being followed) */
@Entity('follows')
@Unique(['followerId', 'followingId'])
export class Follow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'follower_id', type: 'int' })
  followerId: number;

  @Column({ name: 'following_id', type: 'int' })
  followingId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_id' })
  follower: Relation<User>;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'following_id' })
  following: Relation<User>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
