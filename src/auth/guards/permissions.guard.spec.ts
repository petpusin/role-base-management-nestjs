import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionAction } from '../../permissions/permission.entity';
import type { Permission } from '../../permissions/permission.entity';
import type { Role } from '../../roles/role.entity';
import type { RequestUser } from '../interfaces/request-user.interface';
import { UserStatus } from '../../users/user.entity';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_DATE = new Date('2024-01-01T00:00:00.000Z');

/**
 * Creates a Permission stub from a slug like "users:read".
 * The guard only inspects `.slug`, so other fields are minimal.
 */
const makePermission = (slug: string): Permission => {
  const colonIdx = slug.indexOf(':');
  const resource = colonIdx !== -1 ? slug.slice(0, colonIdx) : slug;
  const actionStr = colonIdx !== -1 ? slug.slice(colonIdx + 1) : 'read';
  return {
    id: `perm-${slug}`,
    resource,
    action: actionStr as PermissionAction,
    slug,
    description: null,
    roles: [],
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
    deletedAt: null,
    syncSlug: jest.fn<void, []>(),
  } as unknown as Permission;
};

/** Creates a Role stub holding the given permissions. */
const makeRole = (permissions: Permission[]): Role =>
  ({
    id: 'role-1',
    name: 'test-role',
    description: null,
    isActive: true,
    permissions,
    users: [],
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
    deletedAt: null,
  }) as Role;

/** Creates a RequestUser whose single role holds the given permissions. */
const makeUser = (permissions: Permission[]): RequestUser => ({
  id: 'user-uuid',
  name: 'Test User',
  email: 'test@example.com',
  status: UserStatus.ACTIVE,
  roles: [makeRole(permissions)],
});

