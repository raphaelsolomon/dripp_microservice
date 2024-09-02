/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, Injectable } from '@nestjs/common';
import { UserDocument } from '@app/common';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from './interface/token-payload.interface';
import { UsersService } from './users/users.service';

type SocialType = {
  user: object;
  accessToken: { token: string; expiresIn: number };
  refreshToken: { token: string; expiresIn: string };
};

@Injectable()
export class AuthService {
  async exchangeRefreshToken(refresh_token: string, res: Response) {
    const getToken = await this.userService.getRefreshToken(refresh_token);
    if (getToken === undefined) {
      throw new BadRequestException(`Refresh token was not found`);
    }

    try {
      const payload = this.jwtService.verify(getToken.refresh_token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user: UserDocument = getToken.user_id as any;
      if (payload.userId !== user._id.toString()) {
        throw new BadRequestException('Invalid token');
      }
      const result = await this.getUserAndToken(user, res);
      return res.status(200).json(result);
    } catch (err) {
      throw new Error(err);
    }
  }
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
    const accessToken = this.jwtService.sign(tokenPayload);
    const refreshToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '20d',
    });
    //update the user refresh token in the database
    this.userService.updateRefreshToken(userInfo._id.toString(), refreshToken);
    //update cookies session with the access token
    res.cookie('Authentication', accessToken, { httpOnly: true });
    const { password, ...details } = userInfo;
    return {
      user: details,
      accessToken: {
        token: accessToken,
        expiresIn: 86400,
      },
      refreshToken: {
        token: refreshToken,
        expiresIn: '20d',
      },
    };
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
