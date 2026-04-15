import { UnauthorizedException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { RequestUser } from '../interfaces/request-user.interface';
import { UserStatus } from '../../users/user.entity';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const VALID_USER: RequestUser = {
  id: 'user-uuid',
  name: 'Test User',
  email: 'test@example.com',
  status: UserStatus.ACTIVE,
  roles: [],
};

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

// ── Spy on the parent AuthGuard('jwt') prototype ──────────────────────────────
//
// JwtAuthGuard extends AuthGuard('jwt') and calls super.canActivate() for
// non-public routes. We spy on the parent prototype so the real passport
// strategy (which needs a DB + JWT secret) is never invoked during tests.

interface SuperCanActivate {
  canActivate(ctx: ExecutionContext): Promise<boolean>;
}

// The parent prototype sits one level above JwtAuthGuard.prototype in the chain.
const parentPrototype = Object.getPrototypeOf(
  JwtAuthGuard.prototype,
) as SuperCanActivate;

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;
  let superCanActivateSpy: jest.SpyInstance<
    Promise<boolean>,
    [ExecutionContext]
  >;

  beforeEach(() => {
    const mock: { getAllAndOverride: jest.Mock } = {
      getAllAndOverride: jest.fn(),
    };
    reflector = mock as jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;
    guard = new JwtAuthGuard(reflector as Reflector);

    superCanActivateSpy = jest
      .spyOn(parentPrototype, 'canActivate')
      .mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
    superCanActivateSpy.mockRestore();
  });

  // ── @Public() routes ──────────────────────────────────────────────────────────

  describe('@Public() routes', () => {
    it('returns true without calling super.canActivate when handler is @Public()', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const ctx = createMockContext();

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(superCanActivateSpy).not.toHaveBeenCalled();
    });

    it('reads IS_PUBLIC_KEY from both handler and class targets', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const ctx = createMockContext();

      await guard.canActivate(ctx);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]);
    });

    it('returns true without calling super.canActivate when class is @Public()', async () => {
      // Same check — getAllAndOverride merges handler + class metadata
      reflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(createMockContext());

      expect(result).toBe(true);
      expect(superCanActivateSpy).not.toHaveBeenCalled();
    });
  });

  // ── Protected routes ──────────────────────────────────────────────────────────

  describe('protected routes (not @Public())', () => {
    it('delegates to super.canActivate when the route is not public', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const ctx = createMockContext();

      await guard.canActivate(ctx);

      expect(superCanActivateSpy).toHaveBeenCalledTimes(1);
      expect(superCanActivateSpy).toHaveBeenCalledWith(ctx);
    });

    it('returns the result from super.canActivate', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      superCanActivateSpy.mockResolvedValue(true);

      const result = await guard.canActivate(createMockContext());

      expect(result).toBe(true);
    });

    it('propagates rejection from super.canActivate', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      superCanActivateSpy.mockRejectedValue(new UnauthorizedException());

      await expect(guard.canActivate(createMockContext())).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ── handleRequest — the security boundary ────────────────────────────────────
  //
  // This is the most critical method: it is called by Passport after token
  // verification and decides whether to attach the user to the request or throw.

  describe('handleRequest', () => {
    it('returns the user object when no error and user is present', () => {
      const result = guard.handleRequest<RequestUser>(null, VALID_USER);

      expect(result).toBe(VALID_USER);
    });

    it('rethrows the error when an auth error is present', () => {
      const authError = new UnauthorizedException('Token expired');

      expect(() =>
        guard.handleRequest<RequestUser>(authError, VALID_USER),
      ).toThrow(authError);
    });

    it('throws UnauthorizedException when user is falsy (null)', () => {
      expect(() => guard.handleRequest<null>(null, null)).toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when user is undefined', () => {
      expect(() => {
        guard.handleRequest<undefined>(null, undefined);
      }).toThrow(UnauthorizedException);
    });

    it('includes a descriptive message in the UnauthorizedException', () => {
      expect(() => guard.handleRequest<null>(null, null)).toThrow(
        'Invalid or missing token',
      );
    });

    it('prioritises the error over a missing user — error is thrown when both are provided', () => {
      const authError = new UnauthorizedException('Revoked');

      // Even though user is truthy, the error should be rethrown
      expect(() =>
        guard.handleRequest<RequestUser>(authError, VALID_USER),
      ).toThrow(authError);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('returns true when reflector returns undefined (no @Public decorator)', async () => {
      // No @Public → isPublic is undefined (falsy) → should call super.canActivate
      reflector.getAllAndOverride.mockReturnValue(
        undefined as unknown as boolean,
      );
      superCanActivateSpy.mockResolvedValue(true);

      const result = await guard.canActivate(createMockContext());

      expect(result).toBe(true);
      expect(superCanActivateSpy).toHaveBeenCalledTimes(1);
    });
  });
});
