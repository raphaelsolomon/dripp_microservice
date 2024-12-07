import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WalletRepository } from './repositories/wallet.repository';
import {
  AUTH_SERVICE,
  NOTIFICATION_SERVICE,
  successResponse,
  UserDocument,
} from '@app/common';
import { TransactionRepository } from './repositories/transaction.repository';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SendFundDto } from './dto/send-fund.dto';

import { TaskDocument } from 'apps/brand/src/models/task.schema';
import {
  CreateNotificationPayload,
  NotificationPattern,
} from 'apps/notification/src/notification.controller';
import { SubTaskDocument } from 'apps/brand/src/models/sub-task.schema';

import { CryptoPaymentRepository } from './repositories/crypto.repository';
import NOWPaymentsApi, {
  INotificationBody,
  NowPaymentStatus,
} from './nowpayment/NOWPaymentsApi';
import { Request } from 'express';
import { TransactionDocument } from './models/transaction.schema';
import { MongooseTransaction } from '@app/common/database/mongoose-transaction';
import { currencies, CurrencyCode } from './models/wallet.schema';
import bcrypt from 'bcryptjs';
import { ClientSession } from 'mongoose';

export interface SendRewardPayload {
  amount: number | string;
  receiver: string;
  task: TaskDocument;
  sub_task: SubTaskDocument;
}

export interface PaymentMetadata {
  type: 'deposit';
}

@Injectable()
export class WalletService {
  constructor(
    private readonly configService: ConfigService,
    private readonly walletRepository: WalletRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly cryptoPaymentRepository: CryptoPaymentRepository,
    private readonly nowpaymentApi: NOWPaymentsApi,
    private readonly connection: MongooseTransaction,
    @Inject(AUTH_SERVICE) private readonly authClientProxy: ClientProxy,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationClientProxy: ClientProxy,
  ) {}

  async createWallet(payload: { [key: string]: string }) {
    const wallet = await this.walletRepository.create({
      balances: currencies?.map((cur) => ({
        ...cur,
        amount: 0,
        updated_at: new Date().toISOString(),
      })),

      ...payload,
    });
    return wallet;
  }

  async createTransactionPin({
    pin,
    user,
  }: {
    pin: string;
    user: UserDocument;
  }) {
    if (pin.length !== 4)
      throw new BadRequestException('Your PIN should be a 4 digit number');

    const wallet = await this.walletRepository.findOne({
      uuid: user?.wallet_uuid,
    });

    if (wallet?.pin)
      throw new BadRequestException('You have already set your PIN');

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = bcrypt.hashSync(pin, salt);

    await this.walletRepository.findOneAndUpdate(
      { uuid: user?.wallet_uuid },
      { pin: hashedPassword },
    );
  }

  async getWallet({ uuid, route = false }: { [key: string]: any }) {
    try {
      return await this.walletRepository.findOne(
        { uuid },
        route ? '-pinAttempts -pinLocked -pin' : undefined,
      );
    } catch (err) {
      throw new Error(err);
    }
  }

  async getTransactions(
    user: UserDocument,
    payload: { [key: string]: number },
  ) {
    const page: number = payload.page;
    const first: number = payload.first;
    const wallet_uuid: string = user.wallet_uuid;

    const transactions = await this.transactionRepository.getPaginatedDocuments(
      first,
      page,
      { wallet_uuid },
    );
    return transactions;
  }

  async sendFundToUser(user: UserDocument, input: SendFundDto) {
    const username = input.username;
    if (user.account_type === 'user') {
      throw new UnprocessableEntityException(
        'Action not supported on this account type',
      );
    }
    if (user.username === username) {
      throw new HttpException(
        'Action not supported',
        HttpStatus.NOT_ACCEPTABLE,
      );
    }
    const brandWallet = await this.walletRepository.findOne({
      uuid: user.wallet_uuid,
    });

    if (brandWallet.amount_in_fiat <= input.amount) {
      throw new HttpException('Insufficient funds', HttpStatus.NOT_ACCEPTABLE);
    }

    try {
      const receiverInfo = await firstValueFrom(
        this.authClientProxy.send('get_user', { username }),
      );

      const receiverWallet = await this.walletRepository.findOne({
        uuid: receiverInfo.wallet_uuid,
      });

      //update the receiverWallet with the amount sent
      await this.walletRepository.findOneAndUpdate(
        { uuid: receiverWallet.uuid },
        { amount: receiverWallet.amount_in_fiat + input.amount },
      );

      //update the send amount on the sender wallet
      await this.walletRepository.findOneAndUpdate(
        { uuid: brandWallet.uuid },
        { amount: brandWallet.amount_in_fiat - input.amount - 50 }, //$50 transaction fee
      );

      //save the transaction for the receiver
      const receiveTransaction = await this.transactionRepository.create({
        wallet_uuid: receiverWallet.uuid,
        amount: input.amount,
        transaction_details: {},
        tx_ref: new Date().toString(),
        transaction_type: 'transfer',
        transaction: 'credit',
      });

      //save the transaction for the sender
      const senderTransaction = await this.transactionRepository.create({
        wallet_uuid: brandWallet.uuid,
        amount: input.amount,
        transaction_details: {},
        tx_ref: new Date().toString(),
        transaction_type: 'transfer',
        transaction: 'debit',
      });

      //notify the receiver of the transaction
      this.notificationClientProxy.emit('send_fund', {
        receiveTransaction,
        senderTransaction,
      });
      return {
        status: true,
        message: `${input.amount} has been sent to ${receiverInfo.username}`,
      };
    } catch (err) {
      console.log(err);
    }
  }

