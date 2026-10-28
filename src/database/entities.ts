import { User } from '../users/entities/user.entity.js';
import { Attachment } from '../attachments/entities/attachment.entity.js';
import { Follow } from '../profiles/entities/follow.entity.js';
import { Article } from '../articles/entities/article.entity.js';
import { Favorite } from '../articles/entities/favorite.entity.js';
import { Tag } from '../tags/entities/tag.entity.js';
import { Comment } from '../comments/entities/comment.entity.js';

/** Entities registered with TypeORM (shared by the app and the migration CLI). */
export const entities = [
  User,
  Attachment,
  Follow,
  Article,
  Favorite,
  Tag,
  Comment,
];
