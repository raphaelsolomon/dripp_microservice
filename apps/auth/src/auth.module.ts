import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoggerModule } from '@app/common';
import { UsersModule } from './users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { Localstrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { SearchModule } from './search/search.module';
import { XTwitterStrategy } from './strategies/twitter.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        MONGODB_NAME: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        SESSION_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().required(),
        AUTH_HTTP_PORT: Joi.number().required(),
        AUTH_TCP_PORT: Joi.number().required(),
        BRAND_HOST: Joi.string().required(),
        BRAND_TCP_PORT: Joi.number().required(),
        CHAT_HOST: Joi.string().required(),
        CHAT_TCP_PORT: Joi.number().required(),
        NOTIFICATION_HOST: Joi.string().required(),
        NOTIFICATION_TCP_PORT: Joi.number().required(),
        GOOGLE_OAUTH_CLIENT_ID: Joi.string().required(),
        GOOGLE_OAUTH_CLIENT_SECRET: Joi.string().required(),
        GOOGLE_OAUTH_CALLBACK_URL: Joi.string().required(),
        FACEBOOK_APP_ID: Joi.string().required(),
        FACEBOOK_APP_SECRET: Joi.string().required(),
        FACEBOOK_APP_CALLBACK_URL: Joi.string().required(),
        WALLET_TCP_PORT: Joi.number().required(),
        WALLET_HOST: Joi.string().required(),
        CLOUDINARY_NAME: Joi.string().required(),
        CLOUDINARY_API_KEY: Joi.string().required(),
        CLOUDINARY_API_SECRET: Joi.string().required(),
      }),
    }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: `${configService.get('JWT_EXPIRATION')}s`,
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    SearchModule,
    LoggerModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    Localstrategy,
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
    XTwitterStrategy,
  ],
})
export class AuthModule {}
