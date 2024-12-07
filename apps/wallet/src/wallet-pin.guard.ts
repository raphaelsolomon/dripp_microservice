import { UserDocument } from '@app/common';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { WalletRepository } from './repositories/wallet.repository';

@Injectable()
export class WalletPinGuard implements CanActivate {
  constructor(private readonly walletRepository: WalletRepository) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const user: UserDocument = request.user;

    const totalAttempts = 5;

    const pin = String(request?.body?.pin || '');

    const wallet = await this.walletRepository.findOne({
      uuid: user?.wallet_uuid,
    });

    if (wallet?.pinLocked)
      throw new BadRequestException(
        'Your wallet has been locked due to many incorrect attempts, please reset your transaction PIN to unlock your wallet',
      );

    if (!pin) throw new BadRequestException('Please provide your PIN');

    const isMatch = bcrypt.compareSync(pin, wallet?.pin);

    if (!isMatch) {
      if (wallet?.pinAttempts < totalAttempts - 1) {
        await this.walletRepository.findOneAndUpdate(
          { uuid: wallet?.uuid },
          {
            $inc: {
              pinAttempts: 1,
            },
          },
        );
        const trialsLeft = totalAttempts - wallet?.pinAttempts;
        throw new BadRequestException(
          `Incorrect PIN provided. If you provide an incorrect PIN for the next ${trialsLeft - 1} times, your wallet will be locked until you reset your transaction PIN`,
        );
      } else {
        await this.walletRepository.findOneAndUpdate(
          { uuid: wallet?.uuid },
          {
            pinAttempts: 5,
            pinLocked: true,
          },
        );

        throw new BadRequestException(
          'Your wallet has been locked due to many incorrect attempts, please reset your transaction PIN to unlock your wallet',
        );
      }
    }
    if (wallet?.pinAttempts > 0) {
      await this.walletRepository.findOneAndUpdate(
        { uuid: wallet?.uuid },
        { pinAttempts: 0 },
      );
    }
    return true;
  }
}
