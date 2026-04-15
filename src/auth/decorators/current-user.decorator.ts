import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import type { RequestUser } from '../interfaces/request-user.interface';

interface RequestWithUser {
  user: RequestUser;
}

/**
 * Injects the authenticated user from `request.user` into a route param.
 * Optionally accepts a key to pluck a single property.
 *
 * @example
 * // Full user object
 * getProfile(@CurrentUser() user: RequestUser) { ... }
 *
 * // Single field
 * getProfile(@CurrentUser('email') email: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (
    key: keyof RequestUser | undefined,
    ctx: ExecutionContext,
  ): RequestUser | RequestUser[keyof RequestUser] => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    return key !== undefined ? user[key] : user;
  },
);
