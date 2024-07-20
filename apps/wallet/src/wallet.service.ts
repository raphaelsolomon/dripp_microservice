import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WalletRepository } from './repositories/wallet.repository';

@Injectable()
export class WalletService {
  constructor(
    private readonly configService: ConfigService,
    private readonly walletRepository: WalletRepository,
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
}
