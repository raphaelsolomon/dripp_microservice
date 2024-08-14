import { BRAND_SERVICE, NOTIFICATION_SERVICE, UserDto } from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { UserRepository } from '../users/repositories/users.repository';
import { GiftCardRepository as UserGiftCardRepository } from '@app/common';
import { DiscountRepository as UserDiscountRepository } from '@app/common';

@Injectable()
export class SearchService {
  constructor(
    readonly userRepository: UserRepository,
    readonly userGiftCardRepository: UserGiftCardRepository,
    readonly userDiscountRepository: UserDiscountRepository,
    @Inject(BRAND_SERVICE) readonly brandClientProxy: ClientProxy,
    @Inject(NOTIFICATION_SERVICE) readonly notificationProxy: ClientProxy,
  ) {}

  async searchDocuments(user: UserDto, input: string) {
    const brandResult = await firstValueFrom(
      this.brandClientProxy.send('search', { input, user }),
    );

    if (user.account_type === 'business') {
      const memberUuids: string[] = brandResult.member_uuids;
      const { tasks, discounts, giftCards, posts } = brandResult;
      const users = await this.userRepository.find({
        username: { $regex: input, $options: 'i' },
        account_type: { $ne: 'business' },
      });
      const members = users.filter((u) => memberUuids.includes(u.uuid));
      return { members, tasks, discounts, giftCards, posts };
    } else {
      const user_uuid = user.uuid;
      const { tasks, brands, posts } = brandResult;
      const giftCards = await this.userGiftCardRepository.find({ user_uuid });
      const discounts = await this.userDiscountRepository.find({ user_uuid });
      return { tasks, brands, posts, giftCards, discounts };
    }
  }
}
