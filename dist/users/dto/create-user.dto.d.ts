import { UserStatus } from '../user.entity';
export declare class CreateUserDto {
    name: string;
    email: string;
    password: string;
    status?: UserStatus;
    roleIds?: string[];
}
