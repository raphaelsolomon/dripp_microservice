import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WalletRepository } from './repositories/wallet.repository';
import { UserDto } from '@app/common';
import { TransactionRepository } from './repositories/transaction.repository';

@Injectable()
export class WalletService {
  constructor(
    private readonly configService: ConfigService,
    private readonly walletRepository: WalletRepository,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async createWallet(payload: { [key: string]: string }) {
    const wallet = await this.walletRepository.create({ ...payload });
    return wallet;
  }

  async getWallet({ uuid }: { [key: string]: string }) {
    try {
      return await this.walletRepository.findOne({ uuid });
    } catch (err) {
      throw new Error(err);
    }
  }

  async getTransactions(user: UserDto, payload: { [key: string]: number }) {
    const page: number = payload.page;
    const first: number = payload.first;
    const wallet_uuid: string = user.wallet_uuid;

    const transactions = await this.transactionRepository.getPaginatedDocuments(
      first,
      page,
      { wallet_uuid },
    );
    return transactions;
  }
}
