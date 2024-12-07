import {
  Inject,
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { AUTH_SERVICE } from '../constants/services';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';
import { UserDto } from '../dto';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(AUTH_SERVICE) private readonly authClient: ClientProxy) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const cookies = (<Request>context.switchToHttp().getRequest())?.cookies;

    const headers = (<Request>context.switchToHttp().getRequest())?.headers;

    const jwt = cookies?.Authentication || headers?.authorization;

    console.log(jwt);
    if (!jwt) {
      console.log('NO JWT FOUND');
      return false;
    }
    console.log('GETTING USER....');
    return this.authClient
      .send<UserDto>('authenticate', {
        Authentication: jwt,
      })
      .pipe(
        tap((res) => (context.switchToHttp().getRequest().user = res)),
        map(() => true),
        catchError((err) => {
          console.log('ERROR WHILE GETTING USER', err);
          return of(false);
        }),
      );
  }
}
