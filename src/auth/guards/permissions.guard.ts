import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionAction } from '../../permissions/permission.entity';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import type { RequestUser } from '../interfaces/request-user.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Explicit undefined annotation: NestJS types getAllAndOverride as `T` but
    // returns undefined at runtime when no decorator is applied.
    const requiredSlugs: string[] | undefined =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    if (!requiredSlugs?.length) return true;

    const { user } = context.switchToHttp().getRequest<{ user: RequestUser }>();

    const grantedSlugs = new Set<string>(
      user.roles.flatMap((role) => role.permissions.map((p) => p.slug)),
    );

    const missing = requiredSlugs.filter(
      (required) => !this.isSatisfied(required, grantedSlugs),
    );

    if (missing.length > 0) {
      throw new ForbiddenException(
        `Access denied. Missing permissions: [${missing.join(', ')}]`,
      );
    }

    return true;
  }

  /**
   * Direct match OR resource-level `manage` wildcard.
   * e.g. "users:delete" is satisfied by "users:manage"
   */
  private isSatisfied(required: string, granted: Set<string>): boolean {
    if (granted.has(required)) return true;
    const colonIdx = required.indexOf(':');
    // Malformed slug (no colon) — deny rather than produce a wrong wildcard check.
    // indexOf returns -1 when not found; slice(0, -1) would silently trim the last char.
    if (colonIdx === -1) return false;
    const resource = required.slice(0, colonIdx);
    return granted.has(`${resource}:${PermissionAction.MANAGE}`);
  }
}
