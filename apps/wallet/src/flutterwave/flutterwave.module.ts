import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { FlutterwaveService } from './flutterwave.service';
import { FlutterwaveController } from './flutterwave.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTH_SERVICE, DatabaseModule } from '@app/common';
import { TransactionRepository } from './transaction.repository';
import {
  TransactionDocument,
  TransactionSchema,
} from './models/transaction.schema';
import { WalletRepository } from '../wallet.repository';
import { WalletDocument, WalletSchema } from '../models/wallet.schema';

@Module({
  imports: [
    DatabaseModule.forFeature([
      { name: TransactionDocument.name, schema: TransactionSchema },
      { name: WalletDocument.name, schema: WalletSchema },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        FLUTTERWAVE_PUBLIC_KEY: Joi.string().required(),
        FLUTTERWAVE_SECRET_KEY: Joi.string().required(),
      }),
    }),
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('AUTH_HOST'),
            port: configService.get<number>('AUTH_PORT'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [FlutterwaveController],
  providers: [FlutterwaveService, TransactionRepository, WalletRepository],
  exports: [TransactionRepository],
})
export class FlutterwaveModule {}
