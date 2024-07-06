import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UsersService } from '../users/users.service';

@Injectable()
export class Localstrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({ usernameField: 'identifier', password: 'password' });
  }

  async validate(identifier: string, password: string) {
    try {
      return await this.usersService.verifyUser(identifier, password);
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }
}
