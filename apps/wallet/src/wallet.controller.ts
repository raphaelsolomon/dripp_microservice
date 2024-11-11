import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CurrentUser, JwtAuthGuard, UserDocument } from '@app/common';
import { Request } from 'express';
import { SendFundDto } from './dto/send-fund.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('/healthcheck')
  healthCheck(@Req() req: Request) {
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: 'OK',
    };
  }

  @Get('/transactions')
  @UseGuards(JwtAuthGuard)
  async getTransactions(
    @CurrentUser() user: UserDocument,
    @Query() payload: { [key: string]: number },
    @Req() req: Request,
  ) {
    const result = await this.walletService.getTransactions(user, payload);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Post('/send')
  @UseGuards(JwtAuthGuard)
  async getSend(
    @CurrentUser() user: UserDocument,
    @Body() input: SendFundDto,
    @Req() req: Request,
  ) {
    const result = await this.walletService.sendFundToUser(user, input);
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
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
