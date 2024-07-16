import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { CurrentUser, JwtAuthGuard, UserDto } from '@app/common';
import { InitiateWithdrawalDto } from './dto/initiate-withdrawal.dto';
import { Request } from 'express';

@Controller('withdrawal')
export class WithdrawController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Get('fee/:currency/:amount')
  @UseGuards(JwtAuthGuard)
  getTransferFee(@Req() req: Request) {
    return this.withdrawalService.getTransferFee(
      req?.params?.currency,
      req?.params?.amount,
    );
  }

  @Get('banks/:country')
  @UseGuards(JwtAuthGuard)
  getBanks(@Req() req: Request) {
    return this.withdrawalService.getBankList(req?.params?.country);
  }

  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  walletInitiateWithdrawal(
    @CurrentUser() user: UserDto,
    @Body() initiateWithdrawalDto: InitiateWithdrawalDto,
  ) {
    return this.withdrawalService.initiateWithdrawal(
      user,
      initiateWithdrawalDto,
    );
  }
}
