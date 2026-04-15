import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { CanActivate } from '@nestjs/common';
export declare class RolesGuard implements CanActivate {
    private readonly reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
}
