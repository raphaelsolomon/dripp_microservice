import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  DatabaseModule,
  LoggerModule,
  AUTH_SERVICE,
  CloudinaryModule,
  WALLET_SERVICE,
  NOTIFICATION_SERVICE,
} from '@app/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BrandRepository } from './repositories/brand.repository';
import { BrandDocument, BrandSchema } from './models/brand.schema';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { MemberDocument, MemberSchema } from './models/member.schema';
import { MemberRepository } from './repositories/member.repository';
import { PostDocument, PostSchema } from './models/post.schema';
import { PostRepository } from './repositories/post.repository';
import { TaskDocument, TaskSchema } from './models/task.schema';
import { TaskRepository } from './repositories/task.repository';
import { DiscountDocument, DiscountSchema } from './models/discount.schema';
import { DiscountRepository } from './repositories/discount.repository';
import { GiftCardRepository } from './repositories/giftcard.repository';
import { GiftCardDocument, GiftCardSchema } from './models/giftcard.schema';
import {
  MemberShipMailDocument,
  MemberShipMailSchema,
} from './models/membership-mail.schema';
import { CardDocument, CardSchema } from './models/card.schema';
import { CardRepository } from './repositories/card.repository';
import { MemberShipMailRepository } from './repositories/membership-mail.repository';

@Module({
  imports: [
    NestjsFormDataModule,
    DatabaseModule,
    DatabaseModule.forFeature([
      { name: BrandDocument.name, schema: BrandSchema },
      { name: MemberDocument.name, schema: MemberSchema },
      { name: PostDocument.name, schema: PostSchema },
      { name: TaskDocument.name, schema: TaskSchema },
      { name: DiscountDocument.name, schema: DiscountSchema },
      { name: MemberShipMailDocument.name, schema: MemberShipMailSchema },
      { name: GiftCardDocument.name, schema: GiftCardSchema },
      { name: CardDocument.name, schema: CardSchema },
    ]),
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        BRAND_HTTP_PORT: Joi.number().required(),
        BRAND_TCP_PORT: Joi.number().required(),
        AUTH_HOST: Joi.string().required(),
        AUTH_TCP_PORT: Joi.number().required(),
        WALLET_TCP_HOST: Joi.string().required(),
        WALLET_TCP_PORT: Joi.number().required(),
        NOTIFICATION_HOST: Joi.string().required(),
        NOTIFICATION_TCP_PORT: Joi.number().required(),
      }),
    }),
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('AUTH_HOST'),
            port: configService.get<number>('AUTH_TCP_PORT'),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: WALLET_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('WALLET_TCP_HOST'),
            port: configService.get<number>('WALLET_TCP_PORT'),
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
    CloudinaryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    BrandRepository,
    MemberRepository,
    PostRepository,
    TaskRepository,
    DiscountRepository,
    GiftCardRepository,
    CardRepository,
    MemberShipMailRepository,
  ],
})
export class AppModule {}
