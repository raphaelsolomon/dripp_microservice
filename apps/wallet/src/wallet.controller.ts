import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SendRewardPayload, WalletService } from './wallet.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CurrentUser,
  JwtAuthGuard,
  successResponse,
  UserDocument,
} from '@app/common';
import { Request } from 'express';
import { SendFundDto } from './dto/send-fund.dto';
import { currencies } from './models/wallet.schema';
import { WalletPinGuard } from './wallet-pin.guard';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  async getUserWallet(@CurrentUser() user: UserDocument, @Req() req: Request) {
    const result = await this.walletService.getWallet({
      uuid: user?.wallet_uuid,
      route: true,
    });

    return successResponse({ data: result, path: req.url });
  }

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
  @UseGuards(JwtAuthGuard, WalletPinGuard)
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

  @Get('/currencies')
  @UseGuards(JwtAuthGuard)
  async getAllCurrencies(@Req() req: Request) {
    return successResponse({ data: currencies, path: req.url });
  }

  @Get('/crypto/payment/currencies')
  @UseGuards(JwtAuthGuard)
  async getPaymentCryptoCurrencies() {
    const result = await this.walletService.getCryptoCurrencies();
    return successResponse({ data: result });
  }

  @Post('/crypto/webhook')
  async webhookNotifiy(@Req() req: Request) {
    return await this.walletService.paymentWebhookNotification(req);
  }

  @Post('/crypto/payment/create')
  @UseGuards(JwtAuthGuard)
  async createInvoiceUrl(
    @CurrentUser() user: UserDocument,
    @Body()
    payload: {
      price_amount: number;
      price_currency: string;
      pay_currency: string;
    },
    @Req() req: Request,
  ) {
    const result = await this.walletService.createCryptoPayment({
      user,
      ...payload,
    });

    return successResponse({ data: result, path: req.url });
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
  createCampaign(@Payload() payload: any) {
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
  sendAward(@Payload() payload: SendRewardPayload) {
    return this.walletService.sendAward(payload);
  }
}
