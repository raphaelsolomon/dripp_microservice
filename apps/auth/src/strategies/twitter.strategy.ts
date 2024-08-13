import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-twitter';

@Injectable()
export class XTwitterStrategy extends PassportStrategy(Strategy, 'twitter') {
  constructor(readonly configService: ConfigService) {
    super({
      consumerKey: configService.get<string>('TWITTER_CONSUMER_KEY'),
      consumerSecret: configService.get<string>('TWITTER_CONSUMER_SECRET'),
      callbackURL: configService.get<string>('X_CALLBACK_URL'),
      includeEmail: true,
    });
  }
  async validate(
    token: string,
    tokenSecret: string,
    profile: any,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    try {
      console.log(profile, token, tokenSecret);
      done(null, profile);
    } catch (error) {
      done(error, null);
      throw new UnauthorizedException(error);
    }
  }
}
