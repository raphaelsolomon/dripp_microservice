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
  UserGiftCardDocument,
  UserGiftCardSchema,
  UserDiscountDocument,
  UserDiscountSchema,
  UserDocument,
  UserSchema,
  TaskSubmissionDocument,
  TaskSubmissionSchema,
  SubmissionRepository,
  TaskCompletionDocument,
  TaskCompletionSchema,
  TaskCompletionRepository,
  IndustryRepository,
  IndustryDocument,
  IndustrySchema,
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
import { DiscountRepository } from './repositories/discount.repository';
import { GiftCardRepository } from './repositories/giftcard.repository';
import {
  MemberShipMailDocument,
  MemberShipMailSchema,
} from './models/membership-mail.schema';
import { CardDocument, CardSchema } from './models/card.schema';
import { CardRepository } from './repositories/card.repository';
import { MemberShipMailRepository } from './repositories/membership-mail.repository';
import {
  BrandGiftCardDocument,
  BrandGiftCardSchema,
} from './models/giftcard.schema';
import {
  BrandDiscountDocument,
  BrandDiscountSchema,
} from './models/discount.schema';

import { GiftCardRepository as UserGiftCardRepository } from '@app/common';
import { DiscountRepository as UserDiscountRepository } from '@app/common';
import { GraphModule } from './graph/graph.module';
import {
  SubTaskTrackerDocument,
  SubTaskTrackerSchema,
} from '@app/common/database/models/sub-task-tracker.schema';
import { SubTaskTrackerRepository } from '@app/common/database/repositorys/sub-task-tracker.repository';
import { SubTaskRepository } from './repositories/sub-task.repository';
import { SubTaskDocument, SubTaskSchema } from './models/sub-task.schema';
import { MongooseTransaction } from '@app/common/database/mongoose-transaction';
import { WalletRepository } from 'apps/wallet/src/repositories/wallet.repository';
import {
  WalletDocument,
  WalletSchema,
} from 'apps/wallet/src/models/wallet.schema';

@Module({
  imports: [
    NestjsFormDataModule,
    DatabaseModule,
    DatabaseModule.forFeature([
      { name: BrandDocument.name, schema: BrandSchema },
      { name: UserDocument.name, schema: UserSchema },
      { name: MemberDocument.name, schema: MemberSchema },
      { name: PostDocument.name, schema: PostSchema },
      { name: TaskDocument.name, schema: TaskSchema },
      { name: BrandDiscountDocument.name, schema: BrandDiscountSchema },
      { name: MemberShipMailDocument.name, schema: MemberShipMailSchema },
      { name: BrandGiftCardDocument.name, schema: BrandGiftCardSchema },
      { name: CardDocument.name, schema: CardSchema },
      { name: TaskSubmissionDocument.name, schema: TaskSubmissionSchema },
      { name: UserGiftCardDocument.name, schema: UserGiftCardSchema },
      { name: UserDiscountDocument.name, schema: UserDiscountSchema },
      { name: TaskCompletionDocument.name, schema: TaskCompletionSchema },
      { name: SubTaskTrackerDocument.name, schema: SubTaskTrackerSchema },
      { name: SubTaskDocument.name, schema: SubTaskSchema },
      { name: IndustryDocument.name, schema: IndustrySchema },
      { name: WalletDocument.name, schema: WalletSchema },
    ]),
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        MONGODB_NAME: Joi.string().required(),
        BRAND_HTTP_PORT: Joi.number().required(),
        CLOUDINARY_NAME: Joi.string().required(),
        CLOUDINARY_API_KEY: Joi.string().required(),
        CLOUDINARY_API_SECRET: Joi.string().required(),
      }),
    }),
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
            queue: AUTH_SERVICE,
          },
        }),
        inject: [ConfigService],
      },
      {
        name: WALLET_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
            queue: WALLET_SERVICE,
          },
        }),
        inject: [ConfigService],
      },
      {
        name: NOTIFICATION_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
            queue: NOTIFICATION_SERVICE,
          },
        }),
        inject: [ConfigService],
      },
    ]),
    CloudinaryModule,
    GraphModule,
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
    UserGiftCardRepository,
    UserDiscountRepository,
    SubmissionRepository,
    SubTaskTrackerRepository,
    SubTaskRepository,
    TaskCompletionRepository,
    IndustryRepository,
    MongooseTransaction,
    WalletRepository,
  ],
})
export class AppModule {}
