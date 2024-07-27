/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BrandRepository } from './repositories/brand.repository';
import {
  AUTH_SERVICE,
  CloudinaryService,
  NOTIFICATION_SERVICE,
  PopulateDto,
  UserDto,
  WALLET_SERVICE,
} from '@app/common';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { CreateTaskDto } from './dto/task/create-task.dto';
import { MemberRepository } from './repositories/member.repository';
import { firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { CreatePostDto } from './dto/post/create-post.dto';
import { PostRepository } from './repositories/post.repository';
import { UpdatePostDto } from './dto/post/update-post.dto';
import { TaskRepository } from './repositories/task.repository';
import { UpdateTaskDto } from './dto/task/update-task.dto';
import { BrandDocument } from './models/brand.schema';
import { CreateDiscountDto } from './dto/discount/create-discount.dto';
import { DiscountRepository } from './repositories/discount.repository';
import { CreateGiftCardDto } from './dto/giftcard/create-giftcard.dto';
import { GiftCardRepository } from './repositories/giftcard.repository';
import { UpdateGiftCardDto } from './dto/giftcard/update-giftcard.dto';
import { UpdateDiscountDto } from './dto/discount/update-discount.dto';
import { CreateMemberShipMailDto } from './dto/membership-mail/create-membership-mail.dto';
import { MemberShipMailRepository } from './repositories/membership-mail.repository';
import { UpdateMemberShipMailDto } from './dto/membership-mail/update-membership-mail.dto';
import { CardRepository } from './repositories/card.repository';
import { Request } from 'express';
import { CardDto } from './dto/card/card.dto';

@Injectable()
export class AppService {
  constructor(
    private readonly brandRepository: BrandRepository,
    private readonly memberRepository: MemberRepository,
    private readonly postRepository: PostRepository,
    private readonly taskRepository: TaskRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly discountRepository: DiscountRepository,
    private readonly giftcardRepository: GiftCardRepository,
    private readonly membershipMailRepository: MemberShipMailRepository,
    private readonly cardRepository: CardRepository,
    @Inject(AUTH_SERVICE) private readonly authClientproxy: ClientProxy,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationClientProxy: ClientProxy,
    @Inject(WALLET_SERVICE) private readonly walletClientproxy: ClientProxy,
  ) {}

  async getBrand(user: UserDto) {
    return await this.brandRepository.findOne({ uuid: user.brand_uuid });
  }

  async createBrand(payload: any) {
    const brand = await this.brandRepository.create({ ...payload });
    return { ...brand };
  }

  async updatebrand(user: UserDto, updatebrandDto: UpdateBrandDto) {
    try {
      if (updatebrandDto.username) {
        await firstValueFrom(
          this.authClientproxy.send('update_username', {
            username: updatebrandDto.username,
            _id: user._id,
          }),
        );
      }
      return await this.brandRepository.findOneAndUpdate(
        { uuid: user.brand_uuid },
        { ...updatebrandDto },
      );
    } catch (err) {
      throw new HttpException(err, HttpStatus.NOT_FOUND);
    }
  }

  async createPost(createPostDto: CreatePostDto, user: UserDto) {
    try {
      if (createPostDto?.media) {
        const cloudinary = await this.cloudinaryService.uploadFile(
          createPostDto.media,
          'posts',
        );
        createPostDto.mediaUrl = cloudinary.url;
      }
      return await this.postRepository.create({
        brand: user.brand_uuid,
        ...createPostDto,
      });
    } catch (err) {
      throw new Error(err);
    }
  }

  async updatePost(updatePostDto: UpdatePostDto, user: UserDto) {
    try {
      if (updatePostDto?.media) {
        const cloudinary = await this.cloudinaryService.uploadFile(
          updatePostDto.media,
          'posts',
        );
        updatePostDto.mediaUrl = cloudinary.url;
      }
      return await this.postRepository.findOneAndUpdate(
        {
          uuid: updatePostDto.post_uuid,
          brand: user.brand_uuid,
        },
        { ...updatePostDto },
      );
    } catch (err) {
      throw new Error(err);
    }
  }

  async deletePost(uuid: string, user: UserDto) {
    try {
      await this.postRepository.findOneAndDelete({
        uuid,
        brand: user.brand_uuid,
      });

      return {
        status: true,
        message: 'Post deleted successfully',
      };
    } catch (err) {
      throw new Error(`Unable to dlete post, ${err}`);
    }
  }

  async getPosts(user: UserDto, payload: { [key: string]: number }) {
    if (user.account_type === 'user') {
      throw new HttpException(
        `Action not supported on the account type.`,
        HttpStatus.NOT_FOUND,
      );
    }
    const populate: PopulateDto = {
      path: 'brand',
      model: BrandDocument.name,
      localField: 'brand',
      foreignField: 'uuid',
    };

    const first: number = payload.first ?? 20;
    const page: number = payload.page ?? 1;

    const posts = await this.postRepository.getPaginatedDocuments(
      first,
      page,
      {
        brand: user.brand_uuid,
      },
      null,
      populate,
    );
    return { ...posts };
  }

  async getBrandMembers(user: UserDto, payload: { [key: string]: number }) {
    if (user.account_type === 'users') {
      throw new HttpException(
        `Action not allowed on this account type`,
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    const first: number = payload.first ?? 20;
    const page: number = payload.page ?? 1;

    const { brand_uuid } = user;
    const members = await this.memberRepository.getPaginatedDocuments(
      first,
      page,
      {
        brand: brand_uuid,
      },
      null,
      null,
    );

    const { paginationInfo, data } = members;
    for (let i = 0; i < data.length; i++) {
      const member: UserDto = await firstValueFrom(
        this.authClientproxy.send('get_user', { uuid: data[i].member_uuid }),
      );
      if (user) {
        const { fullname, email, avatar, username, wallet_uuid } = member;
        delete data[i].member_uuid;
        data[i]['member_details'] = {
          fullname,
          email,
          avatar,
          username,
          wallet_uuid,
        };
      }
    }
    return {
      data,
      paginationInfo,
    };
  }

  async createBrandTask(user: UserDto, createTaskDto: CreateTaskDto) {
    const cloudinary = await this.cloudinaryService.uploadFile(
      createTaskDto.campaign_banner,
      'campaign-banners',
    );
    if (cloudinary) {
      return await this.taskRepository.create({
        campaign_banner_url: cloudinary.url,
        brand: user.brand_uuid,
        ...createTaskDto,
      });
    }
    throw new Error('Unable to upload campaign banner');
  }

  async updateBrandTask(user: UserDto, updateTaskDto: UpdateTaskDto) {
    if (updateTaskDto.campaign_banner) {
      const cloudinary = await this.cloudinaryService.uploadFile(
        updateTaskDto.campaign_banner,
        'campaign-banners',
      );
      updateTaskDto.bannerUrl = cloudinary.url;
    }
    return await this.taskRepository.findOneAndUpdate(
      {
        uuid: updateTaskDto.task_uuid,
        brand: user.brand_uuid,
      },
      { ...updateTaskDto },
    );
  }

  async addMemberToBrands(payload: { [key: string]: string | [string] }) {
    for (const brand_uuid of payload.brand_uuids) {
      await this.memberRepository.create({
        brand: brand_uuid,
        member_uuid: payload.user_uuid as string,
      });
      try {
        const memberShip = await this.membershipMailRepository.findOne({
          brand: brand_uuid,
        });
        this.notificationClientProxy.emit('membership_mail', {
          title: memberShip.title,
          body: memberShip.body,
          type: 'membership-mail',
          to: payload.user_uuid as string,
          from: { isbrand: true, sender: brand_uuid },
        });
      } catch (error) {
        console.log('No membership email found');
      }
    }
    console.log('member added');
  }

  async addMemberToBrand(payload: { [key: string]: string }) {
    const member_uuid: string = payload.member_uuid;
    const brand: string = payload.brand_uuid;

    const result = await this.memberRepository.findOneOrCreate(
      { member_uuid, brand },
      { member_uuid, brand },
    );
    try {
      const memberShip = await this.membershipMailRepository.findOne({ brand });
      this.notificationClientProxy.emit('membership_mail', {
        title: memberShip.title,
        body: memberShip.body,
        type: 'membership-mail',
        to: member_uuid,
        from: { isbrand: true, sender: brand },
      });
    } catch (error) {
      console.log('No membership email found');
    }

    return result;
  }

  async removeMemberFromBrand(payload: { [key: string]: string }) {
    try {
      await this.memberRepository.findOneAndDelete({ ...payload });
      const uuid = payload.brand_uuid;
      const brand = await this.brandRepository.findOne({ uuid });
      return { status: true, message: `Unsubscribed from ${brand.brand_name}` };
    } catch (err) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }
  }

  async getDiscount(user: UserDto, payload: { [key: string]: number }) {
    if (user.account_type === 'user') {
      throw new HttpException(
        `Action not allowed on this account type`,
        HttpStatus.NOT_ACCEPTABLE,
      );
    }
    const first: number = payload.first;
    const page: number = payload.page;
    return await this.discountRepository.getPaginatedDocuments(first, page, {
      brand: user.brand_uuid,
    });
  }

  async getBrandTask(user: UserDto, payload: { [key: string]: number }) {
    const populate: PopulateDto = {
      path: 'brand',
      model: BrandDocument.name,
      localField: 'brand',
      foreignField: 'uuid',
    };
    const first: number = payload.first ?? 20;
    const page: number = payload.page ?? 1;

    return await this.taskRepository.getPaginatedDocuments(
      first,
      page,
      { brand: user.brand_uuid },
      null,
      populate,
    );
  }

  async getChannels(payload: { [key: string]: number | string }) {
    const page: number = <number>payload.page;
    const first: number = <number>payload.first;
    const user_uuid: string = <string>payload.user_uuid;

    const result = await this.brandRepository.getPaginatedDocuments(
      first,
      page,
      {},
    );
    const { data, paginationInfo } = result;

    for (let i = data.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [data[i], data[j]] = [data[j], data[i]];
    }

    for (let i = 0; i < data.length; i++) {
      const brandMembers = [];
      const brand_uuid = data[i].uuid;
      const members = await this.memberRepository.find({ brand_uuid });
      const index = members.findIndex((v) => v.member_uuid === user_uuid);
      if (index > -1) {
        data[i]['isSubscribed'] = true;
      } else {
        data[i]['isSubscribed'] = false;
      }
      for (const member of members) {
        const uuid = member.member_uuid;
        const memberData: UserDto = await firstValueFrom(
          this.authClientproxy.send('get_user', { uuid }),
        );
        brandMembers.push(memberData);
      }
      data[i]['members_count'] = brandMembers.length;
      data[i]['members'] = brandMembers;
    }

    return {
      data,
      paginationInfo,
    };
  }

  async getTaskFromBrands(payload: { [key: string]: string | number }) {
    const member_uuid: string = <string>payload.member_uuid;
    const populate: PopulateDto = {
      path: 'brand',
      model: BrandDocument.name,
      localField: 'brand',
      foreignField: 'uuid',
    };
    // const first: number = <number>payload.first;
    // const page: number = <number>payload.page;

    /* get channel/brands users are subscribed to and also brands they are not subscribed to */
    const subscribeBrands = await this.memberRepository.find({ member_uuid });
    const subscribeBrandsUuids = subscribeBrands.map((member) => member.brand);
    console.log(subscribeBrandsUuids);
    const subscribedTasks = await this.taskRepository.find(
      {
        brand: { $in: subscribeBrandsUuids },
      },
      populate,
    );

    const unsubscribeTasks = await this.taskRepository.find(
      {
        brand: { $nin: subscribeBrandsUuids },
      },
      populate,
    );

    for (let i = subscribedTasks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [subscribedTasks[i], subscribedTasks[j]] = [
        subscribedTasks[j],
        subscribedTasks[i],
      ];
    }

    return [...subscribedTasks, ...unsubscribeTasks];
  }

  async createDiscount(user: UserDto, createDiscountDto: CreateDiscountDto) {
    if (user.account_type === 'user') {
      throw new HttpException(
        `Action not allowed on this account type`,
        HttpStatus.NOT_ACCEPTABLE,
      );
    }
    // get wallet balance from wallet service...
    try {
      const wallet = await firstValueFrom(
        this.walletClientproxy.send('get_wallet', { uuid: user.wallet_uuid }),
      );
      if (createDiscountDto.discount_amount > wallet.amount) {
        throw new HttpException(
          'Insufficient wallet balance',
          HttpStatus.NOT_ACCEPTABLE,
        );
      }
      return await this.discountRepository.create({
        ...createDiscountDto,
        brand: user.brand_uuid,
      });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createGiftCard(user: UserDto, createGiftCardDto: CreateGiftCardDto) {
    if (user.account_type === 'user') {
      throw new HttpException(
        `Action not allowed on this account type`,
        HttpStatus.NOT_ACCEPTABLE,
      );
    }
    // get wallet balance from wallet service...
    try {
      const wallet = await firstValueFrom(
        this.walletClientproxy.send('get_wallet', { uuid: user.wallet_uuid }),
      );
      if (createGiftCardDto.gift_card_campaign_amount > wallet.amount) {
        throw new HttpException(
          'Insufficient wallet balance',
          HttpStatus.NOT_ACCEPTABLE,
        );
      }
      return await this.giftcardRepository.create({
        ...createGiftCardDto,
        brand: user.brand_uuid,
      });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateGiftCard(user: UserDto, updateGiftCardDto: UpdateGiftCardDto) {
    if (user.account_type === 'user') {
      throw new HttpException(
        `Action not allowed on this account type`,
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    const { gift_card_campaign_amount, ...details } = updateGiftCardDto;
    return await this.giftcardRepository.findOneAndUpdate(
      { uuid: updateGiftCardDto.gift_card_uuid, brand: user.brand_uuid },
      details,
    );
  }

  async updateDiscount(user: UserDto, updateDiscountDto: UpdateDiscountDto) {
    if (user.account_type === 'user') {
      throw new HttpException(
        `Action not allowed on this account type`,
        HttpStatus.NOT_ACCEPTABLE,
      );
    }
    const { discount_amount, ...details } = updateDiscountDto;
    return await this.discountRepository.findOneAndUpdate(
      { uuid: updateDiscountDto.discount_uuid, brand: user.brand_uuid },
      { ...details },
    );
  }

  async getRecommendedChannels(payload: { [key: string]: number | string }) {
    const first: number = <number>payload.first ?? 20;
    const page: number = <number>payload.page ?? 1;

    const { data, paginationInfo } =
      await this.memberRepository.getPaginatedDocuments(first, page, {
        brand: { $ne: null },
      });

    const memberCounts = data.reduce((acc, member) => {
      acc[member.brand] = (acc[member.brand] || 0) + 1;
      return acc;
    }, {});

    const sortedBrandIds = Object.keys(memberCounts)
      .sort((a, b) => memberCounts[b] - memberCounts[a])
      .slice(0, 10);

    const recommendedBrands = await this.brandRepository.find({
      uuid: { $in: sortedBrandIds },
    });
    return { data: recommendedBrands, paginationInfo };
  }

  async createMemberShipMail(
    user: UserDto,
    createMemberShipMailDto: CreateMemberShipMailDto,
  ) {
    if (user.account_type === 'user') {
      throw new HttpException(
        `Action not allowed on this account type`,
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    try {
      return await this.membershipMailRepository.findOne({
        brand: user.brand_uuid,
      });
    } catch (e) {
      return await this.membershipMailRepository.create({
        ...createMemberShipMailDto,
        brand: user.brand_uuid,
      });
    }
  }

  async updateMemberShipMail(
    user: UserDto,
    updateMemberShipMailDto: UpdateMemberShipMailDto,
  ) {
    if (user.account_type === 'user') {
      throw new HttpException(
        `Action not allowed on this account type`,
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    try {
      return await this.membershipMailRepository.findOneAndUpdate(
        { brand: user.brand_uuid },
        { ...updateMemberShipMailDto },
      );
    } catch (e) {
      throw new HttpException(
        'This brand does not exist',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async getPaymentCard(user: UserDto, req: Request) {
    if (user.account_type === 'user') {
      throw new HttpException(
        `Action not supported on the account type.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const first: number = Number.parseInt(`${req.query.first}`) ?? 20;
    const page: number = Number.parseInt(`${req.query.page}`) ?? 1;
    return await this.cardRepository.getPaginatedDocuments(first, page, {
      brand: user.brand_uuid,
    });
  }

  async deletePaymentCard(uuid: string, user: UserDto) {
    if (user.account_type === 'user') {
      throw new HttpException(
        `Action not supported on the account type.`,
        HttpStatus.NOT_FOUND,
      );
    }
    try {
      await this.cardRepository.findOneAndDelete({
        uuid,
        brand: user.brand_uuid,
      });
      return { status: true, message: 'Card deleted successfully' };
    } catch (e) {
      throw new HttpException('Card was not found', HttpStatus.NOT_FOUND);
    }
  }

  async addCard(cardDto: CardDto, user: UserDto) {
    if (user.account_type === 'user') {
      throw new HttpException(
        `Action not supported on the account type.`,
        HttpStatus.NOT_FOUND,
      );
    }

    return await this.cardRepository.create({
      ...cardDto,
      brand: user.brand_uuid,
    });
  }
}
