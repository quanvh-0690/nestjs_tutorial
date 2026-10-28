import { User } from '../users/entities/user.entity.js';
import { Attachment } from '../attachments/entities/attachment.entity.js';
import { Follow } from '../profiles/entities/follow.entity.js';

/** Entities registered with TypeORM (shared by the app and the migration CLI). */
export const entities = [User, Attachment, Follow];
