import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service.js';
import { User } from '../../users/entities/user.entity.js';
import { TokenBlacklistService } from '../token-blacklist.service.js';
import type { AuthenticatedRequest, JwtPayload } from '../auth.types.js';

/**
 * Reads the token from the header:
 *   Authorization: Token <jwt>   (RealWorld spec)
 *   Authorization: Bearer <jwt>  (common standard, used by Swagger)
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
    private readonly blacklist: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderWithScheme('Token'),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.secret'),
      passReqToCallback: true,
    });
  }

  /**
   * Runs after the token signature and expiry are verified.
   * Returning null => 401. The returned value is assigned to request.user
   */
  async validate(
    req: AuthenticatedRequest,
    payload: JwtPayload,
  ): Promise<User | null> {
    if (!payload.jti || (await this.blacklist.isRevoked(payload.jti))) {
      return null; // token was revoked by logout
    }
    req.tokenPayload = payload;
    return this.usersService.findById(payload.sub);
  }
}
