export interface JwtPayload {
  /** Subject — the user's UUID */
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}
