import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import {
  BRAND_SERVICE,
  CHAT_SERVICE,
  CloudinaryModule,
  DatabaseModule,
  DiscountRepository,
  GiftCardRepository,
  IndustryDocument,
  IndustryRepository,
  IndustrySchema,
  NOTIFICATION_SERVICE,
  SubmissionRepository,
  TaskCompletionDocument,
  TaskCompletionRepository,
  TaskCompletionSchema,
  TaskSubmissionDocument,
  TaskSubmissionSchema,
  UserDiscountDocument,
  UserDiscountSchema,
  UserGiftCardDocument,
  UserGiftCardSchema,
  WALLET_SERVICE,
} from '@app/common';
import { UserDocument, UserSchema } from '@app/common';
import { UserRepository } from './repositories/users.repository';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import {
  VerificationDocument,
  VerificationSchema,
} from './models/verification.schema';
import { VerificationRepository } from './repositories/verification.repository';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { TokenDocument, TokenSchema } from './models/token.schema';
import { TokenRepository } from './repositories/token.repository';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register(),
    NestjsFormDataModule,
    DatabaseModule,
    DatabaseModule.forFeature([
      { name: UserDocument.name, schema: UserSchema },
      { name: VerificationDocument.name, schema: VerificationSchema },
      { name: UserGiftCardDocument.name, schema: UserGiftCardSchema },
      { name: UserDiscountDocument.name, schema: UserDiscountSchema },
      { name: TaskSubmissionDocument.name, schema: TaskSubmissionSchema },
      { name: TaskCompletionDocument.name, schema: TaskCompletionSchema },
      { name: TokenDocument.name, schema: TokenSchema },
      { name: IndustryDocument.name, schema: IndustrySchema },
    ]),
    ClientsModule.registerAsync([
      {
        name: BRAND_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('BRAND_HOST'),
            port: configService.get<number>('BRAND_TCP_PORT'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: NOTIFICATION_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('NOTIFICATION_HOST'),
            port: configService.get<number>('NOTIFICATION_TCP_PORT'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: WALLET_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('WALLET_HOST'),
            port: configService.get<number>('WALLET_TCP_PORT'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: CHAT_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('CHAT_HOST'),
            port: configService.get<number>('CHAT_TCP_PORT'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
    CloudinaryModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserRepository,
    VerificationRepository,
    DiscountRepository,
    GiftCardRepository,
    SubmissionRepository,
    TaskCompletionRepository,
    TokenRepository,
    IndustryRepository,
  ],
  exports: [UsersService, UserRepository],
})
export class UsersModule {}
