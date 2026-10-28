/**
 * Kinds of objects that can "own" a file (polymorphic association).
 * Add a new kind (e.g. ARTICLE = 'Article') without changing the attachments table structure.
 */
export enum AttachableType {
  USER = 'User',
}

/** File group of an object (a user may have an avatar, a cover...) */
export enum AttachmentCollection {
  AVATAR = 'avatar',
}
