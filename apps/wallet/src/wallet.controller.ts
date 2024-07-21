import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CurrentUser, JwtAuthGuard, UserDto } from '@app/common';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('/transactions')
  @UseGuards(JwtAuthGuard)
  getTransactions(
    @CurrentUser() user: UserDto,
    @Query() payload: { [key: string]: number },
  ) {
    return this.walletService.getTransactions(user, payload);
  }

  @MessagePattern('create_wallet')
  createWallet(@Payload() payload: { [key: string]: string }) {
    return this.walletService.createWallet(payload);
  }

  @MessagePattern('get_wallet')
  getWallet(@Payload() payload: { [key: string]: string }) {
    return this.walletService.getWallet(payload);
  }
}
