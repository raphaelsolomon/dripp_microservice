/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UserDocument, UserDto } from '@app/common';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenPayload as CustomTokenPayload } from './interface/token-payload.interface';
import { UsersService } from './users/users.service';
import { CreateUserDto } from './users/dto/create-user.dto';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import * as OAuth from 'oauth-1.0a';
import * as crypto from 'crypto';

type SocialType = {
  user: object;
  accessToken: { token: string; expiresIn: number };
  refreshToken: { token: string; expiresIn: string };
};

@Injectable()
export class AuthService {
  private oauth: OAuth;
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {
    const consumerKey = this.configService.get<string>('TWITTER_CONSUMER_KEY');
    const consumerSecret = this.configService.get('TWITTER_CONSUMER_SECRET');

    this.oauth = new OAuth({
      consumer: { key: consumerKey, secret: consumerSecret },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string, key) {
        return crypto
          .createHmac('sha1', key)
          .update(base_string)
          .digest('base64');
      },
    });
  }

  async create(input: CreateUserDto, response: Response) {
    const user = await this.userService.create(input);
    return await this.getUserAndToken(user, response);
  }

  async login(user: UserDocument, response: Response): Promise<SocialType> {
    return await this.getUserAndToken(user, response);
  }

  async getUserAndToken(
    userInfo: UserDocument,
    res: Response,
  ): Promise<SocialType> {
    const tokenPayload: CustomTokenPayload = {
      userId: userInfo._id.toString(),
    };
    const accessToken = this.jwtService.sign(tokenPayload);
    const refreshToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '20d',
    });
    //update the user refresh token in the database
    this.userService.updateRefreshToken(
      userInfo._id.toString(),
      refreshToken,
      accessToken,
    );
    //update cookies session with the access token
    res.cookie('Authentication', accessToken, {
      httpOnly: true,
      sameSite: 'strict', // prevent CSRF attacks
      maxAge: 86400000, //24 hours
      secure: process.env.NODE_ENV === 'production',
    });
    // stripe out unwanted results from user information
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
  }

  async validateToken(userId: string, authHeader: string) {
    return this.userService.getToken(userId, authHeader);
  }

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

  async logout(user: UserDto, res: Response) {
    try {
      await this.userService.logout(user._id);
      res.cookie('Authentication', '', {
        httpOnly: true,
        expires: new Date(0),
      });
      return res.status(200).send({ message: 'Logged out successfully' });
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async verifyOAuth(provider: string, req: Request, res: Response) {
    let user: UserDocument = undefined;

    const code: string = <string>req?.query?.code;
    const oauth_token: string = <string>req?.query?.oauth_token;
    const oauth_verifier: string = <string>req?.query?.oauth_verifier;

    switch (provider) {
      case 'facebook':
        user = await this.validateFacebookCode(code);
        break;

      case 'google':
        user = await this.validateGoogleCode(code);
        break;

      case 'x':
        user = await this.validateXCode(oauth_token, oauth_verifier);
        break;

      default:
        throw new BadRequestException(`Invalid Provider: ${provider}`);
    }
    return await this.getUserAndToken(user, res);
  }

  async validateGoogleCode(code: string) {
    try {
      const client = new OAuth2Client(
        this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID'),
        this.configService.get<string>('GOOGLE_OAUTH_CLIENT_SECRET'),
      );

      const token = await client.getToken({
        code: code,
        client_id: this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID'),
        redirect_uri: this.configService.get('GOOGLE_OAUTH_CALLBACK_URL'),
      });

      const idToken: string = token!.tokens!.id_token ?? '';
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID'),
      });

      const payload = ticket.getPayload();

      if (!payload)
        throw new BadRequestException('Error verifying Google id token');

      return await this.userService.authenticateGoogle(payload);
    } catch (e) {
      throw new UnprocessableEntityException(e);
    }
  }

  async validateXCode(oauth_token_code: string, oauth_verifier: string) {
    try {
      const { oauth_token, oauth_token_secret } = await this.getXaccessToken(
        oauth_token_code,
        oauth_verifier,
      );

      const result = await this.validateAndGetProfile(
        oauth_token,
        oauth_token_secret,
      );

      return this.userService.authenticateX(result);
    } catch (e) {
      throw new UnprocessableEntityException(e);
    }
  }

  async validateFacebookCode(code: string) {
    const fbAccessToken = await this.getFacebookAccessToken(code);
    const userProfile = await this.getFbUserProfile(fbAccessToken);
    return await this.userService.authenticateFacebook(userProfile);
  }

  async getFacebookAccessToken(code: string): Promise<string> {
    const url: string = this.configService.get<string>('FACEBOOK_AUTH_URL');
    const params = {
      client_id: this.configService.get<string>('FACEBOOK_APP_ID'),
      client_secret: this.configService.get<string>('FACEBOOK_APP_SECRET'),
      redirect_uri: this.configService.get('FACEBOOK_APP_CALLBACK_URL'),
      code: code,
    };
    try {
      const response = await axios.get(url, { params });
      return response.data.access_token;
    } catch (error) {
      throw new UnprocessableEntityException(error);
    }
  }

  async getFbUserProfile(accessToken: string): Promise<any> {
    const url: string = this.configService.get<string>('FACEBOOK_ME_URL');
    const params = {
      fields: 'id,name,email,picture',
      access_token: accessToken,
    };

    try {
      const response = await axios.get(url, { params });
      return response.data;
    } catch (error) {
      throw new UnprocessableEntityException(error);
    }
  }

  async getXaccessToken(oauth_token: string, oauth_verifier: string) {
    const request_data = {
      url: this.configService.get<string>('TWITTER_AUTH_URL'),
      method: 'POST',
      data: {
        oauth_token,
        oauth_verifier,
      },
    };

    const authHeader = this.oauth.toHeader(
      this.oauth.authorize(request_data, { key: oauth_token, secret: '' }),
    );
    const response = await axios.post(request_data.url, null, {
      headers: {
        Authorization: authHeader.Authorization,
      },
      params: request_data.data,
    });

    return this.extractTokens(<string>response.data);
  }

  extractTokens(str: string) {
    const params = new URLSearchParams(str);
    const oauth_token = params.get('oauth_token');
    const oauth_token_secret = params.get('oauth_token_secret');

    return { oauth_token, oauth_token_secret };
  }

  async validateAndGetProfile(accessToken: string, accessTokenSecret: string) {
    const request_data = {
      url: this.configService.get<string>('TWITTER_VALIDATE_URL'),
      method: 'GET',
    };

    const authHeader = this.oauth.toHeader(
      this.oauth.authorize(request_data, {
        key: accessToken,
        secret: accessTokenSecret,
      }),
    );

    const response = await axios.get(request_data.url, {
      headers: {
        Authorization: authHeader.Authorization,
      },
    });

    return response.data;
  }
}
