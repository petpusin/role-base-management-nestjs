import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { RequestUser } from '../interfaces/request-user.interface';
import { getMetadata } from './guard-meta.utils';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = getMetadata(this.reflector, ROLES_KEY, context) as
      | string[]
      | undefined;

    // No @Roles() decorator or empty list → allow through (no role restriction).
    if (!requiredRoles?.length) return true;

    const { user } = context.switchToHttp().getRequest<{ user: RequestUser }>();
    const userRoleNames = user.roles.map((r) => r.name);
    const hasRole = requiredRoles.some((role) => userRoleNames.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
