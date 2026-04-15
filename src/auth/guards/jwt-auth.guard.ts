import type { ExecutionContext } from '@nestjs/common';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Applied globally in AppModule.
 *
 * - Skips routes decorated with @Public()
 * - Delegates token verification to JwtStrategy
 * - On success, attaches the full user (with roles + permissions) to request.user
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest<T>(err: Error | null, user: T): T {
    if (err !== null) throw err;
    if (!user) throw new UnauthorizedException('Invalid or missing token');
    return user;
  }
}
