import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';

/**
 * Corrects the return type of Reflector.getAllAndOverride.
 *
 * NestJS types that method as returning `T`, but at runtime it returns
 * `undefined` whenever no matching decorator is applied to the handler or
 * controller class. Returning `unknown` here lets callers cast to
 * `T | undefined` and write safe null-guards that TypeScript recognises as
 * necessary (rather than flagging them as redundant conditions).
 */
export function getMetadata(
  reflector: Reflector,
  metadataKey: string | symbol,
  context: ExecutionContext,
): unknown {
  return reflector.getAllAndOverride<unknown>(metadataKey, [
    context.getHandler(),
    context.getClass(),
  ]);
}
