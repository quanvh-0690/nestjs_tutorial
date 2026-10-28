import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { Article } from '../../articles/entities/article.entity.js';

@Entity('comments')
export class Comment extends BaseEntity {
  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'article_id', type: 'int' })
  articleId: number;

  @Column({ name: 'author_id', type: 'int' })
  authorId: number;

  @ManyToOne(() => Article, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'article_id' })
  article: Relation<Article>;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: Relation<User>;
}
