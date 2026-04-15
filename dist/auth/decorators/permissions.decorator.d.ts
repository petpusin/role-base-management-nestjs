import type { CustomDecorator } from '@nestjs/common';
export declare const PERMISSIONS_KEY = "permissions";
export declare const Permissions: (...slugs: string[]) => CustomDecorator;
