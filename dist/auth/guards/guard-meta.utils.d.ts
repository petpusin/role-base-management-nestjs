import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
export declare function getMetadata(reflector: Reflector, metadataKey: string | symbol, context: ExecutionContext): unknown;
