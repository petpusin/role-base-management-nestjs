import { BaseEntity } from '../common/entities/base.entity';
import { Role } from '../roles/role.entity';
export declare enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended"
}
export declare class User extends BaseEntity {
    name: string;
    email: string;
    passwordHash: string;
    status: UserStatus;
    lastLoginAt: Date | null;
    roles: Role[];
    hashPassword(): Promise<void>;
    validatePassword(plainText: string): Promise<boolean>;
}
