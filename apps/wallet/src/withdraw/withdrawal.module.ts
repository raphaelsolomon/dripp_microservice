import { Module } from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { TransactionRepository } from '../repositories/transaction.repository';
import { WalletRepository } from '../repositories/wallet.repository';
import { WithdrawController } from './withdrawal.controller';
import { AUTH_SERVICE, DatabaseModule } from '@app/common';
import {
  TransactionDocument,
  TransactionSchema,
} from '../models/transaction.schema';
import { WalletDocument, WalletSchema } from '../models/wallet.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    DatabaseModule.forFeature([
      {
        name: TransactionDocument.name,
        schema: TransactionSchema,
      },
      {
        name: WalletDocument.name,
        schema: WalletSchema,
      },
    ]),
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
  controllers: [WithdrawController],
  providers: [WithdrawalService, TransactionRepository, WalletRepository],
})
export class WithdrawalModule {}
