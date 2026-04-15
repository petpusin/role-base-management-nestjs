import type { CustomDecorator } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Restrict a route to users whose roles grant all of the listed permission slugs.
 * Supports the 'manage' wildcard: a role with `resource:manage` satisfies any
 * action check on that resource (e.g. `users:manage` covers `users:delete`).
 *
 * Requires JwtAuthGuard + PermissionsGuard to be active.
 *
 * @example
 * @Permissions('users:create', 'users:read')
 * @Post('users')
 * createUser(@Body() dto: CreateUserDto) { ... }
 */
export const Permissions = (...slugs: string[]): CustomDecorator =>
  SetMetadata(PERMISSIONS_KEY, slugs);
