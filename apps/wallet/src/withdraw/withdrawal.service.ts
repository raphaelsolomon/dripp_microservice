import { UserDto } from '@app/common';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InitiateWithdrawalDto } from './dto/initiate-withdrawal.dto';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { WalletRepository } from '../repositories/wallet.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import * as Flutterwave from 'flutterwave-node-v3';

@Injectable()
export class WithdrawalService {
  constructor(
    private readonly configService: ConfigService,
    private readonly walletRepository: WalletRepository,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  flw = new Flutterwave(
    this.configService.get<string>('FLUTTERWAVE_PUBLIC_KEY'),
    this.configService.get<string>('FLUTTERWAVE_SECRET_KEY'),
  );

  async getTransferFee(currency: string, amount: string) {
    const url = this.configService.get<string>('FLUTTERWAVE_URL');
    const secretKey = this.configService.get<string>('FLUTTERWAVE_SECRET_KEY');
    try {
      const response = await axios.request({
        method: 'GET',
        url: url + '/transfers/fee?amount=' + amount + '&currency=' + currency,
        headers: { Authorization: `Bearer ${secretKey}` },
      });
      return response?.data?.data;
    } catch (err) {
      console.log(err);
      throw new Error(err);
    }
  }

  async getBankList(country: string) {
    const url = this.configService.get<string>('FLUTTERWAVE_URL');
    const secretKey = this.configService.get<string>('FLUTTERWAVE_SECRET_KEY');
    const response = await axios.request({
      method: 'GET',
      url: url + '/banks/' + country,
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    return response?.data?.data;
  }

  async initiateWithdrawal(
    user: UserDto,
    initiateWithdrawalDto: InitiateWithdrawalDto,
  ) {
    if (user.account_type !== 'user') {
      throw new HttpException(
        `Actio n not supported in this account type`,
        HttpStatus.NOT_ACCEPTABLE,
      );
    }
    const uuid = user.wallet_uuid;
    const wallet = await this.walletRepository.findOne({ uuid });
    if (wallet.amount < initiateWithdrawalDto.amount) {
      throw new HttpException(`Insufficient funds`, HttpStatus.NOT_ACCEPTABLE);
    }

    const response = await this.flw.Transfer.initiate({
      ...initiateWithdrawalDto,
      reference: 'WD-' + Date.now() + '_' + uuidv4(),
    });

    if (response?.status === 'success') {
      let { amount } = wallet;
      amount = amount - initiateWithdrawalDto.amount;
      await this.walletRepository.findOneAndUpdate({ uuid }, { amount });
      await this.transactionRepository.create({
        wallet_uuid: user.wallet_uuid,
        tx_ref: response?.data?.reference,
        amount: response?.data?.amount,
        transaction_type: 'withdraw',
        transaction_details: { ...response },
        transaction: 'debit',
      });
    }
    return response;
  }
}
