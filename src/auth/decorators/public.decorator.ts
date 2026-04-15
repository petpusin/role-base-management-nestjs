import type { CustomDecorator } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route as public — skips JwtAuthGuard entirely.
 *
 * @example
 * @Public()
 * @Post('auth/login')
 * login(@Body() dto: LoginDto) { ... }
 */
export const Public = (): CustomDecorator => SetMetadata(IS_PUBLIC_KEY, true);
