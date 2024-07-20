import { Controller } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @MessagePattern('create_wallet')
  createWallet(@Payload() payload: { [key: string]: string }) {
    return this.walletService.createWallet(payload);
  }

  @MessagePattern('get_wallet')
  getWallet(@Payload() payload: { [key: string]: string }) {
    return this.walletService.getWallet(payload);
  }
}
