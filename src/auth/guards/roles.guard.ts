import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { CanActivate } from '@nestjs/common';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { RequestUser } from '../interfaces/request-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Explicit undefined annotation: NestJS types getAllAndOverride as `T` but
    // returns undefined at runtime when no decorator is applied.
    const requiredRoles: string[] | undefined = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

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
