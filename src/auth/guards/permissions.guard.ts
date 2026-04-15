import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionAction } from '../../permissions/permission.entity';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import type { RequestUser } from '../interfaces/request-user.interface';
import { getMetadata } from './guard-meta.utils';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredSlugs = getMetadata(
      this.reflector,
      PERMISSIONS_KEY,
      context,
    ) as string[] | undefined;

    // No @Permissions() decorator or empty list → allow through.
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
   *
   * Malformed slugs (no colon) are rejected immediately — returning false
   * rather than producing a wrong wildcard match via slice(0, -1).
   */
  private isSatisfied(required: string, granted: Set<string>): boolean {
    if (granted.has(required)) return true;
    const colonIdx = required.indexOf(':');
    if (colonIdx === -1) return false;
    const resource = required.slice(0, colonIdx);
    return granted.has(`${resource}:${PermissionAction.MANAGE}`);
  }
}
