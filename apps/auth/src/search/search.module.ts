import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import {
  BRAND_SERVICE,
  DatabaseModule,
  NOTIFICATION_SERVICE,
  UserDiscountDocument,
  UserDiscountSchema,
  UserDocument,
  UserGiftCardDocument,
  UserGiftCardSchema,
  UserSchema,
} from '@app/common';
import { UserRepository } from '../users/repositories/users.repository';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

import { GiftCardRepository as UserGiftCardRepository } from '@app/common';
import { DiscountRepository as UserDiscountRepository } from '@app/common';

@Module({
  imports: [
    DatabaseModule.forFeature([
      {
        name: UserDocument.name,
        schema: UserSchema,
      },
      {
        name: UserDiscountDocument.name,
        schema: UserDiscountSchema,
      },
      {
        name: UserGiftCardDocument.name,
        schema: UserGiftCardSchema,
      },
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
    ]),
  ],
  controllers: [SearchController],
  providers: [
    SearchService,
    UserRepository,
    UserGiftCardRepository,
    UserDiscountRepository,
  ],
})
export class SearchModule {}
