import { BRAND_SERVICE, NOTIFICATION_SERVICE, UserDto } from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { UserRepository } from '../users/repositories/users.repository';

@Injectable()
export class SearchService {
  constructor(
    readonly userRepository: UserRepository,
    @Inject(BRAND_SERVICE) readonly brandClientProxy: ClientProxy,
    @Inject(NOTIFICATION_SERVICE) readonly notificationProxy: ClientProxy,
  ) {}

  async searchDocuments(user: UserDto, input: string) {
    const users = await this.userRepository.find({
      username: { $regex: input, $options: 'i' },
    });

    try {
      const brandResult = await firstValueFrom(
        this.brandClientProxy.send('search', { input }),
      );

      return {
        users: users,
        ...brandResult,
      };
    } catch (err) {
      console.error(err);
    }
  }
}
