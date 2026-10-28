import { Inject, Injectable } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants.js';

const KEY_PREFIX = 'auth:blacklist:';

/**
 * JWTs are stateless => the server cannot "delete" an issued token.
 * Logout = put the jti (unique token id) on a Redis blacklist
 * with TTL = remaining token lifetime. Redis drops the key once it expires.
 */
@Injectable()
export class TokenBlacklistService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async revoke(jti: string, expiresAt: number): Promise<void> {
    const ttlSeconds = expiresAt - Math.floor(Date.now() / 1000);
    if (ttlSeconds > 0) {
      await this.redis.set(`${KEY_PREFIX}${jti}`, '1', 'EX', ttlSeconds);
    }
  }

  async isRevoked(jti: string): Promise<boolean> {
    return (await this.redis.exists(`${KEY_PREFIX}${jti}`)) === 1;
  }
}
