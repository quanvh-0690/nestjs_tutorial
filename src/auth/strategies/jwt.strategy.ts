import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service.js';
import { User } from '../../users/entities/user.entity.js';
import type { JwtPayload } from '../auth.types.js';

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
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderWithScheme('Token'),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.secret'),
    });
  }

  /**
   * Runs after the token signature and expiry are verified.
   * Returning null => 401. The returned value is assigned to request.user
   */
  validate(payload: JwtPayload): Promise<User | null> {
    return this.usersService.findById(payload.sub);
  }
}
