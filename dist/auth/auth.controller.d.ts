import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { RequestUser } from './interfaces/request-user.interface';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        accessToken: string;
    }>;
    me(user: RequestUser): RequestUser;
}
