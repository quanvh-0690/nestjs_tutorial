import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { User, UserRole } from '../../users/entities/user.entity.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

/** Role check. Must run AFTER JwtAuthGuard. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!roles?.length) return true;
    const user = context.switchToHttp().getRequest<Request>().user as User;
    if (!roles.includes(user.role)) {
      throw new ForbiddenException('common.FORBIDDEN');
    }
    return true;
  }
}