  async createCampaign({ uuid, amount }: { uuid: string; amount: number }) {
    const transaction = await this.transactionRepository.create({
      wallet_uuid: uuid,
      amount: Number(amount),
      transaction_details: {},
      tx_ref: new Date().toString(),
      transaction_type: 'transfer',
      transaction: 'debit',
    });

    this.notificationClientProxy.emit('campaign_created', transaction);
    return 'success';
  }

  async sendAward(payload: SendRewardPayload) {
    const { amount, receiver } = payload;

    const task = payload.task;

    const subtask = payload?.sub_task;

    const userReceiver: UserDocument = await firstValueFrom(
      this.authClientProxy.send('get_user', { uuid: receiver }),
    );

    const transaction = await this.transactionRepository.create({
      wallet_uuid: userReceiver.wallet_uuid,
      amount: Number(amount),
      transaction_details: {},
      tx_ref: new Date().toString(),
      transaction_type: 'transfer',
      transaction: 'credit',
    });

    // struect the notification payload to be sent to the member
    const notificationPayload: CreateNotificationPayload = {
      to: receiver,
      from: { isBrand: true, sender: task?.brand },
      title: `${subtask?.categoryName} task Submission was approved`,
      type: 'task_approved',
      body: `You have been rewared with #${amount} for completing a ${subtask?.categoryName} in task the ${task?.campaign_title} campaign`,
      metadata: {
        sub_task_uuid: subtask?.uuid,
        campaign_uuid: task?.uuid,
        brand: task?.brand,
        ...transaction,
      },
    };

    //emit an event to the notification service
    this.notificationClientProxy.emit(
      NotificationPattern.CreateNotification,
      notificationPayload,
    );
  }

  async createGiftCard({ uuid, amount, receiver }: { [key: string]: string }) {
    try {
      const wallet = await this.walletRepository.findOne({ uuid });
      if (wallet.amount_in_fiat < Number(amount)) {
        return 'wallet_insufficient_amount';
      }

      const newAmount = wallet.amount_in_fiat - Number.parseInt(amount);
      await this.walletRepository.findOneAndUpdate(
        { uuid },
        { amount: newAmount },
      );
      // if this giftcard is for a particular user instead of community
      if (receiver) {
        const userReceiver: UserDocument = await firstValueFrom(
          this.authClientProxy.send('get_user', { uuid: receiver }),
        );

        const transaction = await this.transactionRepository.create({
          wallet_uuid: userReceiver.wallet_uuid,
          amount: Number(amount),
          transaction_details: {},
          tx_ref: new Date().toString(),
          transaction_type: 'transfer',
          transaction: 'credit',
        });

        this.notificationClientProxy.emit('gift_received', transaction);
      }

      const transaction = await this.transactionRepository.create({
        wallet_uuid: uuid,
        amount: Number(amount),
        transaction_details: {},
        tx_ref: new Date().toString(),
        transaction_type: 'transfer',
        transaction: 'debit',
      });

      this.notificationClientProxy.emit('gift_created', transaction);
      return 'success';
    } catch (err) {
      return 'wallet_not_found';
    }
  }

  async createDiscount({ uuid, amount, receiver }: { [key: string]: string }) {
    try {
      const wallet = await this.walletRepository.findOne({ uuid });
      if (wallet.amount_in_fiat < Number(amount)) {
        return 'wallet_insufficient_amount';
      }

      const newAmount = wallet.amount_in_fiat - Number.parseInt(amount);
      await this.walletRepository.findOneAndUpdate(
        { uuid },
        { amount: newAmount },
      );

      // if this giftcard is for a particular user instead of community
      if (receiver) {
        const userReceiver: UserDocument = await firstValueFrom(
          this.authClientProxy.send('get_user', { uuid: receiver }),
        );

        const transaction = await this.transactionRepository.create({
          wallet_uuid: userReceiver.wallet_uuid,
          amount: Number(amount),
          transaction_details: {},
          tx_ref: new Date().toString(),
          transaction_type: 'transfer',
          transaction: 'credit',
        });

        this.notificationClientProxy.emit('discount_received', transaction);
      }

      const transaction = await this.transactionRepository.create({
        wallet_uuid: uuid,
        amount: Number(amount),
        transaction_details: {},
        tx_ref: new Date().toString(),
        transaction_type: 'transfer',
        transaction: 'debit',
      });

      this.notificationClientProxy.emit('discount_created', transaction);
      return 'success';
    } catch (err) {
      return 'wallet_not_found';
    }
  }

