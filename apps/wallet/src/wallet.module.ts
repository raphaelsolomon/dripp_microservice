import { Module } from '@nestjs/common';
import {
  AUTH_SERVICE,
  DatabaseModule,
  LoggerModule,
  NOTIFICATION_SERVICE,
} from '@app/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletRepository } from './repositories/wallet.repository';
import { WalletDocument, WalletSchema } from './models/wallet.schema';
import { FundModule } from './fund/fund.module';
import { WithdrawalModule } from './withdraw/withdrawal.module';
import { TransactionRepository } from './repositories/transaction.repository';
import {
  TransactionDocument,
  TransactionSchema,
} from './models/transaction.schema';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([
      { name: WalletDocument.name, schema: WalletSchema },
      { name: TransactionDocument.name, schema: TransactionSchema },
    ]),
    LoggerModule,
    FundModule,
    WithdrawalModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        MONGODB_NAME: Joi.string().required(),
        WALLET_HTTP_PORT: Joi.string().required(),
        WALLET_TCP_PORT: Joi.string().required(),
        REDIS_CONNECT_URL: Joi.string().required(),
        FLUTTERWAVE_URL: Joi.string().required(),
        FLUTTERWAVE_PUBLIC_KEY: Joi.string().required(),
        FLUTTERWAVE_SECRET_KEY: Joi.string().required(),
        FLUTTERWAVE_ENC_KEY: Joi.string().required(),
        REDIRECT_URL: Joi.string().required(),
        WALLET_SESSION_SECRET: Joi.string().required(),
        AUTH_HOST: Joi.string().required(),
        AUTH_TCP_PORT: Joi.string().required(),
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
  controllers: [WalletController],
  providers: [WalletService, WalletRepository, TransactionRepository],
})
export class WalletModule {}
