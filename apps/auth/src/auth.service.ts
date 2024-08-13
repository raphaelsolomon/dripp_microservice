/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { UserDocument } from '@app/common';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from './interface/token-payload.interface';
import { UsersService } from './users/users.service';

type SocialType = {
  user: object;
  accessToken: string;
  expiresIn: number;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}

  async login(user: UserDocument, response: Response): Promise<SocialType> {
    return await this.getUserAndToken(user, response);
  }

  getUserAndToken = async (
    userInfo: UserDocument,
    res: Response,
  ): Promise<SocialType> => {
    const tokenPayload: TokenPayload = {
      userId: userInfo._id.toString(),
    };
    const token = this.jwtService.sign(tokenPayload);
    res.cookie('Authentication', token, {
      // expires,
      httpOnly: true,
    });
    const { password, ...details } = userInfo;
    return { user: details, accessToken: token, expiresIn: 86400 };
  };

  async googleLogin(req: Request, res: Response): Promise<SocialType> {
    const user = await this.userService.authenticateGoogle(req.user);
    return await this.getUserAndToken(user, res);
  }

  async facebookLogin(req: Request, res: Response): Promise<SocialType> {
    const user = await this.userService.authenticateFacebook(req.user);
    return await this.getUserAndToken(user, res);
  }

  async xLogin(req: Request, res: Response): Promise<SocialType> {
    const user = await this.userService.authenticateX(req.user);
    return await this.getUserAndToken(user, res);
  }
}
