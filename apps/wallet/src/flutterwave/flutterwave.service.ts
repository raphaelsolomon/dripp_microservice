/* eslint-disable @typescript-eslint/no-unused-vars */
import { UserDto } from '@app/common';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import * as Flutterwave from 'flutterwave-node-v3';
import { createClient, RedisClientType } from 'redis';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { InitiatePaymentDto } from '../dto/intiate-payment.dto';
import { TransactionRepository } from './transaction.repository';
import { WalletRepository } from '../wallet.repository';

@Injectable()
export class FlutterwaveService {
  private client: RedisClientType;
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly walletRepository: WalletRepository,
    private readonly configService: ConfigService,
  ) {
    this.connectRedit(configService.get<string>('REDIS_CONNECT_URL'));
  }

  async connectRedit(url: string) {
    this.client = createClient({ url });
    this.client
      .on('error', (err) => console.log('Redis Client Error', err))
      .on('ready', () => console.log('Redis client connected'))
      .connect();
  }

  flw = new Flutterwave(
    this.configService.get<string>('FLUTTERWAVE_PUBLIC_KEY'),
    this.configService.get<string>('FLUTTERWAVE_SECRET_KEY'),
  );

  async fundWalletDirectCharge(
    payload: Record<string, any>,
    req: Request,
    res: Response,
    user: UserDto,
  ) {
    const paymentBody = {
      ...payload,
      email: user.email,
      fullname: user.fullname,
      tx_ref: 'MC-' + Date.now() + '_' + uuidv4(),
      redirect_url: this.configService.get<string>('REDIRECT_URL'),
      enckey: this.configService.get<string>('FLUTTERWAVE_ENC_KEY'),
    };

    const response = await this.flw.Charge.card(paymentBody);
    switch (response?.meta?.authorization?.mode) {
      case 'pin': //[ 'pin' ]
      case 'avs_noauth': //[ 'city', 'address', 'state', 'country', 'zipcode' ]
        req.session['charge_payload'] = payload;
        req.session['auth_fields'] = response.meta.authorization.fields;
        req.session['auth_mode'] = response.meta.authorization.mode;
        return res.redirect('/direct-charge/authorize');
      case 'redirect':
        await this.client.set(
          `txref-${response.data.tx_ref}`,
          response.data.id,
        );
        const authUrl = response.meta.authorization.redirect;
        return res.redirect(authUrl);
      default:
        const transactionId = response.data.id;
        const transaction = await this.flw.Transaction.verify({
          id: transactionId,
        });
        return this.transactionDetails(transaction, res);
    }
  }

  async directChargeAuthorize(req: Request, res: Response) {
    const payload = req.session['charge_payload'];
    payload.authorization = {
      mode: req.session['auth_mode'],
    };
    req.session['auth_fields'].forEach((field) => {
      payload.authorization.field = req.body[field];
    });
    const response = await this.flw.Charge.card(payload);

    switch (response?.meta?.authorization?.mode) {
      case 'otp':
        req.session['flw_ref'] = response.data.flw_ref;
        return res.redirect('/direct-charge/validate');
      case 'redirect':
        const authUrl = response.meta.authorization.redirect;
        return res.redirect(authUrl);
      default:
        const transactionId = response.data.id;
        const transaction = await this.flw.Transaction.verify({
          id: transactionId,
        });
        return this.transactionDetails(transaction, res);
    }
  }

  async directChargeValidate(req: Request, res: Response) {
    const response = await this.flw.Charge.validate({
      otp: req.body.otp,
      flw_ref: req.session['flw_ref'],
    });
    if (
      response.data.status === 'successful' ||
      response.data.status === 'pending'
    ) {
      const transactionId = response.data.id;
      const transaction = this.flw.Transaction.verify({
        id: transactionId,
      });
      return this.transactionDetails(transaction, res);
    }

    return res.json({ message: 'payment failed' });
  }

  async directChargeVerifyFund(req: Request, res: Response, user: UserDto) {
    const tx_ref = req.query.tx_ref.toString();
    const tx_id = await this.client.get(`txref-${tx_ref}`);
    const id = req.query.transaction_id ?? tx_id;
    const transaction = await this.flw.Transaction.verify({ id });
    const wallet_uuid = user.wallet_uuid;
    const filterQuery = { tx_id, wallet_uuid };
    try {
      await this.transactionRepository.findOne(filterQuery);
    } catch (err) {
      const { meta, account_id, ...details } = transaction.data;
      await this.transactionRepository.create({
        wallet_uuid: user.wallet_uuid,
        tx_ref: tx_ref,
        amount: transaction.data.amount,
        transaction_type: 'topup',
        transaction_details: { ...details },
      });
      const wallet = await this.walletRepository.findOne({ uuid: wallet_uuid });
      let { amount } = wallet;
      amount = amount + transaction.data.amount_settled;
      await this.walletRepository.findOneAndUpdate(
        { uuid: wallet_uuid },
        { amount },
      );
    }
    return this.transactionDetails(transaction, res);
  }

  transactionDetails(transaction: any, res: Response) {
    if (transaction.data.status == 'successful') {
      return res.json({ ...transaction.data });
    } else if (transaction.data.status == 'pending') {
      return res.json({ ...transaction.data });
    } else {
      return res.json({ ...transaction.data });
    }
  }

  async directChargeCheckout(
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
          redirect_url:
            initiatePaymentDto.redirect_url ??
            this.configService.get<string>('REDIRECT_URL'),
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

// const payload = {
// card_number: req.body.card_number,
// cvv: req.body.card_cvv,
// expiry_month: req.body.card_expiry_year,
// expiry_year: req.body.card_expiry_year,
// currency: 'NGN',
// amount: product.price,
// email: req.user.email,
// fullname: req.body.card_name,
// phone_number: req.user.phone_number,
// // Generate a unique transaction reference
// tx_ref: generateTransactionReference(),
// redirect_url: process.env.APP_BASE_URL + '/pay/redirect',
// enckey: process.env.FLW_ENCRYPTION_KEY
// }
