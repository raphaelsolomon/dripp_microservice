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
  async getTransferFee(@Req() req: Request) {
    const result = await this.withdrawalService.getTransferFee(
      req?.params?.currency,
      req?.params?.amount,
    );
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Get('banks/:country')
  @UseGuards(JwtAuthGuard)
  async getBanks(@Req() req: Request) {
    const result = await this.withdrawalService.getBankList(
      req?.params?.country ?? 'NG',
    );
    return {
      statusCode: 200,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }

  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  async walletInitiateWithdrawal(
    @CurrentUser() user: UserDto,
    @Body() input: InitiateWithdrawalDto,
    @Req() req: Request,
  ) {
    const result = await this.withdrawalService.initiateWithdrawal(user, input);
    return {
      statusCode: 201,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: 'Successful',
      success: true,
      data: result,
    };
  }
}
