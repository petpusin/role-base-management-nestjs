import type { User } from '../../users/user.entity';
export type RequestUser = Pick<User, 'id' | 'email' | 'name' | 'status' | 'roles'>;
