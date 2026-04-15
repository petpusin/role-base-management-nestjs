import type { User } from '../../users/user.entity';

/** Shape of `request.user` after JwtAuthGuard runs */
export type RequestUser = Pick<
  User,
  'id' | 'email' | 'name' | 'status' | 'roles'
>;
