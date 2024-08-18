import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CurrentUser, JwtAuthGuard, UserDto } from '@app/common';
import { Response } from 'express';
import { SendFundDto } from './dto/send-fund.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('/healthcheck')
  healthCheck(@Res() res: Response) {
    return res.sendStatus(200);
  }

  @Get('/transactions')
  @UseGuards(JwtAuthGuard)
  getTransactions(
    @CurrentUser() user: UserDto,
    @Query() payload: { [key: string]: number },
  ) {
    return this.walletService.getTransactions(user, payload);
  }

  @Post('/send')
  @UseGuards(JwtAuthGuard)
  getSend(@CurrentUser() user: UserDto, @Body() sendFundDto: SendFundDto) {
    return this.walletService.sendFundToUser(user, sendFundDto);
  }

  @MessagePattern('create_wallet')
  createWallet(@Payload() payload: { [key: string]: string }) {
    console.log(payload);
    return this.walletService.createWallet(payload);
  }

  @MessagePattern('get_wallet')
  getWallet(@Payload() payload: { [key: string]: string }) {
    return this.walletService.getWallet(payload);
  }

  // =======================TASK, DISCOUNT & GIFT CARD =================
  @MessagePattern('create_campaign')
  createCampaign(@Payload() payload: { [key: string]: string }) {
    return this.walletService.createCampaign(payload);
  }

  @MessagePattern('create_giftcard')
  createGiftCard(@Payload() payload: { [key: string]: string }) {
    return this.walletService.createGiftCard(payload);
  }

  @MessagePattern('create_discount')
  createDiscount(@Payload() payload: { [key: string]: string }) {
    return this.walletService.createDiscount(payload);
  }

  @MessagePattern('send_award')
  sendAward(@Payload() payload: { [key: string]: any }) {
    return this.walletService.sendAward(payload);
  }
}
