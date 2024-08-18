import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WalletRepository } from './repositories/wallet.repository';
import { AUTH_SERVICE, NOTIFICATION_SERVICE, UserDto } from '@app/common';
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

  async getTransactions(user: UserDto, payload: { [key: string]: number }) {
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

  async sendFundToUser(user: UserDto, sendFundDto: SendFundDto) {
    const username = sendFundDto.username;
    if (user.account_type === 'user') {
      throw new HttpException(
        'Action not supported on this account type',
        HttpStatus.NOT_ACCEPTABLE,
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

    if (brandWallet.amount <= sendFundDto.amount) {
      throw new HttpException('Insufficient funds', HttpStatus.NOT_ACCEPTABLE);
    }

    if (brandWallet.pin !== sendFundDto.pin) {
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
        { amount: receiverWallet.amount + sendFundDto.amount },
      );

      //update the send amount on the sender wallet
      await this.walletRepository.findOneAndUpdate(
        { uuid: brandWallet.uuid },
        { amount: brandWallet.amount - sendFundDto.amount - 50 }, //$50 transaction fee
      );

      //save the transaction for the receiver
      const receiveTransaction = await this.transactionRepository.create({
        wallet_uuid: receiverWallet.uuid,
        amount: sendFundDto.amount,
        transaction_details: {},
        tx_ref: new Date().toString(),
        transaction_type: 'transfer',
        transaction: 'credit',
      });

      //save the transaction for the sender
      const senderTransaction = await this.transactionRepository.create({
        wallet_uuid: brandWallet.uuid,
        amount: sendFundDto.amount,
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
        message: `${sendFundDto.amount} has been sent to ${receiverInfo.username}`,
      };
    } catch (err) {
      console.log(err);
    }
  }

  async createCampaign({ uuid, amount }: { [key: string]: string }) {
    try {
      const wallet = await this.walletRepository.findOne({ uuid });
      if (wallet.amount < Number(amount)) {
        return 'wallet_insufficient_amount';
      }

      const newAmount = wallet.amount - Number.parseInt(amount);
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

  async createGiftCard({ uuid, amount, receiver }: { [key: string]: string }) {
    try {
      const wallet = await this.walletRepository.findOne({ uuid });
      if (wallet.amount < Number(amount)) {
        return 'wallet_insufficient_amount';
      }

      const newAmount = wallet.amount - Number.parseInt(amount);
      await this.walletRepository.findOneAndUpdate(
        { uuid },
        { amount: newAmount },
      );
      // if this giftcard is for a particular user instead of community
      if (receiver) {
        const userReceiver: UserDto = await firstValueFrom(
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
      if (wallet.amount < Number(amount)) {
        return 'wallet_insufficient_amount';
      }

      const newAmount = wallet.amount - Number.parseInt(amount);
      await this.walletRepository.findOneAndUpdate(
        { uuid },
        { amount: newAmount },
      );

      // if this giftcard is for a particular user instead of community
      if (receiver) {
        const userReceiver: UserDto = await firstValueFrom(
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
