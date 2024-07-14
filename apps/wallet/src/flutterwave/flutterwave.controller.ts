import { CurrentUser, JwtAuthGuard, UserDto } from '@app/common';
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FlutterwaveService } from './flutterwave.service';
import { Request, Response } from 'express';
import { InitiatePaymentDto } from '../dto/intiate-payment.dto';

@Controller('fund')
export class FlutterwaveController {
  constructor(private readonly flutterwaveService: FlutterwaveService) {}

  @Post('/charge')
  @UseGuards(JwtAuthGuard)
  async getDirectCharge(
    @Body() payload: Record<string, any>,
    @CurrentUser() user: UserDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.flutterwaveService.fundWalletDirectCharge(
      payload,
      req,
      res,
      user,
    );
  }

  @Post('/authorize')
  @UseGuards(JwtAuthGuard)
  async directChargeAuthorize(@Req() req: Request, @Res() res: Response) {
    return this.flutterwaveService.directChargeAuthorize(req, res);
  }

  @Post('/validate')
  @UseGuards(JwtAuthGuard)
  async directChargeValidate(@Req() req: Request, @Res() res: Response) {
    return this.flutterwaveService.directChargeValidate(req, res);
  }

  // @Get('/redirect')
  // @UseGuards(JwtAuthGuard)
  // async directChargeRedirect(@Req() req: Request, @Res() res: Response) {
  //   return this.flutterwaveService.directChargeRedirect(req, res);
  // }

  @Get('/verify')
  @UseGuards(JwtAuthGuard)
  async directChargeVerifyFund(
    @CurrentUser() user: UserDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.flutterwaveService.directChargeVerifyFund(req, res, user);
  }

  @Post('/checkout-url')
  @UseGuards(JwtAuthGuard)
  async directChargeCheckout(
    @Body() initiatePaymentDto: InitiatePaymentDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.flutterwaveService.directChargeCheckout(
      initiatePaymentDto,
      user,
    );
  }
}
