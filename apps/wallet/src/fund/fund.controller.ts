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
import { Request, Response } from 'express';
import { InitiatePaymentDto } from '../dto/intiate-payment.dto';
import { FundService } from './fund.service';

@Controller('fund')
export class FundController {
  constructor(private readonly fundService: FundService) {}

  @Post('/charge')
  @UseGuards(JwtAuthGuard)
  async getDirectCharge(
    @Body() payload: Record<string, any>,
    @CurrentUser() user: UserDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.fundService.fundWalletDirectCharge(payload, req, res, user);
  }

  @Post('/authorize')
  @UseGuards(JwtAuthGuard)
  async directChargeAuthorize(@Req() req: Request, @Res() res: Response) {
    return this.fundService.directChargeAuthorize(req, res);
  }

  @Post('/validate')
  @UseGuards(JwtAuthGuard)
  async directChargeValidate(@Req() req: Request, @Res() res: Response) {
    return this.fundService.directChargeValidate(req, res);
  }

  // @Get('/redirect')
  // @UseGuards(JwtAuthGuard)
  // async directChargeRedirect(@Req() req: Request, @Res() res: Response) {
  //   return this.fundService.directChargeRedirect(req, res);
  // }

  @Get('/verify')
  @UseGuards(JwtAuthGuard)
  async directChargeVerifyFund(
    @CurrentUser() user: UserDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.fundService.directChargeVerifyFund(req, res, user);
  }

  @Post('/checkout-url')
  @UseGuards(JwtAuthGuard)
  async directChargeCheckout(
    @Body() initiatePaymentDto: InitiatePaymentDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.fundService.directChargeCheckout(initiatePaymentDto, user);
  }
}
