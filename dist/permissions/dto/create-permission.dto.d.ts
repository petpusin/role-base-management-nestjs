import { PermissionAction } from '../permission.entity';
export declare class CreatePermissionDto {
    resource: string;
    action: PermissionAction;
    description?: string;
}
