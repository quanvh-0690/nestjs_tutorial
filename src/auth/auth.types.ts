import type { Request } from 'express';
import type { User } from '../users/entities/user.entity.js';

/** Data signed into the JWT */
export interface JwtPayload {
  sub: number; // user id
  username: string;
  iat: number; // issued at (seconds)
  exp: number; // expiry time (seconds)
}

/** Request after passing JwtAuthGuard */
export interface AuthenticatedRequest extends Request {
  user: User;
}
