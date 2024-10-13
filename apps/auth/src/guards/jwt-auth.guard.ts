import { AuthGuard } from '@nestjs/passport';
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly authService: UsersService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    let accessToken: string =
      request?.cookies?.Authentication ||
      request?.Authentication ||
      request.headers.authorization;

    if (!accessToken)
      throw new UnauthorizedException('Unauthorized, no access token');

    if (accessToken && accessToken.startsWith('Bearer')) {
      accessToken = accessToken.replace('Bearer ', '');
    }

    const decode: any = jwt.decode(accessToken);

    const userId: string = decode.userId;
    if (!userId) {
      throw new UnauthorizedException(
        'Unauthorized, could not decode jwt token',
      );
    }
    try {
      await this.authService.getToken(userId, accessToken);

      const result = await super.canActivate(context);

      return result as boolean;
    } catch (err) {
      console.log(err);
      throw new UnauthorizedException(
        err?.message || 'Unauthorized, could not get user',
      );
    }
  }
}