  async getCryptoCurrencies() {
    const response = await this.nowpaymentApi.getCurrencies();

    if ('message' in response) {
      console.log(response?.errors);

      throw new InternalServerErrorException(
        `Could not get currencies at the moment. ${response?.message}`,
      );
    } else {
      return response;
    }
  }

  async createCryptoPayment({
    user,
    price_amount,
    price_currency,
    pay_currency,
  }: {
    user: UserDocument;
    price_amount: number;
    price_currency: string;
    pay_currency: string;
  }) {
    const paymentInvoice = await this.nowpaymentApi.createInvoice({
      ipn_callback_url: this.configService.get('IPN_CALLBACK_URL'),
      order_id: user?.uuid,
      order_description: JSON.stringify({ type: 'deposit' } as PaymentMetadata),
      price_amount,
      price_currency,
      pay_currency,
    });

    if (!paymentInvoice?.id) {
      throw new UnprocessableEntityException((paymentInvoice as any)?.message);
    }

    await this.cryptoPaymentRepository.create({
      created_by: user?.uuid,
      invoice_id: paymentInvoice?.id,
    });

    return paymentInvoice?.invoice_url;
  }

  async paymentWebhookNotification(request: Request) {
    const body: INotificationBody = request.body;

    const headers = request.headers;

    const signature = headers['x-nowpayments-sig'];

    const tnx_ref = String(body?.invoice_id);

    console.log(signature);

    const isValidSignature = this.nowpaymentApi.isValidSignature(
      body,
      signature,
    );

    // if (!isValidSignature)
    //   throw new ForbiddenException('Invalid signature. Forbidden');

    const metadata: PaymentMetadata = JSON.parse(
      body?.order_description || '{}',
    );

    const findPayment = await this.cryptoPaymentRepository.findOne(
      {
        invoice_id: tnx_ref,
      },
      undefined,
      undefined,
      undefined,
      false,
    );

    const user: UserDocument = await firstValueFrom(
      this.authClientProxy.send('get_user', { uuid: body?.order_id }),
    );

    if (!user) throw new NotFoundException('User not found');

    if (!findPayment) throw new NotFoundException('Payment not found');

    if (
      !(
        [
          'confirmed',
          'confirming',
          'partially_paid',
          'finished',
          'failed',
        ] as NowPaymentStatus[]
      ).includes(body?.payment_status)
    ) {
      return successResponse({ message: 'Not needed' });
    }

    let amount: number;

    console.log('REACHED LINE 461');

    if (body?.outcome_currency?.startsWith('usdt')) {
      amount = body?.outcome_amount;
    } else {
      const convertedAmountRes = await this.nowpaymentApi.convertAmountToUSDT({
        amount: body?.actually_paid,
        currency: body?.pay_currency,
      });

      console.log(convertedAmountRes);

      if (!convertedAmountRes?.estimated_amount)
        throw new InternalServerErrorException('Could not convert token');

      amount = convertedAmountRes?.estimated_amount;
    }

    const details = {
      currency_type: 'usdt',
      amount,
      transaction: 'credit',
      transaction_type: 'topup',
      tx_ref: tnx_ref,
      wallet_uuid: user?.wallet_uuid,
      transaction_details: body as any,
    } as TransactionDocument;

    try {
      console.log('REACHED LINE 488');
      await this.connection.transaction(async (session) => {
        await this.transactionRepository.findOneAndUpdateOrCreate(
          { tx_ref: tnx_ref },
          details,
          { queryOptions: { session }, saveOptions: { session } },
        );

        if (
          (['finished', 'partially_paid'] as NowPaymentStatus[]).includes(
            body?.payment_status,
          ) &&
          !findPayment?.paid_to_user_wallet
        ) {
          // Add value to user wallet

          if (!findPayment?.paid_to_user_wallet) {
            await this.walletRepository.findOneAndUpdate(
              {
                uuid: user?.wallet_uuid,
                'balances.code': 'usdttrc20' as CurrencyCode,
              },
              {
                $inc: {
                  'balances.$.amount': Number(amount),
                },
                $set: { 'balances.$.updated_at': new Date().toISOString() },
              },
              { queryOptions: { session } },
            );
          }

          console.log(user?.uuid, tnx_ref);
          // Update invoice tracker to paid so when next this notification is sent user dont get value more than once
          await this.cryptoPaymentRepository.findOneAndUpdate(
            { created_by: user?.uuid, invoice_id: tnx_ref },
            { paid_to_user_wallet: true },
            { queryOptions: { session } },
          );
        }
        return successResponse({ statusCode: 200, message: 'Success' });
      });
    } catch (err) {
      console.log(err);
      throw new HttpException(
        err?.message || 'An error occured',
        err?.statusCode || 500,
      );
    }
  }
}
