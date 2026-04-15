import { BaseEntity } from '../common/entities/base.entity';
import { Permission } from '../permissions/permission.entity';
import { User } from '../users/user.entity';
export declare class Role extends BaseEntity {
    name: string;
    description: string | null;
    isActive: boolean;
    permissions: Permission[];
    users: User[];
}
