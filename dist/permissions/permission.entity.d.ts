import { BaseEntity } from '../common/entities/base.entity';
import { Role } from '../roles/role.entity';
export declare enum PermissionAction {
    CREATE = "create",
    READ = "read",
    UPDATE = "update",
    DELETE = "delete",
    MANAGE = "manage"
}
export declare class Permission extends BaseEntity {
    resource: string;
    action: PermissionAction;
    description: string | null;
    slug: string;
    roles: Role[];
    syncSlug(): void;
}
