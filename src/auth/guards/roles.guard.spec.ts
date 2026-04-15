import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { RequestUser } from '../interfaces/request-user.interface';
import { UserStatus } from '../../users/user.entity';
import type { Role } from '../../roles/role.entity';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_DATE = new Date('2024-01-01T00:00:00.000Z');

/** Creates a minimal Role stub. Only `name` matters for RolesGuard. */
const makeRole = (name: string, overrides: Partial<Role> = {}): Role =>
  ({
    id: `role-${name}`,
    name,
    description: null,
    isActive: true,
    permissions: [],
    users: [],
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
    deletedAt: null,
    ...overrides,
  }) as Role;

/** Creates a minimal RequestUser stub with the given roles. */
const makeUser = (roles: Role[]): RequestUser => ({
  id: 'user-uuid',
  name: 'Test User',
  email: 'test@example.com',
  status: UserStatus.ACTIVE,
  roles,
});

/**
 * Builds a typed ExecutionContext mock.
 * `getHandler` and `getClass` return stable function references so that
 * reflector call assertions can compare them directly.
 */
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

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as jest.Mocked<
      Pick<Reflector, 'getAllAndOverride'>
    >;
    guard = new RolesGuard(reflector as Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── Reflector contract ───────────────────────────────────────────────────────

  describe('reflector integration', () => {
    it('queries metadata with ROLES_KEY and both handler + class targets', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined as unknown as string[]);
      const ctx = createMockContext();

      guard.canActivate(ctx);

      expect(reflector.getAllAndOverride).toHaveBeenCalledTimes(1);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]);
    });
  });

  // ── No roles required (public-like routes) ───────────────────────────────────

  describe('when no roles are required', () => {
    it('returns true when the reflector finds no @Roles decorator (undefined)', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined as unknown as string[]);

      // user is undefined: proves the guard short-circuits before touching request.user
      expect(guard.canActivate(createMockContext(undefined))).toBe(true);
    });

    it('returns true when @Roles() is applied with an empty list', () => {
      reflector.getAllAndOverride.mockReturnValue([]);

      expect(guard.canActivate(createMockContext(undefined))).toBe(true);
    });

    it('does not access request.user when no roles are required', () => {
      reflector.getAllAndOverride.mockReturnValue([]);
      const ctx = createMockContext(undefined);

      // If user were accessed, user.roles.map would throw — passing proves short-circuit
      expect(() => guard.canActivate(ctx)).not.toThrow();
    });
  });

  // ── Authorized users ─────────────────────────────────────────────────────────

  describe('authorized users', () => {
    it('returns true when the user holds the single required role', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      const ctx = createMockContext(makeUser([makeRole('admin')]));

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true when the user holds one of multiple accepted roles', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin', 'editor']);
      const ctx = createMockContext(makeUser([makeRole('editor')]));

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('returns true when the user holds several roles and one matches', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      const ctx = createMockContext(makeUser([makeRole('user'), makeRole('admin')]));

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  // ── Unauthorized users ────────────────────────────────────────────────────────

  describe('unauthorized users', () => {
    it('throws ForbiddenException when the user holds a non-matching role', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      const ctx = createMockContext(makeUser([makeRole('user')]));

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when the user has no roles at all', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      const ctx = createMockContext(makeUser([]));

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('includes every required role name in the exception message', () => {
      reflector.getAllAndOverride.mockReturnValue(['admin', 'superadmin']);
      const ctx = createMockContext(makeUser([makeRole('user')]));

      expect(() => guard.canActivate(ctx)).toThrow(
        'Access denied. Required roles: [admin, superadmin]',
      );
    });

    it('does not match when role names differ only by case (case-sensitive)', () => {
      reflector.getAllAndOverride.mockReturnValue(['Admin']); // capital A
      const ctx = createMockContext(makeUser([makeRole('admin')])); // lowercase

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('does not grant access when the user holds a role that is a prefix of the required one', () => {
      reflector.getAllAndOverride.mockReturnValue(['administrator']);
      const ctx = createMockContext(makeUser([makeRole('admin')]));

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('throws TypeError when request.user is missing and roles are required', () => {
      // This documents the implicit contract: RolesGuard MUST run after JwtAuthGuard.
      // If JwtAuthGuard is absent from the guard stack, request.user is undefined and
      // user.roles.map() throws instead of returning a controlled ForbiddenException.
      reflector.getAllAndOverride.mockReturnValue(['admin']);
      const ctx = createMockContext(undefined);

      expect(() => guard.canActivate(ctx)).toThrow(TypeError);
    });

    it('returns true immediately without reading request.user when roles list is undefined', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined as unknown as string[]);
      const ctx = createMockContext(undefined);

      // user is undefined; if the guard reads user.roles it would throw
      expect(() => guard.canActivate(ctx)).not.toThrow();
    });
  });
});
