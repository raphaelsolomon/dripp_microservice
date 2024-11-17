import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WalletRepository } from './repositories/wallet.repository';
import { AUTH_SERVICE, NOTIFICATION_SERVICE, UserDocument } from '@app/common';
import { TransactionRepository } from './repositories/transaction.repository';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SendFundDto } from './dto/send-fund.dto';

@Injectable()
export class WalletService {
  constructor(
    private readonly configService: ConfigService,
    private readonly walletRepository: WalletRepository,
    private readonly transactionRepository: TransactionRepository,
    @Inject(AUTH_SERVICE) private readonly authClientProxy: ClientProxy,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationClientProxy: ClientProxy,
  ) {}

  async createWallet(payload: { [key: string]: string }) {
    const wallet = await this.walletRepository.create({ ...payload });
    return wallet;
  }

  async getWallet({ uuid }: { [key: string]: string }) {
    try {
      return await this.walletRepository.findOne({ uuid });
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

    if (brandWallet.pin !== input.pin) {
      throw new HttpException('Wrong Pin', HttpStatus.NOT_ACCEPTABLE);
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

  async createCampaign({ uuid, amount }: { [key: string]: string }) {
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
    } catch (err) {
      console.log(err);
      return 'wallet_not_found';
    }
  }

  async sendAward(payload: { [key: string]: any }) {
    const { amount, wallet_uuid, receiver, reward_type } = payload;
    const task: { [key: string]: any } = payload.task;
    let newAmount: number;

    const wallet = await this.walletRepository.findOne({ uuid: wallet_uuid });
    if (reward_type === 'FIAT') {
      newAmount = wallet.amount_in_fiat - Number.parseInt(amount);
      await this.walletRepository.findOneAndUpdate(
        { uuid: wallet_uuid },
        { amount_in_fiat: newAmount },
      );
    } else {
      newAmount = wallet.amount_in_usdt - Number.parseInt(amount);
      await this.walletRepository.findOneAndUpdate(
        { uuid: wallet_uuid },
        { amount_in_usdt: newAmount },
      );
    }

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
    const notificationPayload = {
      to: receiver,
      from: { isBrand: true, sender: task?.brand },
      title: `${task.campaign_title} Task Submission was approved`,
      type: 'task',
      body: `You have been rewared with #${amount} for completing the ${task.campaign_title} task`,
      metadata: { ...transaction },
    };

    //emit an event to the notification service
    this.notificationClientProxy.emit(
      'create_notification',
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
}
