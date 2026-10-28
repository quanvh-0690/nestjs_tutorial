import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  type Relation,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { Tag } from '../../tags/entities/tag.entity.js';

@Entity('articles')
export class Article extends BaseEntity {
  @Column({ type: 'varchar', length: 300, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 500, default: '' })
  description: string;

  @Column({ type: 'text' })
  body: string;

  // Denormalized favorite count for fast sorting/stats (updated on favorite/unfavorite)
  @Column({ name: 'favorites_count', type: 'int', default: 0 })
  favoritesCount: number;

  @Column({ name: 'author_id', type: 'int' })
  authorId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: Relation<User>;

  // Join table article_tags (many-to-many)
  @ManyToMany(() => Tag, (tag) => tag.articles, { cascade: ['insert'] })
  @JoinTable({
    name: 'article_tags',
    joinColumn: { name: 'article_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Relation<Tag[]>;
}
