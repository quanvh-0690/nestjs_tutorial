import type { Request } from 'express';
import type { User } from '../users/entities/user.entity.js';

/** Data signed into the JWT */
export interface JwtPayload {
  sub: number; // user id
  username: string;
  jti: string; // unique token id (used by the logout blacklist)
  iat: number; // issued at (seconds)
  exp: number; // expiry time (seconds)
}

/** Request after passing JwtAuthGuard */
export interface AuthenticatedRequest extends Request {
  user: User;
  tokenPayload: JwtPayload;
}
