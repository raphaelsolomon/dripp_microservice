import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import {
  BRAND_SERVICE,
  CloudinaryModule,
  DatabaseModule,
  DiscountRepository,
  GiftCardRepository,
  NOTIFICATION_SERVICE,
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
import { VerificationRepository } from './verification.repository';
import { NestjsFormDataModule } from 'nestjs-form-data';

@Module({
  imports: [
    NestjsFormDataModule,
    DatabaseModule,
    DatabaseModule.forFeature([
      { name: UserDocument.name, schema: UserSchema },
      { name: VerificationDocument.name, schema: VerificationSchema },
      { name: UserGiftCardDocument.name, schema: UserGiftCardSchema },
      { name: UserDiscountDocument.name, schema: UserDiscountSchema },
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
  ],
  exports: [UsersService, UserRepository],
})
export class UsersModule {}
