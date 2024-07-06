import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CurrentUser, JwtAuthGuard, UserDto } from '@app/common';
import { InitiatePaymentDto } from './dto/intiate-payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/fund')
  getHello(
    @CurrentUser() user: UserDto,
    @Body() initiatePaymentDto: InitiatePaymentDto,
  ) {
    return this.paymentService.initializePayment(initiatePaymentDto, user);
  }
}
