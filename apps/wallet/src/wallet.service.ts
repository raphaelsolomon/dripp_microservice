import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WalletRepository } from './wallet.repository';

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
}