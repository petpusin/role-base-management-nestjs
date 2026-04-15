import type { CustomDecorator } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route to users that hold at least one of the given roles.
 * Requires JwtAuthGuard + RolesGuard to be active.
 *
 * @example
 * @Roles('admin', 'editor')
 * @Get('dashboard')
 * getDashboard() { ... }
 */
export const Roles = (...roles: string[]): CustomDecorator =>
  SetMetadata(ROLES_KEY, roles);
