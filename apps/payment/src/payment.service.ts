import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import Flutterwave from 'flutterwave-node-v3';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { InitiatePaymentDto } from './dto/intiate-payment.dto';
import { UserDto } from '@app/common';

@Injectable()
export class PaymentService {
  constructor(private readonly configService: ConfigService) {}

  async initializePayment(
    initiatePaymentDto: InitiatePaymentDto,
    user: UserDto,
  ) {
    try {
      const response = await axios.request({
        method: 'POST',
        url: this.configService.get<string>('FLUTTERWAVE_URL'),
        headers: {
          Authorization: `Bearer ${this.configService.get<string>('FLUTTERWAVE_SECRET_KEY')}`,
        },
        data: {
          tx_ref: 'MC-' + Date.now() + '_' + uuidv4(),
          amount: initiatePaymentDto.amount, //number
          currency: `${initiatePaymentDto.currency}`.toUpperCase() ?? 'NGN',
          redirect_url: this.configService.get<string>('REDIRECT_URL'),
          customer: {
            email: user.email,
            name: user.fullname,
          },
        },
      });
      if (response?.data?.status?.toLowerCase() === 'success') {
        return { redirect_url: response.data.data.link };
      } else {
        return response.data;
      }
    } catch (e) {
      return { status: false, message: e };
    }
  }
}
