import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { UserStatus } from '../../users/user.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { RequestUser } from '../interfaces/request-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Called after Passport verifies the token signature.
   * Fresh DB fetch ensures revoked roles & suspended accounts are enforced immediately.
   * The returned value becomes `request.user`.
   */
  async validate(payload: JwtPayload): Promise<RequestUser> {
    const user = await this.usersService.findOne(payload.sub);

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is inactive or suspended');
    }

    return user as RequestUser;
  }
}