const createMockContext = (user?: RequestUser): ExecutionContext => {
  const handler = jest.fn();
  const cls = jest.fn();
  return {
    getHandler: jest.fn().mockReturnValue(handler),
    getClass: jest.fn().mockReturnValue(cls),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ user }),
    }),
  } as unknown as ExecutionContext;
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as jest.Mocked<
      Pick<Reflector, 'getAllAndOverride'>
    >;
    guard = new PermissionsGuard(reflector as Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── Reflector contract ───────────────────────────────────────────────────────

  describe('reflector integration', () => {
    it('queries metadata with PERMISSIONS_KEY and both handler + class targets', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined as unknown as string[]);
      const ctx = createMockContext();

      guard.canActivate(ctx);

      expect(reflector.getAllAndOverride).toHaveBeenCalledTimes(1);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(PERMISSIONS_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]);
    });
  });

  // ── No permissions required ──────────────────────────────────────────────────

  describe('when no permissions are required', () => {
    it('returns true when the reflector finds no @Permissions decorator (undefined)', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined as unknown as string[]);

      expect(guard.canActivate(createMockContext(undefined))).toBe(true);
    });

    it('returns true when @Permissions() is applied with an empty list', () => {
      reflector.getAllAndOverride.mockReturnValue([]);

      expect(guard.canActivate(createMockContext(undefined))).toBe(true);
    });

    it('does not access request.user when no permissions are required', () => {
      reflector.getAllAndOverride.mockReturnValue([]);
      const ctx = createMockContext(undefined);

      expect(() => guard.canActivate(ctx)).not.toThrow();
    });
  });

  // ── Authorized users — exact slug match ──────────────────────────────────────

  describe('authorized users — exact slug match', () => {
    it('returns true when the user holds the single required permission', () => {
      reflector.getAllAndOverride.mockReturnValue(['users:read']);
      const ctx = createMockContext(makeUser([makePermission('users:read')]));

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true when the user holds all required permissions', () => {
      reflector.getAllAndOverride.mockReturnValue(['users:read', 'users:create']);
      const ctx = createMockContext(
        makeUser([makePermission('users:read'), makePermission('users:create')]),
      );

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true when the user holds more permissions than required', () => {
      reflector.getAllAndOverride.mockReturnValue(['users:read']);
      const ctx = createMockContext(
        makeUser([
          makePermission('users:read'),
          makePermission('users:create'),
          makePermission('roles:read'),
        ]),
      );

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  // ── Authorized users — manage wildcard ───────────────────────────────────────

  describe('authorized users — manage wildcard', () => {
    it(`'users:manage' satisfies a 'users:read' requirement`, () => {
      reflector.getAllAndOverride.mockReturnValue(['users:read']);
      const ctx = createMockContext(makeUser([makePermission('users:manage')]));

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it(`'users:manage' satisfies 'users:delete' (most destructive action)`, () => {
      reflector.getAllAndOverride.mockReturnValue(['users:delete']);
      const ctx = createMockContext(makeUser([makePermission('users:manage')]));

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it(`'users:manage' satisfies every users:* action simultaneously`, () => {
      reflector.getAllAndOverride.mockReturnValue([
        'users:create',
        'users:read',
        'users:update',
        'users:delete',
      ]);
      const ctx = createMockContext(makeUser([makePermission('users:manage')]));

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it(`'users:manage' does NOT satisfy 'roles:read' (cross-resource boundary)`, () => {
      reflector.getAllAndOverride.mockReturnValue(['roles:read']);
      const ctx = createMockContext(makeUser([makePermission('users:manage')]));

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it(`'roles:manage' does NOT satisfy 'users:read'`, () => {
      reflector.getAllAndOverride.mockReturnValue(['users:read']);
      const ctx = createMockContext(makeUser([makePermission('roles:manage')]));

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('satisfies cross-resource requirements when user holds each resource manage', () => {
      reflector.getAllAndOverride.mockReturnValue(['users:delete', 'roles:update']);
      const ctx = createMockContext(
        makeUser([makePermission('users:manage'), makePermission('roles:manage')]),
      );

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  // ── Unauthorized users ────────────────────────────────────────────────────────

  describe('unauthorized users', () => {
    it('throws ForbiddenException when the user has no permissions at all', () => {
      reflector.getAllAndOverride.mockReturnValue(['users:read']);
      const ctx = createMockContext(makeUser([]));

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when one required permission is missing', () => {
      reflector.getAllAndOverride.mockReturnValue(['users:read', 'users:create']);
      const ctx = createMockContext(makeUser([makePermission('users:read')]));

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('lists every missing permission slug in the exception message', () => {
      reflector.getAllAndOverride.mockReturnValue(['users:create', 'roles:delete']);
      const ctx = createMockContext(makeUser([]));

      expect(() => guard.canActivate(ctx)).toThrow(
        'Access denied. Missing permissions: [users:create, roles:delete]',
      );
    });

    it('lists only the missing permissions when the user holds some but not all', () => {
      reflector.getAllAndOverride.mockReturnValue(['users:read', 'roles:delete']);
      const ctx = createMockContext(makeUser([makePermission('users:read')]));

      expect(() => guard.canActivate(ctx)).toThrow(
        'Access denied. Missing permissions: [roles:delete]',
      );
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('denies access for a malformed slug with no colon (instead of a wrong wildcard match)', () => {
      // Previously: indexOf(':') === -1 → slice(0, -1) trimmed the last char
      // e.g. required = "usersread" → resource = "usersrea" → checked "usersrea:manage" (wrong!)
      // Fixed: colonIdx === -1 → isSatisfied returns false immediately.
      reflector.getAllAndOverride.mockReturnValue(['usersread']);
      const ctx = createMockContext(
        // Even with manage on a resource that partially matches the mangled slug, access is denied
        makeUser([makePermission('usersrea:manage')]),
      );

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('throws TypeError when request.user is undefined and permissions are required', () => {
      // Same implicit contract as RolesGuard: must run after JwtAuthGuard.
      reflector.getAllAndOverride.mockReturnValue(['users:read']);
      const ctx = createMockContext(undefined);

      expect(() => guard.canActivate(ctx)).toThrow(TypeError);
    });

    it('correctly aggregates permissions across multiple roles', () => {
      const roleA = makeRole([makePermission('users:read')]);
      const roleB = makeRole([makePermission('roles:read')]);
      const user: RequestUser = {
        id: 'user-uuid',
        name: 'Multi-role User',
        email: 'multi@example.com',
        status: UserStatus.ACTIVE,
        roles: [roleA, roleB],
      };

      reflector.getAllAndOverride.mockReturnValue(['users:read', 'roles:read']);
      expect(guard.canActivate(createMockContext(user))).toBe(true);
    });
  });
});
