import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity.js';

export const ROLES_KEY = 'roles';

/** Attach role metadata to a route: @Roles(UserRole.ADMIN) */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
